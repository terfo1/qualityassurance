from fastapi import APIRouter, Depends, Query

from app.application.dto import ProductFilters, ReviewCreateCommand
from app.domain.exceptions import DomainError
from app.presentation.api.dependencies import ServiceBundle, get_public_services, translate_domain_error


router = APIRouter()


@router.get("")
def list_products(
    category: str | None = None,
    min_price: float | None = Query(default=None, ge=0),
    max_price: float | None = Query(default=None, ge=0),
    featured: bool | None = None,
    sort: str = "featured",
    q: str | None = None,
    services: ServiceBundle = Depends(get_public_services),
) -> list[dict]:
    filters = ProductFilters(
        category=category,
        min_price=min_price,
        max_price=max_price,
        featured=featured,
        sort=sort,
        query=q,
    )
    return services.catalog.list_products(filters)


@router.get("/featured")
def featured_products(services: ServiceBundle = Depends(get_public_services)) -> list[dict]:
    return services.catalog.featured_products()


@router.get("/categories")
def categories(services: ServiceBundle = Depends(get_public_services)) -> list[str]:
    return services.catalog.list_categories()


@router.get("/{product_id}")
def get_product_detail(product_id: int, services: ServiceBundle = Depends(get_public_services)) -> dict:
    try:
        return services.catalog.get_product_detail(product_id)
    except DomainError as error:
        raise translate_domain_error(error) from error


@router.get("/{product_id}/reviews")
def get_product_reviews(product_id: int, services: ServiceBundle = Depends(get_public_services)) -> list[dict]:
    try:
        return services.catalog.get_product_detail(product_id)["reviews"]
    except DomainError as error:
        raise translate_domain_error(error) from error


@router.post("/{product_id}/reviews", status_code=201)
def create_review(
    product_id: int,
    payload: ReviewCreateCommand,
    services: ServiceBundle = Depends(get_public_services),
) -> dict:
    try:
        return services.catalog.create_review(product_id, payload)
    except DomainError as error:
        raise translate_domain_error(error) from error
