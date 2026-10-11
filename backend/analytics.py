import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.linear_model import LinearRegression


def create_dataframe(expenses):
    """
    Convert SQLAlchemy expense objects into a Pandas DataFrame.
    """

    data = []

    for expense in expenses:
        data.append({
            "id": expense.id,
            "amount": float(expense.amount),
            "category": expense.category,
            "description": expense.description or "",
            "payment_method": expense.payment_method,
            "expense_date": expense.expense_date
        })

    if not data:
        return pd.DataFrame()

    df = pd.DataFrame(data)

    df["expense_date"] = pd.to_datetime(
        df["expense_date"]
    )

    return df


# ==========================================
# 1. SPENDING ANALYSIS
# ==========================================

def spending_analysis(df):

    if df.empty:
        return {
            "total_spent": 0,
            "expense_count": 0,
            "average_expense": 0,
            "category_breakdown": {},
            "payment_breakdown": {},
            "monthly_breakdown": {}
        }

    total = df["amount"].sum()

    average = df["amount"].mean()

    category_breakdown = (
        df.groupby("category")["amount"]
        .sum()
        .round(2)
        .to_dict()
    )

    payment_breakdown = (
        df.groupby("payment_method")["amount"]
        .sum()
        .round(2)
        .to_dict()
    )

    monthly = (
        df.assign(
            month=df["expense_date"].dt.strftime("%Y-%m")
        )
        .groupby("month")["amount"]
        .sum()
        .round(2)
        .to_dict()
    )

    return {
        "total_spent": round(float(total), 2),
        "expense_count": len(df),
        "average_expense": round(float(average), 2),
        "category_breakdown": category_breakdown,
        "payment_breakdown": payment_breakdown,
        "monthly_breakdown": monthly
    }


# ==========================================
# 2. UNUSUAL EXPENSE DETECTION
# ==========================================

def detect_unusual_expenses(df):

    if len(df) < 5:
        return {
            "status": "not_enough_data",
            "message":
                "Add at least 5 expenses to detect unusual spending.",
            "unusual_expenses": []
        }

    model = IsolationForest(
        contamination=0.1,
        random_state=42
    )

    values = df[["amount"]]

    predictions = model.fit_predict(values)

    unusual = df[predictions == -1]

    results = []

    for _, row in unusual.iterrows():

        results.append({
            "id": int(row["id"]),
            "amount": float(row["amount"]),
            "category": row["category"],
            "description": row["description"],
            "date":
                row["expense_date"].strftime("%Y-%m-%d")
        })

    return {
        "status": "success",
        "message":
            "Unusual expenses detected using machine learning.",
        "unusual_expenses": results
    }


# ==========================================
# 3. FUTURE SPENDING PREDICTION
# ==========================================

def predict_future_spending(df):

    if df.empty:
        return {
            "status": "not_enough_data",
            "message": "Add expenses first."
        }

    df = df.copy()

    df["month"] = (
        df["expense_date"]
        .dt.to_period("M")
        .astype(str)
    )

    monthly = (
        df.groupby("month")["amount"]
        .sum()
        .reset_index()
    )

    if len(monthly) < 3:
        return {
            "status": "not_enough_data",
            "message":
                "Add expenses across at least 3 different months to predict future spending.",
            "months_available": len(monthly)
        }

    monthly["month_number"] = range(
        len(monthly)
    )

    X = monthly[["month_number"]]

    y = monthly["amount"]

    model = LinearRegression()

    model.fit(X, y)

    next_month_number = len(monthly)

    prediction = model.predict(
        [[next_month_number]]
    )[0]

    prediction = max(
        0,
        float(prediction)
    )

    return {
        "status": "success",
        "predicted_monthly_spending":
            round(prediction, 2),

        "based_on_months":
            len(monthly),

        "historical_months":
            monthly["month"].tolist(),

        "historical_spending":
            monthly["amount"]
            .round(2)
            .tolist()
    }


# ==========================================
# 4. PERSONALIZED INSIGHTS
# ==========================================

def generate_insights(df):

    if df.empty:
        return [
            "Start adding expenses to receive personalized insights."
        ]

    insights = []

    total = df["amount"].sum()

    # Highest spending category

    category_totals = (
        df.groupby("category")["amount"]
        .sum()
    )

    if not category_totals.empty:

        top_category = category_totals.idxmax()

        top_amount = category_totals.max()

        percentage = (top_amount / total) * 100

        insights.append(
            f"{top_category} is your highest spending "
            f"category, accounting for "
            f"{percentage:.1f}% of your total spending."
        )


    # Average expense

    average = df["amount"].mean()

    insights.append(
        f"Your average expense is ₹{average:.2f}."
    )


    # Highest individual expense

    highest = df.loc[
        df["amount"].idxmax()
    ]

    insights.append(
        f"Your highest recorded expense is "
        f"₹{highest['amount']:.2f} "
        f"for {highest['description'] or 'an expense'}."
    )


    # Payment method

    payment_totals = (
        df.groupby("payment_method")["amount"]
        .sum()
    )

    if not payment_totals.empty:

        top_payment = payment_totals.idxmax()

        insights.append(
            f"You spend the most using "
            f"{top_payment}."
        )


    return insights