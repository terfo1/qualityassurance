from pydantic import BaseModel, Field


class CouponCodePayload(BaseModel):
    code: str = Field(min_length=3, max_length=20)


class ShippingMethodPayload(BaseModel):
    shipping_method: str


class OrderStatusPayload(BaseModel):
    status: str


class RegisterPayload(BaseModel):
    email: str = Field(min_length=5, max_length=120)
    full_name: str = Field(min_length=2, max_length=80)
    password: str = Field(min_length=8, max_length=128)


class LoginPayload(BaseModel):
    email: str = Field(min_length=5, max_length=120)
    password: str = Field(min_length=8, max_length=128)
