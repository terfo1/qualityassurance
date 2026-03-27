from fastapi import APIRouter

from app.presentation.api.routers.admin import router as admin_router
from app.presentation.api.routers.auth import router as auth_router
from app.presentation.api.routers.cart import router as cart_router
from app.presentation.api.routers.catalog import router as catalog_router
from app.presentation.api.routers.metrics import router as metrics_router
from app.presentation.api.routers.orders import router as orders_router


api_router = APIRouter()
api_router.include_router(metrics_router, tags=["metrics"])
api_router.include_router(auth_router, tags=["auth"])
api_router.include_router(catalog_router, prefix="/products", tags=["products"])
api_router.include_router(cart_router, prefix="/cart", tags=["cart"])
api_router.include_router(orders_router, prefix="/orders", tags=["orders"])
api_router.include_router(admin_router, prefix="/admin", tags=["admin"])
