from app.schemas.user import UserCreate, UserResponse

_mock_users: list[UserResponse] = [
    UserResponse(
        id=1,
        full_name="Aarav Sharma",
        email="aarav@example.com",
        monthly_income_inr=120000,
    )
]


def list_users() -> list[UserResponse]:
    return _mock_users


def create_user(payload: UserCreate) -> UserResponse:
    new_user = UserResponse(id=len(_mock_users) + 1, **payload.model_dump())
    _mock_users.append(new_user)
    return new_user

