from pydantic import BaseModel, Field
from datetime import datetime


class UserCreate(BaseModel):
    name: str
    email: str
    password: str = Field(min_length=8)


class ExpenseCreate(BaseModel):
    amount: float = Field(gt=0)
    category: str
    description: str | None = None
    notes: str | None = None
    expense_date: datetime
    payment_method: str


class ExpenseUpdate(BaseModel):
    amount: float = Field(gt=0)
    category: str
    description: str | None = None
    notes: str | None = None
    expense_date: datetime
    payment_method: str


class UserLogin(BaseModel):
    email: str
    password: str