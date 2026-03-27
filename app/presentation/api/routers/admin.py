from fastapi import APIRouter, Depends

from app.application.dto import ProductCreateCommand, ProductUpdateCommand
from app.domain.exceptions import DomainError
from app.presentation.api.dependencies import ServiceBundle, get_admin_services, translate_domain_error


router = APIRouter()


@router.get("/dashboard")
def dashboard(services: ServiceBundle = Depends(get_admin_services)) -> dict:
    return services.admin.dashboard()


@router.post("/products", status_code=201)
def create_product(payload: ProductCreateCommand, services: ServiceBundle = Depends(get_admin_services)) -> dict:
    try:
        return services.admin.create_product(payload)
    except DomainError as error:
        raise translate_domain_error(error) from error


@router.put("/products/{product_id}")
def update_product(
    product_id: int,
    payload: ProductUpdateCommand,
    services: ServiceBundle = Depends(get_admin_services),
) -> dict:
    try:
        return services.admin.update_product(product_id, payload)
    except DomainError as error:
        raise translate_domain_error(error) from error


@router.delete("/products/{product_id}")
def delete_product(product_id: int, services: ServiceBundle = Depends(get_admin_services)) -> dict:
    try:
        return services.admin.delete_product(product_id)
    except DomainError as error:
        raise translate_domain_error(error) from error
