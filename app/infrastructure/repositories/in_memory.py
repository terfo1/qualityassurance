from collections import defaultdict

from app.domain.entities import CartItem, Coupon, Order, Product, Review


class InMemoryProductRepository:
    def __init__(self) -> None:
        self._products = {
            1: Product(1, "AeroFit Running Shoes", "Footwear", 89.0, 18, 4.7, True, "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80", "Lightweight trainers built for daily runs and all-day comfort.", ["sport", "best-seller"]),
            2: Product(2, "Summit Travel Backpack", "Accessories", 64.0, 24, 4.6, True, "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80", "Weather-resistant backpack with padded laptop storage and quick-access pockets.", ["travel", "gear"]),
            3: Product(3, "Luma Desk Lamp", "Home", 42.5, 31, 4.4, False, "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=900&q=80", "Adjustable LED lamp with warm and cool light settings for focused work.", ["lighting", "office"]),
            4: Product(4, "Mono Wireless Headphones", "Electronics", 129.0, 12, 4.8, True, "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80", "Noise-isolating over-ear headphones with 28-hour battery life.", ["audio", "premium"]),
            5: Product(5, "Terra Ceramic Mug", "Home", 19.0, 40, 4.3, False, "https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?auto=format&fit=crop&w=900&q=80", "Minimal stoneware mug with a matte glaze and comfortable handle.", ["kitchen", "gift"]),
            6: Product(6, "Core Performance Tee", "Apparel", 29.0, 26, 4.5, False, "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80", "Moisture-wicking training shirt designed for movement and breathability.", ["fitness", "apparel"]),
            7: Product(7, "Oak Stand Monitor Riser", "Office", 74.0, 14, 4.6, True, "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80", "Solid wood monitor riser with accessory drawer and cable gap.", ["desk", "workspace"]),
            8: Product(8, "Pulse Smart Bottle", "Wellness", 36.0, 22, 4.2, False, "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=80", "Insulated water bottle with hydration reminders and leakproof cap.", ["hydration", "wellness"]),
        }
        self._next_id = 9

    def list(self) -> list[Product]:
        return list(self._products.values())

    def get(self, product_id: int) -> Product | None:
        return self._products.get(product_id)

    def create(self, product: Product) -> Product:
        self._products[product.id] = product
        return product

    def update(self, product: Product) -> Product:
        self._products[product.id] = product
        return product

    def delete(self, product_id: int) -> None:
        self._products.pop(product_id, None)

    def next_id(self) -> int:
        value = self._next_id
        self._next_id += 1
        return value


class InMemoryCartRepository:
    def __init__(self) -> None:
        self._items: dict[int, CartItem] = {}
        self._coupon_code: str | None = None
        self._shipping_method = "standard"

    def list_items(self) -> list[CartItem]:
        return list(self._items.values())

    def get_item(self, product_id: int) -> CartItem | None:
        return self._items.get(product_id)

    def set_item(self, item: CartItem) -> CartItem:
        self._items[item.product_id] = item
        return item

    def delete_item(self, product_id: int) -> None:
        self._items.pop(product_id, None)

    def clear(self) -> None:
        self._items.clear()
        self._coupon_code = None
        self._shipping_method = "standard"

    def set_coupon(self, code: str | None) -> None:
        self._coupon_code = code

    def get_coupon(self) -> str | None:
        return self._coupon_code

    def set_shipping_method(self, shipping_method: str) -> None:
        self._shipping_method = shipping_method

    def get_shipping_method(self) -> str:
        return self._shipping_method


class InMemoryOrderRepository:
    def __init__(self) -> None:
        self._orders: dict[int, Order] = {}
        self._next_id = 1

    def list(self) -> list[Order]:
        return list(self._orders.values())

    def get(self, order_id: int) -> Order | None:
        return self._orders.get(order_id)

    def create(self, order: Order) -> Order:
        self._orders[order.id] = order
        return order

    def update(self, order: Order) -> Order:
        self._orders[order.id] = order
        return order

    def next_id(self) -> int:
        value = self._next_id
        self._next_id += 1
        return value


class InMemoryCouponRepository:
    def __init__(self) -> None:
        coupons = [
            Coupon("WELCOME10", "percent", 10, 50),
            Coupon("SHIPFREE", "fixed", 8, 40),
            Coupon("VIP25", "percent", 25, 150),
        ]
        self._coupons = {coupon.code: coupon for coupon in coupons}

    def list(self) -> list[Coupon]:
        return list(self._coupons.values())

    def get(self, code: str) -> Coupon | None:
        return self._coupons.get(code.upper())


class InMemoryReviewRepository:
    def __init__(self) -> None:
        self._reviews = defaultdict(list)
        self._next_id = 1
        self.create(Review(self.next_id(), 1, "Mina", 5, "Comfortable enough for long runs and daily wear."))
        self.create(Review(self.next_id(), 1, "Dorian", 4, "Good support, but size up if you are between sizes."))
        self.create(Review(self.next_id(), 4, "Ava", 5, "Battery life is excellent and isolation feels premium."))

    def list_for_product(self, product_id: int) -> list[Review]:
        return list(self._reviews[product_id])

    def create(self, review: Review) -> Review:
        self._reviews[review.product_id].append(review)
        return review

    def next_id(self) -> int:
        value = self._next_id
        self._next_id += 1
        return value
