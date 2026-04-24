import unittest

from app.application.dto import AddCartItemCommand, CheckoutCommand
from app.application.services import CartService, OrderService
from app.domain.entities import User, UserRole
from app.domain.exceptions import ValidationError
from app.domain.services import PricingService
from app.infrastructure.repositories.in_memory import (
    InMemoryCartRepository,
    InMemoryCouponRepository,
    InMemoryOrderRepository,
    InMemoryProductRepository,
)


class OrderServiceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.products = InMemoryProductRepository()
        self.cart_repo = InMemoryCartRepository()
        self.cart_service = CartService(
            self.products,
            self.cart_repo,
            InMemoryCouponRepository(),
            PricingService(),
        )
        self.orders = InMemoryOrderRepository()
        self.current_user = User(
            id=99,
            email="buyer@example.com",
            full_name="Buyer One",
            password_hash="unused",
            role=UserRole.customer,
        )
        self.service = OrderService(
            self.products,
            self.orders,
            self.cart_service,
            self.cart_repo,
            self.current_user,
        )

    def test_checkout_creates_order_clears_cart_and_decrements_stock(self) -> None:
        initial_stock = self.products.get(1).stock
        self.cart_service.add_item(AddCartItemCommand(product_id=1, quantity=2))

        order = self.service.checkout(
            CheckoutCommand(
                customer_name="Buyer One",
                email="buyer@example.com",
                address="101 Market Street, Test City",
                shipping_method="standard",
            )
        )

        self.assertEqual(order["status"], "confirmed")
        self.assertEqual(len(self.orders.list()), 1)
        self.assertEqual(self.cart_service.get_cart()["count"], 0)
        self.assertEqual(self.products.get(1).stock, initial_stock - 2)

    def test_checkout_rejects_empty_cart(self) -> None:
        with self.assertRaises(ValidationError):
            self.service.checkout(
                CheckoutCommand(
                    customer_name="Buyer One",
                    email="buyer@example.com",
                    address="101 Market Street, Test City",
                    shipping_method="standard",
                )
            )


if __name__ == "__main__":
    unittest.main()
