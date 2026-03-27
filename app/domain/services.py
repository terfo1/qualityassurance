from app.domain.entities import Coupon, Product, ShippingMethod
from app.domain.exceptions import ValidationError


class PricingService:
    TAX_RATE = 0.08

    SHIPPING_PRICES = {
        ShippingMethod.standard.value: 8.0,
        ShippingMethod.express.value: 18.0,
        ShippingMethod.pickup.value: 0.0,
    }

    def calculate(
        self,
        items: list[dict],
        shipping_method: str,
        coupon: Coupon | None = None,
    ) -> dict:
        subtotal = round(sum(item["line_total"] for item in items), 2)
        discount = self._discount(subtotal, coupon)
        taxable_amount = max(subtotal - discount, 0)
        shipping = self.SHIPPING_PRICES.get(shipping_method, 8.0)
        tax = round(taxable_amount * self.TAX_RATE, 2)
        total = round(taxable_amount + shipping + tax, 2)
        return {
            "subtotal": subtotal,
            "discount": discount,
            "shipping": shipping,
            "tax": tax,
            "total": total,
        }

    def _discount(self, subtotal: float, coupon: Coupon | None) -> float:
        if coupon is None or not coupon.active:
            return 0.0
        if subtotal < coupon.minimum_subtotal:
            return 0.0
        if coupon.discount_type == "percent":
            return round(subtotal * (coupon.value / 100), 2)
        return round(min(coupon.value, subtotal), 2)


class RecommendationService:
    def related_products(self, product: Product, products: list[Product]) -> list[Product]:
        same_category = [candidate for candidate in products if candidate.category == product.category and candidate.id != product.id]
        fallback = [candidate for candidate in products if candidate.id != product.id]
        ranked = sorted(same_category or fallback, key=lambda item: (-item.featured, -item.rating, item.price))
        return ranked[:3]
