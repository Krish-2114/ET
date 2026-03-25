from fastapi import APIRouter

from app.schemas.user import UserCreate, UserResponse
from app.services import user_service

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserResponse])
def get_users() -> list[UserResponse]:
    return user_service.list_users()


@router.post("", response_model=UserResponse)
def post_user(payload: UserCreate) -> UserResponse:
    return user_service.create_user(payload)

