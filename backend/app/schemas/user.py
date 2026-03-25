from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    full_name: str
    email: EmailStr


class UserCreate(UserBase):
    monthly_income_inr: float


class UserResponse(UserBase):
    id: int
    monthly_income_inr: float

