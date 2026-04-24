import unittest

from app.application.dto import AddCartItemCommand, UpdateCartItemCommand
from app.application.services import CartService
from app.domain.exceptions import InventoryError, ValidationError
from app.domain.services import PricingService
from app.infrastructure.repositories.in_memory import (
    InMemoryCartRepository,
    InMemoryCouponRepository,
    InMemoryProductRepository,
)


class CartServiceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.products = InMemoryProductRepository()
        self.cart_repo = InMemoryCartRepository()
        self.service = CartService(
            self.products,
            self.cart_repo,
            InMemoryCouponRepository(),
            PricingService(),
        )

    def test_add_item_accumulates_quantity_and_updates_count(self) -> None:
        self.service.add_item(AddCartItemCommand(product_id=1, quantity=1))

        cart = self.service.add_item(AddCartItemCommand(product_id=1, quantity=2))

        self.assertEqual(cart["count"], 3)
        self.assertEqual(cart["items"][0]["quantity"], 3)

    def test_update_item_changes_quantity(self) -> None:
        self.service.add_item(AddCartItemCommand(product_id=2, quantity=1))

        cart = self.service.update_item(2, UpdateCartItemCommand(quantity=4))

        self.assertEqual(cart["items"][0]["quantity"], 4)
        self.assertEqual(cart["count"], 4)

    def test_add_item_rejects_quantity_above_stock(self) -> None:
        with self.assertRaises(InventoryError):
            self.service.add_item(AddCartItemCommand(product_id=4, quantity=13))

    def test_invalid_coupon_is_rejected(self) -> None:
        with self.assertRaises(ValidationError):
            self.service.apply_coupon("missing")

    def test_shipping_method_changes_total(self) -> None:
        self.service.add_item(AddCartItemCommand(product_id=1, quantity=1))
        standard_total = self.service.get_cart()["pricing"]["total"]

        express_cart = self.service.set_shipping_method("express")

        self.assertGreater(express_cart["pricing"]["total"], standard_total)
        self.assertEqual(express_cart["shipping_method"], "express")


if __name__ == "__main__":
    unittest.main()
