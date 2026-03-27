from collections import Counter

from app.application.dto import (
    AddCartItemCommand,
    CheckoutCommand,
    LoginCommand,
    ProductCreateCommand,
    ProductFilters,
    ProductUpdateCommand,
    RegisterUserCommand,
    ReviewCreateCommand,
    UpdateCartItemCommand,
)
from app.domain.entities import CartItem, Order, OrderStatus, Product, Review, ShippingMethod, User, UserRole
from app.domain.exceptions import InventoryError, NotFoundError, ValidationError
from app.domain.repositories import CartRepository, CouponRepository, OrderRepository, ProductRepository, ReviewRepository, UserRepository
from app.domain.services import PricingService, RecommendationService
from app.security import create_token, hash_password, verify_password


class CatalogService:
    def __init__(
        self,
        products: ProductRepository,
        reviews: ReviewRepository,
        recommendations: RecommendationService,
    ) -> None:
        self.products = products
        self.reviews = reviews
        self.recommendations = recommendations

    def list_products(self, filters: ProductFilters) -> list[dict]:
        products = self.products.list()
        if filters.category:
            products = [product for product in products if product.category.lower() == filters.category.lower()]
        if filters.featured is not None:
            products = [product for product in products if product.featured is filters.featured]
        if filters.min_price is not None:
            products = [product for product in products if product.price >= filters.min_price]
        if filters.max_price is not None:
            products = [product for product in products if product.price <= filters.max_price]
        if filters.query:
            needle = filters.query.lower()
            products = [
                product
                for product in products
                if needle in product.name.lower()
                or needle in product.description.lower()
                or any(needle in tag.lower() for tag in product.tags)
            ]
        products = self._sort(products, filters.sort)
        return [product.to_dict() for product in products]

    def get_product_detail(self, product_id: int) -> dict:
        product = self.products.get(product_id)
        if not product:
            raise NotFoundError("Product not found")
        reviews = self.reviews.list_for_product(product_id)
        related = self.recommendations.related_products(product, self.products.list())
        return {
            "product": product.to_dict(),
            "reviews": [review.to_dict() for review in reviews],
            "related": [item.to_dict() for item in related],
        }

    def list_categories(self) -> list[str]:
        return sorted({product.category for product in self.products.list()})

    def featured_products(self) -> list[dict]:
        return [product.to_dict() for product in self._sort([item for item in self.products.list() if item.featured], "featured")[:4]]

    def create_review(self, product_id: int, command: ReviewCreateCommand) -> dict:
        product = self.products.get(product_id)
        if not product:
            raise NotFoundError("Product not found")
        review = Review(
            id=self.reviews.next_id(),
            product_id=product_id,
            author=command.author,
            rating=command.rating,
            comment=command.comment,
        )
        self.reviews.create(review)
        product_reviews = self.reviews.list_for_product(product_id)
        product.rating = round(sum(item.rating for item in product_reviews) / len(product_reviews), 1)
        self.products.update(product)
        return review.to_dict()

    def _sort(self, products: list[Product], sort: str) -> list[Product]:
        if sort == "price_asc":
            return sorted(products, key=lambda item: item.price)
        if sort == "price_desc":
            return sorted(products, key=lambda item: item.price, reverse=True)
        if sort == "rating":
            return sorted(products, key=lambda item: item.rating, reverse=True)
        return sorted(products, key=lambda item: (not item.featured, -item.rating, item.price))


class CartService:
    def __init__(
        self,
        products: ProductRepository,
        cart: CartRepository,
        coupons: CouponRepository,
        pricing: PricingService,
    ) -> None:
        self.products = products
        self.cart = cart
        self.coupons = coupons
        self.pricing = pricing

    def get_cart(self) -> dict:
        shipping_method = self.cart.get_shipping_method()
        coupon_code = self.cart.get_coupon()
        coupon = self.coupons.get(coupon_code) if coupon_code else None
        items = []
        for item in self.cart.list_items():
            product = self.products.get(item.product_id)
            if not product:
                continue
            line_total = round(product.price * item.quantity, 2)
            items.append(
                {
                    "product": product.to_dict(),
                    "quantity": item.quantity,
                    "line_total": line_total,
                    "low_stock": product.stock <= 5,
                }
            )
        pricing = self.pricing.calculate(items, shipping_method, coupon)
        return {
            "items": items,
            "coupon_code": coupon_code,
            "shipping_method": shipping_method,
            "pricing": pricing,
            "count": sum(item["quantity"] for item in items),
        }

    def add_item(self, command: AddCartItemCommand) -> dict:
        product = self._product_or_error(command.product_id)
        current = self.cart.get_item(command.product_id)
        new_quantity = command.quantity + (current.quantity if current else 0)
        self._validate_stock(product, new_quantity)
        self.cart.set_item(CartItem(product_id=product.id, quantity=new_quantity))
        return self.get_cart()

    def update_item(self, product_id: int, command: UpdateCartItemCommand) -> dict:
        product = self._product_or_error(product_id)
        if not self.cart.get_item(product_id):
            raise NotFoundError("Cart item not found")
        self._validate_stock(product, command.quantity)
        self.cart.set_item(CartItem(product_id=product_id, quantity=command.quantity))
        return self.get_cart()

    def remove_item(self, product_id: int) -> dict:
        if not self.cart.get_item(product_id):
            raise NotFoundError("Cart item not found")
        self.cart.delete_item(product_id)
        return self.get_cart()

    def clear(self) -> dict:
        self.cart.clear()
        return {"message": "Cart cleared"}

    def apply_coupon(self, code: str) -> dict:
        coupon = self.coupons.get(code)
        if not coupon or not coupon.active:
            raise ValidationError("Coupon is invalid or inactive")
        self.cart.set_coupon(coupon.code)
        return self.get_cart()

    def remove_coupon(self) -> dict:
        self.cart.set_coupon(None)
        return self.get_cart()

    def set_shipping_method(self, shipping_method: str) -> dict:
        if shipping_method not in {item.value for item in ShippingMethod}:
            raise ValidationError("Unsupported shipping method")
        self.cart.set_shipping_method(shipping_method)
        return self.get_cart()

    def _product_or_error(self, product_id: int) -> Product:
        product = self.products.get(product_id)
        if not product:
            raise NotFoundError("Product not found")
        return product

    def _validate_stock(self, product: Product, quantity: int) -> None:
        if quantity > product.stock:
            raise InventoryError("Requested quantity exceeds available stock")


class OrderService:
    def __init__(
        self,
        products: ProductRepository,
        orders: OrderRepository,
        cart_service: CartService,
        cart: CartRepository,
        current_user: User,
    ) -> None:
        self.products = products
        self.orders = orders
        self.cart_service = cart_service
        self.cart = cart
        self.current_user = current_user

    def checkout(self, command: CheckoutCommand) -> dict:
        if command.shipping_method not in {item.value for item in ShippingMethod}:
            raise ValidationError("Unsupported shipping method")
        self.cart.set_shipping_method(command.shipping_method)
        snapshot = self.cart_service.get_cart()
        if not snapshot["items"]:
            raise ValidationError("Cart is empty")
        for item in snapshot["items"]:
            product = self.products.get(item["product"]["id"])
            if not product:
                raise NotFoundError("Product not found during checkout")
            if item["quantity"] > product.stock:
                raise InventoryError(f"Insufficient stock for {product.name}")
        for item in snapshot["items"]:
            product = self.products.get(item["product"]["id"])
            product.stock -= item["quantity"]
            self.products.update(product)
        order = Order(
            id=self.orders.next_id(),
            user_id=self.current_user.id,
            customer_name=command.customer_name,
            email=command.email,
            address=command.address,
            shipping_method=ShippingMethod(command.shipping_method),
            status=OrderStatus.confirmed,
            items=snapshot["items"],
            pricing=snapshot["pricing"],
            coupon_code=snapshot["coupon_code"],
        )
        self.orders.create(order)
        self.cart.clear()
        return order.to_dict()

    def list_orders(self) -> list[dict]:
        return [order.to_dict() for order in self.orders.list()]

    def get_order(self, order_id: int) -> dict:
        order = self.orders.get(order_id)
        if not order:
            raise NotFoundError("Order not found")
        return order.to_dict()

    def update_status(self, order_id: int, status: str) -> dict:
        order = self.orders.get(order_id)
        if not order:
            raise NotFoundError("Order not found")
        try:
            order.status = OrderStatus(status)
        except ValueError as error:
            raise ValidationError("Unsupported order status") from error
        self.orders.update(order)
        return order.to_dict()


class AdminService:
    def __init__(
        self,
        products: ProductRepository,
        orders: OrderRepository,
        coupons: CouponRepository,
    ) -> None:
        self.products = products
        self.orders = orders
        self.coupons = coupons

    def dashboard(self) -> dict:
        products = self.products.list()
        orders = self.orders.list()
        revenue = round(sum(order.pricing["total"] for order in orders), 2)
        categories = Counter(product.category for product in products)
        low_stock = [product.to_dict() for product in products if product.stock <= 5]
        return {
            "products": len(products),
            "orders": len(orders),
            "revenue": revenue,
            "inventory_units": sum(product.stock for product in products),
            "low_stock": low_stock,
            "category_mix": dict(categories),
            "coupons": [coupon.to_dict() for coupon in self.coupons.list()],
        }

    def create_product(self, command: ProductCreateCommand) -> dict:
        product = Product(id=self.products.next_id(), **command.model_dump())
        self.products.create(product)
        return product.to_dict()

    def update_product(self, product_id: int, command: ProductUpdateCommand) -> dict:
        product = self.products.get(product_id)
        if not product:
            raise NotFoundError("Product not found")
        for key, value in command.model_dump().items():
            if value is not None:
                setattr(product, key, value)
        self.products.update(product)
        return product.to_dict()

    def delete_product(self, product_id: int) -> dict:
        if not self.products.get(product_id):
            raise NotFoundError("Product not found")
        self.products.delete(product_id)
        return {"message": "Product deleted", "product_id": product_id}


class MetricsService:
    def __init__(self, products: ProductRepository, orders: OrderRepository, cart_service: CartService) -> None:
        self.products = products
        self.orders = orders
        self.cart_service = cart_service

    def metrics(self) -> dict:
        cart = self.cart_service.get_cart()
        products = self.products.list()
        return {
            "products": len(products),
            "categories": len({product.category for product in products}),
            "cart_items": cart["count"],
            "orders": len(self.orders.list()),
            "featured_products": len([product for product in products if product.featured]),
        }


class AuthService:
    def __init__(self, users: UserRepository) -> None:
        self.users = users

    def register(self, command: RegisterUserCommand) -> dict:
        if self.users.get_by_email(command.email):
            raise ValidationError("Email is already registered")
        user = User(
            id=self.users.next_id(),
            email=command.email.lower(),
            full_name=command.full_name,
            password_hash=hash_password(command.password),
            role=UserRole.customer,
            is_active=True,
        )
        created = self.users.create(user)
        return {"token": create_token(created.id), "user": created.to_dict()}

    def login(self, command: LoginCommand) -> dict:
        user = self.users.get_by_email(command.email)
        if not user or not verify_password(command.password, user.password_hash):
            raise ValidationError("Invalid email or password")
        if not user.is_active:
            raise ValidationError("User is inactive")
        return {"token": create_token(user.id), "user": user.to_dict()}
