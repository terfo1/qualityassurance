from dataclasses import asdict, dataclass, field
from enum import StrEnum


class ShippingMethod(StrEnum):
    standard = "standard"
    express = "express"
    pickup = "pickup"


class OrderStatus(StrEnum):
    pending = "pending"
    confirmed = "confirmed"
    fulfilled = "fulfilled"


class UserRole(StrEnum):
    admin = "admin"
    customer = "customer"


@dataclass
class User:
    id: int
    email: str
    full_name: str
    password_hash: str
    role: UserRole
    is_active: bool = True

    def to_dict(self) -> dict:
        data = asdict(self)
        data["role"] = self.role.value
        data.pop("password_hash", None)
        return data


@dataclass
class Product:
    id: int | None
    name: str
    category: str
    price: float
    stock: int
    rating: float
    featured: bool
    image: str
    description: str
    tags: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class Coupon:
    code: str
    discount_type: str
    value: float
    minimum_subtotal: float
    active: bool = True

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class CartItem:
    product_id: int
    quantity: int

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class Review:
    id: int | None
    product_id: int
    author: str
    rating: int
    comment: str

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class Order:
    id: int | None
    user_id: int | None
    customer_name: str
    email: str
    address: str
    shipping_method: ShippingMethod
    status: OrderStatus
    items: list[dict]
    pricing: dict
    coupon_code: str | None = None

    def to_dict(self) -> dict:
        data = asdict(self)
        data["shipping_method"] = self.shipping_method.value
        data["status"] = self.status.value
        return data
