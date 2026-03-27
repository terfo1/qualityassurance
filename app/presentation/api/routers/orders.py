from fastapi import APIRouter, Depends

from app.application.dto import CheckoutCommand
from app.domain.exceptions import DomainError
from app.presentation.api.dependencies import ServiceBundle, get_admin_services, get_user_services, translate_domain_error
from app.presentation.api.schemas import OrderStatusPayload


router = APIRouter()


@router.get("")
def list_orders(services: ServiceBundle = Depends(get_user_services)) -> list[dict]:
    return services.orders.list_orders()


@router.post("", status_code=201)
def checkout(payload: CheckoutCommand, services: ServiceBundle = Depends(get_user_services)) -> dict:
    try:
        return services.orders.checkout(payload)
    except DomainError as error:
        raise translate_domain_error(error) from error


@router.get("/{order_id}")
def get_order(order_id: int, services: ServiceBundle = Depends(get_user_services)) -> dict:
    try:
        return services.orders.get_order(order_id)
    except DomainError as error:
        raise translate_domain_error(error) from error


@router.put("/{order_id}/status")
def update_order_status(
    order_id: int,
    payload: OrderStatusPayload,
    services: ServiceBundle = Depends(get_admin_services),
) -> dict:
    try:
        return services.orders.update_status(order_id, payload.status)
    except DomainError as error:
        raise translate_domain_error(error) from error
