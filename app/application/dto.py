from pydantic import BaseModel, Field


class ProductFilters(BaseModel):
    category: str | None = None
    min_price: float | None = Field(default=None, ge=0)
    max_price: float | None = Field(default=None, ge=0)
    featured: bool | None = None
    sort: str = "featured"
    query: str | None = None


class AddCartItemCommand(BaseModel):
    product_id: int
    quantity: int = Field(ge=1, le=20)


class UpdateCartItemCommand(BaseModel):
    quantity: int = Field(ge=1, le=20)


class CheckoutCommand(BaseModel):
    customer_name: str = Field(min_length=2, max_length=80)
    email: str = Field(min_length=5, max_length=120)
    address: str = Field(min_length=10, max_length=200)
    shipping_method: str = "standard"


class ProductCreateCommand(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    category: str = Field(min_length=2, max_length=40)
    price: float = Field(gt=0)
    stock: int = Field(ge=0)
    rating: float = Field(default=4.5, ge=0, le=5)
    featured: bool = False
    image: str = Field(min_length=4, max_length=200)
    description: str = Field(min_length=10, max_length=400)
    tags: list[str] = Field(default_factory=list)


class ProductUpdateCommand(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=80)
    category: str | None = Field(default=None, min_length=2, max_length=40)
    price: float | None = Field(default=None, gt=0)
    stock: int | None = Field(default=None, ge=0)
    rating: float | None = Field(default=None, ge=0, le=5)
    featured: bool | None = None
    image: str | None = Field(default=None, min_length=4, max_length=200)
    description: str | None = Field(default=None, min_length=10, max_length=400)
    tags: list[str] | None = None


class ReviewCreateCommand(BaseModel):
    author: str = Field(min_length=2, max_length=40)
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=8, max_length=240)


class RegisterUserCommand(BaseModel):
    email: str = Field(min_length=5, max_length=120)
    full_name: str = Field(min_length=2, max_length=80)
    password: str = Field(min_length=8, max_length=128)


class LoginCommand(BaseModel):
    email: str = Field(min_length=5, max_length=120)
    password: str = Field(min_length=8, max_length=128)
