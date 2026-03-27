from fastapi import APIRouter, Depends

from app.application.dto import LoginCommand, RegisterUserCommand
from app.domain.entities import User
from app.domain.exceptions import DomainError
from app.presentation.api.dependencies import ServiceBundle, get_current_user, get_public_services, translate_domain_error


router = APIRouter(prefix="/auth")


@router.post("/register", status_code=201)
def register(payload: RegisterUserCommand, services: ServiceBundle = Depends(get_public_services)) -> dict:
    try:
        return services.auth.register(payload)
    except DomainError as error:
        raise translate_domain_error(error) from error


@router.post("/login")
def login(payload: LoginCommand, services: ServiceBundle = Depends(get_public_services)) -> dict:
    try:
        return services.auth.login(payload)
    except DomainError as error:
        raise translate_domain_error(error) from error


@router.get("/me")
def me(current_user: User = Depends(get_current_user)) -> dict:
    return current_user.to_dict()
