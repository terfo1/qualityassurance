from __future__ import annotations

from dataclasses import dataclass

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.application.services import AdminService, AuthService, CartService, CatalogService, MetricsService, OrderService
from app.domain.entities import User, UserRole
from app.domain.exceptions import DomainError, InventoryError, NotFoundError, ValidationError
from app.domain.services import PricingService, RecommendationService
from app.infrastructure.db.session import SessionLocal
from app.infrastructure.repositories.sqlalchemy import (
    SQLAlchemyCartRepository,
    SQLAlchemyCouponRepository,
    SQLAlchemyOrderRepository,
    SQLAlchemyProductRepository,
    SQLAlchemyReviewRepository,
    SQLAlchemyUserRepository,
)
from app.security import decode_token


@dataclass
class ServiceBundle:
    auth: AuthService
    catalog: CatalogService
    cart: CartService
    orders: OrderService | None
    admin: AdminService
    metrics: MetricsService


def get_db() -> Session:
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def _build_bundle(db: Session, current_user: User | None) -> ServiceBundle:
    user_repo = SQLAlchemyUserRepository(db)
    product_repo = SQLAlchemyProductRepository(db)
    review_repo = SQLAlchemyReviewRepository(db)
    coupon_repo = SQLAlchemyCouponRepository(db)
    pricing = PricingService()
    recommendations = RecommendationService()

    is_admin = current_user is not None and current_user.role is UserRole.admin
    cart_repo = SQLAlchemyCartRepository(db, current_user.id if current_user else None)
    order_repo = SQLAlchemyOrderRepository(db, current_user.id if current_user else None, admin=is_admin)
    admin_order_repo = SQLAlchemyOrderRepository(db, admin=True)
    cart_service = CartService(product_repo, cart_repo, coupon_repo, pricing)

    return ServiceBundle(
        auth=AuthService(user_repo),
        catalog=CatalogService(product_repo, review_repo, recommendations),
        cart=cart_service,
        orders=OrderService(product_repo, order_repo, cart_service, cart_repo, current_user) if current_user else None,
        admin=AdminService(product_repo, admin_order_repo, coupon_repo),
        metrics=MetricsService(product_repo, order_repo, cart_service),
    )


def get_optional_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User | None:
    if not authorization or not authorization.lower().startswith("bearer "):
        return None
    token = authorization.split(" ", 1)[1].strip()
    user_id = decode_token(token)
    if user_id is None:
        return None
    return SQLAlchemyUserRepository(db).get(user_id)


def get_current_user(current_user: User | None = Depends(get_optional_current_user)) -> User:
    if current_user is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    return current_user


def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role is not UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


def get_public_services(
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
) -> ServiceBundle:
    return _build_bundle(db, current_user)


def get_user_services(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ServiceBundle:
    return _build_bundle(db, current_user)


def get_admin_services(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> ServiceBundle:
    return _build_bundle(db, current_user)


def translate_domain_error(error: DomainError) -> HTTPException:
    if isinstance(error, NotFoundError):
        return HTTPException(status_code=404, detail=str(error))
    if isinstance(error, (ValidationError, InventoryError)):
        return HTTPException(status_code=400, detail=str(error))
    return HTTPException(status_code=500, detail="Unexpected domain error")
