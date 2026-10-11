import os
from pathlib import Path

from .analytics import (
    create_dataframe,
    spending_analysis,
    detect_unusual_expenses,
    predict_future_spending,
    generate_insights
)

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pwdlib import PasswordHash
import jwt
from datetime import datetime, timedelta, timezone

from .database import SessionLocal, engine, Base
from .models import User, Expense
from .schemas import (
    UserCreate,
    UserLogin,
    ExpenseCreate,
    ExpenseUpdate
)


Base.metadata.create_all(bind=engine)

app = FastAPI(title="SmartSpend API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


password_hash = PasswordHash.recommended()

SECRET_KEY = os.environ["SECRET_KEY"]
ALGORITHM = "HS256"

security = HTTPBearer()


def clean_payment(value):
    text = value.strip()

    if text.lower() == "upi":
        return "UPI"

    return text.title()


def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


def create_token(user_id):
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    try:
        payload = jwt.decode(
            credentials.credentials,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("user_id")

        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return user


@app.get("/health")
def health():
    return {
        "message": "Welcome to SmartSpend API!"
    }


# -------------------------
# USER REGISTRATION
# -------------------------

@app.post("/users")
def create_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(
        User.email == user.email.strip().lower()
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    hashed_password = password_hash.hash(
        user.password
    )

    new_user = User(
        name=user.name,
        email=user.email.strip().lower(),
        password_hash=hashed_password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User created successfully!",
        "user_id": new_user.id
    }


# -------------------------
# LOGIN
# -------------------------

@app.post("/login")
def login(
    user: UserLogin,
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(
        User.email == user.email.strip().lower()
    ).first()

    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not password_hash.verify(
        user.password,
        existing_user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    token = create_token(existing_user.id)

    return {
        "access_token": token,
        "token_type": "bearer"
    }


# -------------------------
# ADD EXPENSE
# -------------------------

@app.post("/expenses")
def create_expense(
    expense: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_expense = Expense(
        user_id=current_user.id,
        amount=expense.amount,
        category=expense.category,
        description=expense.description,
        notes=expense.notes,
        expense_date=expense.expense_date,
        payment_method=clean_payment(expense.payment_method)
    )

    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)

    return {
        "message": "Expense added successfully!",
        "expense_id": new_expense.id
    }


# -------------------------
# GET EXPENSES
# -------------------------

@app.get("/expenses")
def get_expenses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Expense).filter(
        Expense.user_id == current_user.id
    ).order_by(
        Expense.expense_date.desc()
    ).all()


# -------------------------
# UPDATE EXPENSE
# -------------------------

@app.put("/expenses/{expense_id}")
def update_expense(
    expense_id: int,
    expense: ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing_expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user.id
    ).first()

    if not existing_expense:
        raise HTTPException(
            status_code=404,
            detail="Expense not found"
        )

    existing_expense.amount = expense.amount
    existing_expense.category = expense.category
    existing_expense.description = expense.description
    existing_expense.notes = expense.notes
    existing_expense.expense_date = expense.expense_date
    existing_expense.payment_method = clean_payment(
        expense.payment_method
    )

    db.commit()

    return {
        "message": "Expense updated successfully!"
    }


# -------------------------
# DELETE EXPENSE
# -------------------------

@app.delete("/expenses/{expense_id}")
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user.id
    ).first()

    if not expense:
        raise HTTPException(
            status_code=404,
            detail="Expense not found"
        )

    db.delete(expense)
    db.commit()

    return {
        "message": "Expense deleted successfully!"
    }


# =========================
# SMART ANALYTICS
# =========================

@app.get("/analytics")
def get_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    expenses = db.query(Expense).filter(
        Expense.user_id == current_user.id
    ).all()

    df = create_dataframe(expenses)

    return spending_analysis(df)


# =========================
# UNUSUAL EXPENSES
# =========================

@app.get("/analytics/unusual")
def get_unusual_expenses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    expenses = db.query(Expense).filter(
        Expense.user_id == current_user.id
    ).all()

    df = create_dataframe(expenses)

    return detect_unusual_expenses(df)


# =========================
# FUTURE PREDICTION
# =========================

@app.get("/analytics/prediction")
def get_prediction(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    expenses = db.query(Expense).filter(
        Expense.user_id == current_user.id
    ).all()

    df = create_dataframe(expenses)

    return predict_future_spending(df)


# =========================
# PERSONALIZED INSIGHTS
# =========================

@app.get("/analytics/insights")
def get_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    expenses = db.query(Expense).filter(
        Expense.user_id == current_user.id
    ).all()

    df = create_dataframe(expenses)

    return {
        "insights":
            generate_insights(df)
    }


FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"

app.mount(
    "/",
    StaticFiles(directory=FRONTEND_DIR, html=True),
    name="frontend"
)