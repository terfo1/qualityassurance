import unittest

from app.application.dto import AddCartItemCommand
from app.application.services import CartService
from app.domain.entities import CartItem, Coupon, Product
from app.domain.exceptions import ValidationError
from app.domain.services import PricingService


class FakeProductRepository:
    def __init__(self, products: list[Product]) -> None:
        self.products = {product.id: product for product in products}

    def list(self) -> list[Product]:
        return list(self.products.values())

    def get(self, product_id: int) -> Product | None:
        return self.products.get(product_id)

    def create(self, product: Product) -> Product:
        self.products[product.id] = product
        return product

    def update(self, product: Product) -> Product:
        self.products[product.id] = product
        return product

    def delete(self, product_id: int) -> None:
        self.products.pop(product_id, None)

    def next_id(self) -> int:
        return max(self.products, default=0) + 1


class FakeCartRepository:
    def __init__(self) -> None:
        self.items: dict[int, CartItem] = {}
        self.coupon_code: str | None = None
        self.shipping_method = "standard"

    def list_items(self) -> list[CartItem]:
        return list(self.items.values())

    def get_item(self, product_id: int) -> CartItem | None:
        return self.items.get(product_id)

    def set_item(self, item: CartItem) -> CartItem:
        self.items[item.product_id] = item
        return item

    def delete_item(self, product_id: int) -> None:
        self.items.pop(product_id, None)

    def clear(self) -> None:
        self.items = {}

    def set_coupon(self, code: str | None) -> None:
        self.coupon_code = code

    def get_coupon(self) -> str | None:
        return self.coupon_code

    def set_shipping_method(self, shipping_method: str) -> None:
        self.shipping_method = shipping_method

    def get_shipping_method(self) -> str:
        return self.shipping_method


class FakeCouponRepository:
    def __init__(self, coupons: list[Coupon]) -> None:
        self.coupons = {coupon.code: coupon for coupon in coupons}

    def list(self) -> list[Coupon]:
        return list(self.coupons.values())

    def get(self, code: str) -> Coupon | None:
        return self.coupons.get(code)


class Task2UnitTests(unittest.TestCase):
    def setUp(self) -> None:
        self.product_repo = FakeProductRepository(
            [
                Product(
                    id=1,
                    name="Summit Travel Backpack",
                    category="Accessories",
                    price=64.0,
                    stock=10,
                    rating=4.6,
                    featured=True,
                    image="/img/backpack.jpg",
                    description="Backpack used for Task 2 unit tests.",
                    tags=["travel", "qa"],
                )
            ]
        )
        self.cart_repo = FakeCartRepository()
        self.coupon_repo = FakeCouponRepository(
            [
                Coupon(code="WELCOME10", discount_type="percent", value=10, minimum_subtotal=50, active=True),
                Coupon(code="INACTIVE10", discount_type="percent", value=10, minimum_subtotal=0, active=False),
            ]
        )
        self.service = CartService(self.product_repo, self.cart_repo, self.coupon_repo, PricingService())

    def test_tc_unit_price_edge_001_inactive_coupon_yields_zero_discount(self) -> None:
        pricing = PricingService().calculate(
            items=[{"line_total": 64.0}],
            shipping_method="standard",
            coupon=Coupon(code="INACTIVE10", discount_type="percent", value=10, minimum_subtotal=0, active=False),
        )

        self.assertEqual(pricing["discount"], 0.0)
        self.assertEqual(pricing["shipping"], 8.0)
        self.assertEqual(pricing["total"], 77.12)

    def test_tc_unit_cart_edge_002_remove_coupon_clears_code_and_restores_pricing(self) -> None:
        self.service.add_item(AddCartItemCommand(product_id=1, quantity=1))
        applied = self.service.apply_coupon("WELCOME10")
        removed = self.service.remove_coupon()

        self.assertEqual(applied["coupon_code"], "WELCOME10")
        self.assertGreater(applied["pricing"]["discount"], 0)
        self.assertIsNone(removed["coupon_code"])
        self.assertEqual(removed["pricing"]["discount"], 0.0)
        self.assertEqual(removed["pricing"]["total"], 77.12)

    def test_tc_unit_cart_invalid_003_unsupported_shipping_raises_validation_error(self) -> None:
        with self.assertRaises(ValidationError):
            self.service.set_shipping_method("teleport")


if __name__ == "__main__":
    unittest.main()
