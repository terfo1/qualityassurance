from fastapi import APIRouter, Depends

from app.application.dto import AddCartItemCommand, UpdateCartItemCommand
from app.domain.exceptions import DomainError
from app.presentation.api.dependencies import ServiceBundle, get_user_services, translate_domain_error
from app.presentation.api.schemas import CouponCodePayload, ShippingMethodPayload


router = APIRouter()


@router.get("")
def get_cart(services: ServiceBundle = Depends(get_user_services)) -> dict:
    try:
        return services.cart.get_cart()
    except DomainError as error:
        raise translate_domain_error(error) from error


@router.post("/items", status_code=201)
def add_item(payload: AddCartItemCommand, services: ServiceBundle = Depends(get_user_services)) -> dict:
    try:
        return services.cart.add_item(payload)
    except DomainError as error:
        raise translate_domain_error(error) from error


@router.put("/items/{product_id}")
def update_item(
    product_id: int,
    payload: UpdateCartItemCommand,
    services: ServiceBundle = Depends(get_user_services),
) -> dict:
    try:
        return services.cart.update_item(product_id, payload)
    except DomainError as error:
        raise translate_domain_error(error) from error


@router.delete("/items/{product_id}")
def remove_item(product_id: int, services: ServiceBundle = Depends(get_user_services)) -> dict:
    try:
        return services.cart.remove_item(product_id)
    except DomainError as error:
        raise translate_domain_error(error) from error


@router.post("/clear")
def clear_cart(services: ServiceBundle = Depends(get_user_services)) -> dict:
    return services.cart.clear()


@router.post("/coupon")
def apply_coupon(payload: CouponCodePayload, services: ServiceBundle = Depends(get_user_services)) -> dict:
    try:
        return services.cart.apply_coupon(payload.code)
    except DomainError as error:
        raise translate_domain_error(error) from error


@router.delete("/coupon")
def remove_coupon(services: ServiceBundle = Depends(get_user_services)) -> dict:
    return services.cart.remove_coupon()


@router.post("/shipping")
def set_shipping_method(
    payload: ShippingMethodPayload,
    services: ServiceBundle = Depends(get_user_services),
) -> dict:
    try:
        return services.cart.set_shipping_method(payload.shipping_method)
    except DomainError as error:
        raise translate_domain_error(error) from error
