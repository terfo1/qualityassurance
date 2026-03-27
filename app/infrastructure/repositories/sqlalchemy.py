from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.domain.entities import CartItem, Coupon, Order, OrderStatus, Product, Review, ShippingMethod, User, UserRole
from app.domain.exceptions import ValidationError
from app.infrastructure.db.models import CartItemModel, CartModel, CouponModel, OrderItemModel, OrderModel, ProductModel, ReviewModel, UserModel


def _parse_tags(value: str) -> list[str]:
    return [item for item in value.split(",") if item]


def _serialize_tags(tags: list[str]) -> str:
    return ",".join(tags)


def _user_entity(model: UserModel) -> User:
    return User(
        id=model.id,
        email=model.email,
        full_name=model.full_name,
        password_hash=model.password_hash,
        role=UserRole(model.role),
        is_active=model.is_active,
    )


def _product_entity(model: ProductModel) -> Product:
    return Product(
        id=model.id,
        name=model.name,
        category=model.category,
        price=model.price,
        stock=model.stock,
        rating=model.rating,
        featured=model.featured,
        image=model.image,
        description=model.description,
        tags=_parse_tags(model.tags),
    )


def _review_entity(model: ReviewModel) -> Review:
    return Review(
        id=model.id,
        product_id=model.product_id,
        author=model.author,
        rating=model.rating,
        comment=model.comment,
    )


def _coupon_entity(model: CouponModel) -> Coupon:
    return Coupon(
        code=model.code,
        discount_type=model.discount_type,
        value=model.value,
        minimum_subtotal=model.minimum_subtotal,
        active=model.active,
    )


def _order_entity(model: OrderModel) -> Order:
    items = [
        {
            "product": {"id": item.product_id, "name": item.product_name, "price": item.unit_price},
            "quantity": item.quantity,
            "line_total": item.line_total,
        }
        for item in model.items
    ]
    return Order(
        id=model.id,
        user_id=model.user_id,
        customer_name=model.customer_name,
        email=model.email,
        address=model.address,
        shipping_method=ShippingMethod(model.shipping_method),
        status=OrderStatus(model.status),
        items=items,
        pricing={
            "subtotal": model.subtotal,
            "discount": model.discount,
            "shipping": model.shipping,
            "tax": model.tax,
            "total": model.total,
        },
        coupon_code=model.coupon_code,
    )


class SQLAlchemyUserRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get(self, user_id: int) -> User | None:
        model = self.session.get(UserModel, user_id)
        return _user_entity(model) if model else None

    def get_by_email(self, email: str) -> User | None:
        model = self.session.scalar(select(UserModel).where(UserModel.email == email.lower()))
        return _user_entity(model) if model else None

    def create(self, user: User) -> User:
        model = UserModel(
            id=user.id,
            email=user.email.lower(),
            full_name=user.full_name,
            password_hash=user.password_hash,
            role=user.role.value,
            is_active=user.is_active,
        )
        self.session.add(model)
        self.session.flush()
        return _user_entity(model)

    def next_id(self) -> int:
        current = self.session.scalar(select(func.max(UserModel.id)))
        return (current or 0) + 1


class SQLAlchemyProductRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list(self) -> list[Product]:
        query = select(ProductModel).order_by(ProductModel.id)
        return [_product_entity(model) for model in self.session.scalars(query).all()]

    def get(self, product_id: int) -> Product | None:
        model = self.session.get(ProductModel, product_id)
        return _product_entity(model) if model else None

    def create(self, product: Product) -> Product:
        model = ProductModel(
            id=product.id,
            name=product.name,
            category=product.category,
            price=product.price,
            stock=product.stock,
            rating=product.rating,
            featured=product.featured,
            image=product.image,
            description=product.description,
            tags=_serialize_tags(product.tags),
        )
        self.session.add(model)
        self.session.flush()
        return _product_entity(model)

    def update(self, product: Product) -> Product:
        model = self.session.get(ProductModel, product.id)
        if not model:
            raise ValidationError("Product not found")
        model.name = product.name
        model.category = product.category
        model.price = product.price
        model.stock = product.stock
        model.rating = product.rating
        model.featured = product.featured
        model.image = product.image
        model.description = product.description
        model.tags = _serialize_tags(product.tags)
        self.session.flush()
        return _product_entity(model)

    def delete(self, product_id: int) -> None:
        model = self.session.get(ProductModel, product_id)
        if model:
            self.session.delete(model)
            self.session.flush()

    def next_id(self) -> int:
        current = self.session.scalar(select(func.max(ProductModel.id)))
        return (current or 0) + 1


class SQLAlchemyReviewRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list_for_product(self, product_id: int) -> list[Review]:
        query = select(ReviewModel).where(ReviewModel.product_id == product_id).order_by(ReviewModel.id.desc())
        return [_review_entity(model) for model in self.session.scalars(query).all()]

    def create(self, review: Review) -> Review:
        model = ReviewModel(
            id=review.id,
            product_id=review.product_id,
            author=review.author,
            rating=review.rating,
            comment=review.comment,
        )
        self.session.add(model)
        self.session.flush()
        return _review_entity(model)

    def next_id(self) -> int:
        current = self.session.scalar(select(func.max(ReviewModel.id)))
        return (current or 0) + 1


class SQLAlchemyCouponRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list(self) -> list[Coupon]:
        query = select(CouponModel).order_by(CouponModel.code)
        return [_coupon_entity(model) for model in self.session.scalars(query).all()]

    def get(self, code: str) -> Coupon | None:
        model = self.session.get(CouponModel, code.upper())
        return _coupon_entity(model) if model else None


class SQLAlchemyCartRepository:
    def __init__(self, session: Session, user_id: int | None) -> None:
        self.session = session
        self.user_id = user_id

    def _cart_model(self, create: bool = False) -> CartModel | None:
        if self.user_id is None:
            return None
        model = self.session.scalar(
            select(CartModel).options(selectinload(CartModel.items)).where(CartModel.user_id == self.user_id)
        )
        if not model and create:
            model = CartModel(user_id=self.user_id, shipping_method=ShippingMethod.standard.value)
            self.session.add(model)
            self.session.flush()
            model = self.session.scalar(
                select(CartModel).options(selectinload(CartModel.items)).where(CartModel.user_id == self.user_id)
            )
        return model

    def list_items(self) -> list[CartItem]:
        cart = self._cart_model()
        if not cart:
            return []
        return [CartItem(product_id=item.product_id, quantity=item.quantity) for item in cart.items]

    def get_item(self, product_id: int) -> CartItem | None:
        cart = self._cart_model()
        if not cart:
            return None
        for item in cart.items:
            if item.product_id == product_id:
                return CartItem(product_id=item.product_id, quantity=item.quantity)
        return None

    def set_item(self, item: CartItem) -> CartItem:
        cart = self._cart_model(create=True)
        if not cart:
            raise ValidationError("Authentication required")
        existing = next((entry for entry in cart.items if entry.product_id == item.product_id), None)
        if existing:
            existing.quantity = item.quantity
        else:
            self.session.add(CartItemModel(cart_id=cart.id, product_id=item.product_id, quantity=item.quantity))
        self.session.flush()
        return item

    def delete_item(self, product_id: int) -> None:
        cart = self._cart_model()
        if not cart:
            return
        existing = next((entry for entry in cart.items if entry.product_id == product_id), None)
        if existing:
            self.session.delete(existing)
            self.session.flush()

    def clear(self) -> None:
        cart = self._cart_model()
        if not cart:
            return
        for item in list(cart.items):
            self.session.delete(item)
        cart.coupon_code = None
        cart.shipping_method = ShippingMethod.standard.value
        self.session.flush()

    def set_coupon(self, code: str | None) -> None:
        cart = self._cart_model(create=True)
        if not cart:
            raise ValidationError("Authentication required")
        cart.coupon_code = code.upper() if code else None
        self.session.flush()

    def get_coupon(self) -> str | None:
        cart = self._cart_model()
        return cart.coupon_code if cart else None

    def set_shipping_method(self, shipping_method: str) -> None:
        cart = self._cart_model(create=True)
        if not cart:
            raise ValidationError("Authentication required")
        cart.shipping_method = shipping_method
        self.session.flush()

    def get_shipping_method(self) -> str:
        cart = self._cart_model()
        return cart.shipping_method if cart else ShippingMethod.standard.value


class SQLAlchemyOrderRepository:
    def __init__(self, session: Session, user_id: int | None = None, admin: bool = False) -> None:
        self.session = session
        self.user_id = user_id
        self.admin = admin

    def _base_query(self):
        query = select(OrderModel).options(selectinload(OrderModel.items)).order_by(OrderModel.id.desc())
        if not self.admin and self.user_id is not None:
            query = query.where(OrderModel.user_id == self.user_id)
        return query

    def list(self) -> list[Order]:
        return [_order_entity(model) for model in self.session.scalars(self._base_query()).all()]

    def get(self, order_id: int) -> Order | None:
        model = self.session.scalar(self._base_query().where(OrderModel.id == order_id))
        return _order_entity(model) if model else None

    def create(self, order: Order) -> Order:
        model = OrderModel(
            id=order.id,
            user_id=order.user_id,
            customer_name=order.customer_name,
            email=order.email,
            address=order.address,
            shipping_method=order.shipping_method.value,
            status=order.status.value,
            coupon_code=order.coupon_code,
            subtotal=order.pricing["subtotal"],
            discount=order.pricing["discount"],
            shipping=order.pricing["shipping"],
            tax=order.pricing["tax"],
            total=order.pricing["total"],
        )
        self.session.add(model)
        self.session.flush()
        for item in order.items:
            product = item["product"]
            self.session.add(
                OrderItemModel(
                    order_id=model.id,
                    product_id=product["id"],
                    product_name=product["name"],
                    unit_price=product["price"],
                    quantity=item["quantity"],
                    line_total=item["line_total"],
                )
            )
        self.session.flush()
        created = self.session.scalar(
            select(OrderModel).options(selectinload(OrderModel.items)).where(OrderModel.id == model.id)
        )
        return _order_entity(created)

    def update(self, order: Order) -> Order:
        model = self.session.get(OrderModel, order.id)
        if not model:
            raise ValidationError("Order not found")
        model.status = order.status.value
        self.session.flush()
        updated = self.session.scalar(
            select(OrderModel).options(selectinload(OrderModel.items)).where(OrderModel.id == order.id)
        )
        return _order_entity(updated)

    def next_id(self) -> int:
        current = self.session.scalar(select(func.max(OrderModel.id)))
        return (current or 0) + 1
