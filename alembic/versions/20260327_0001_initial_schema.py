from datetime import datetime

import sqlalchemy as sa
from alembic import op


revision = "20260327_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(length=120), nullable=False),
        sa.Column("full_name", sa.String(length=80), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False, server_default="customer"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(), nullable=False, default=datetime.utcnow),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "products",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column("category", sa.String(length=40), nullable=False),
        sa.Column("price", sa.Float(), nullable=False),
        sa.Column("stock", sa.Integer(), nullable=False),
        sa.Column("rating", sa.Float(), nullable=False, server_default="0"),
        sa.Column("featured", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("image", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("tags", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(), nullable=False, default=datetime.utcnow),
    )
    op.create_index("ix_products_name", "products", ["name"], unique=False)
    op.create_index("ix_products_category", "products", ["category"], unique=False)

    op.create_table(
        "reviews",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id", ondelete="CASCADE"), nullable=False),
        sa.Column("author", sa.String(length=40), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("comment", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, default=datetime.utcnow),
    )
    op.create_index("ix_reviews_product_id", "reviews", ["product_id"], unique=False)

    op.create_table(
        "coupons",
        sa.Column("code", sa.String(length=20), primary_key=True),
        sa.Column("discount_type", sa.String(length=20), nullable=False),
        sa.Column("value", sa.Float(), nullable=False),
        sa.Column("minimum_subtotal", sa.Float(), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true()),
    )

    op.create_table(
        "carts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("coupon_code", sa.String(length=20), sa.ForeignKey("coupons.code"), nullable=True),
        sa.Column("shipping_method", sa.String(length=20), nullable=False, server_default="standard"),
        sa.Column("updated_at", sa.DateTime(), nullable=False, default=datetime.utcnow),
    )
    op.create_index("ix_carts_user_id", "carts", ["user_id"], unique=True)

    op.create_table(
        "cart_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("cart_id", sa.Integer(), sa.ForeignKey("carts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id", ondelete="CASCADE"), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.UniqueConstraint("cart_id", "product_id", name="uq_cart_product"),
    )
    op.create_index("ix_cart_items_cart_id", "cart_items", ["cart_id"], unique=False)
    op.create_index("ix_cart_items_product_id", "cart_items", ["product_id"], unique=False)

    op.create_table(
        "orders",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("customer_name", sa.String(length=80), nullable=False),
        sa.Column("email", sa.String(length=120), nullable=False),
        sa.Column("address", sa.String(length=200), nullable=False),
        sa.Column("shipping_method", sa.String(length=20), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="confirmed"),
        sa.Column("coupon_code", sa.String(length=20), nullable=True),
        sa.Column("subtotal", sa.Float(), nullable=False),
        sa.Column("discount", sa.Float(), nullable=False),
        sa.Column("shipping", sa.Float(), nullable=False),
        sa.Column("tax", sa.Float(), nullable=False),
        sa.Column("total", sa.Float(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, default=datetime.utcnow),
    )
    op.create_index("ix_orders_user_id", "orders", ["user_id"], unique=False)

    op.create_table(
        "order_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("order_id", sa.Integer(), sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id", ondelete="SET NULL"), nullable=True),
        sa.Column("product_name", sa.String(length=80), nullable=False),
        sa.Column("unit_price", sa.Float(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("line_total", sa.Float(), nullable=False),
    )
    op.create_index("ix_order_items_order_id", "order_items", ["order_id"], unique=False)

    users = sa.table(
        "users",
        sa.column("id", sa.Integer),
        sa.column("email", sa.String),
        sa.column("full_name", sa.String),
        sa.column("password_hash", sa.String),
        sa.column("role", sa.String),
        sa.column("is_active", sa.Boolean),
        sa.column("created_at", sa.DateTime),
    )
    products = sa.table(
        "products",
        sa.column("id", sa.Integer),
        sa.column("name", sa.String),
        sa.column("category", sa.String),
        sa.column("price", sa.Float),
        sa.column("stock", sa.Integer),
        sa.column("rating", sa.Float),
        sa.column("featured", sa.Boolean),
        sa.column("image", sa.String),
        sa.column("description", sa.String),
        sa.column("tags", sa.String),
        sa.column("created_at", sa.DateTime),
    )
    coupons = sa.table(
        "coupons",
        sa.column("code", sa.String),
        sa.column("discount_type", sa.String),
        sa.column("value", sa.Float),
        sa.column("minimum_subtotal", sa.Float),
        sa.column("active", sa.Boolean),
    )
    reviews = sa.table(
        "reviews",
        sa.column("id", sa.Integer),
        sa.column("product_id", sa.Integer),
        sa.column("author", sa.String),
        sa.column("rating", sa.Integer),
        sa.column("comment", sa.String),
        sa.column("created_at", sa.DateTime),
    )
    carts = sa.table(
        "carts",
        sa.column("id", sa.Integer),
        sa.column("user_id", sa.Integer),
        sa.column("coupon_code", sa.String),
        sa.column("shipping_method", sa.String),
        sa.column("updated_at", sa.DateTime),
    )
    cart_items = sa.table(
        "cart_items",
        sa.column("cart_id", sa.Integer),
        sa.column("product_id", sa.Integer),
        sa.column("quantity", sa.Integer),
    )

    now = datetime.utcnow()
    op.bulk_insert(
        users,
        [
            {
                "id": 1,
                "email": "admin@novacart.local",
                "full_name": "NovaCart Admin",
                "password_hash": "pbkdf2_sha256$0a451956528fa201b23a53001a6b1be0$Z3RwwiVhfs8H25JprijusfXHjSBLam/IaQ02/lkp31U=",
                "role": "admin",
                "is_active": True,
                "created_at": now,
            },
            {
                "id": 2,
                "email": "demo@novacart.local",
                "full_name": "Demo Shopper",
                "password_hash": "pbkdf2_sha256$c067c1287ac6070aee005ef5c2930cca$BkpY4/jSKvALPWd4ZZKPZbwgY4Nlfn/3w7Vj4nVAyeY=",
                "role": "customer",
                "is_active": True,
                "created_at": now,
            },
            {
                "id": 3,
                "email": "ops@novacart.local",
                "full_name": "Operations Admin",
                "password_hash": "pbkdf2_sha256$26a90e12d45d382a6685b37e183d48f6$HrBYLB3dLJAmiteuBhvyQSk9/SAXE1yNXaALG7ByHJ4=",
                "role": "admin",
                "is_active": True,
                "created_at": now,
            },
            {
                "id": 4,
                "email": "buyer@novacart.local",
                "full_name": "Repeat Buyer",
                "password_hash": "pbkdf2_sha256$416a300affdad7b5a1e61894557ed45b$tDZ8Bb5e0q8/QFUfCXwCXXias/uVoU3iRPCQXsKXWvo=",
                "role": "customer",
                "is_active": True,
                "created_at": now,
            },
            {
                "id": 5,
                "email": "analyst@novacart.local",
                "full_name": "Catalog Analyst",
                "password_hash": "pbkdf2_sha256$7bc926dc04f4b79872fffe7342ec9f76$TmBAcuX9+qS3YAz9V2fOY3FhJWkxl/H0NL2Rb/OuI6g=",
                "role": "customer",
                "is_active": True,
                "created_at": now,
            },
        ],
    )

    op.bulk_insert(
        products,
        [
            {"id": 1, "name": "AeroFit Running Shoes", "category": "Footwear", "price": 89.0, "stock": 18, "rating": 4.7, "featured": True, "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80", "description": "Lightweight trainers built for daily runs and all-day comfort.", "tags": "sport,best-seller", "created_at": now},
            {"id": 2, "name": "Summit Travel Backpack", "category": "Accessories", "price": 64.0, "stock": 24, "rating": 4.6, "featured": True, "image": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80", "description": "Weather-resistant backpack with padded laptop storage and quick-access pockets.", "tags": "travel,gear", "created_at": now},
            {"id": 3, "name": "Luma Desk Lamp", "category": "Home", "price": 42.5, "stock": 31, "rating": 4.4, "featured": False, "image": "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=900&q=80", "description": "Adjustable LED lamp with warm and cool light settings for focused work.", "tags": "lighting,office", "created_at": now},
            {"id": 4, "name": "Mono Wireless Headphones", "category": "Electronics", "price": 129.0, "stock": 12, "rating": 4.8, "featured": True, "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80", "description": "Noise-isolating over-ear headphones with 28-hour battery life.", "tags": "audio,premium", "created_at": now},
            {"id": 5, "name": "Terra Ceramic Mug", "category": "Home", "price": 19.0, "stock": 40, "rating": 4.3, "featured": False, "image": "https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?auto=format&fit=crop&w=900&q=80", "description": "Minimal stoneware mug with a matte glaze and comfortable handle.", "tags": "kitchen,gift", "created_at": now},
            {"id": 6, "name": "Core Performance Tee", "category": "Apparel", "price": 29.0, "stock": 26, "rating": 4.5, "featured": False, "image": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80", "description": "Moisture-wicking training shirt designed for movement and breathability.", "tags": "fitness,apparel", "created_at": now},
            {"id": 7, "name": "Oak Stand Monitor Riser", "category": "Office", "price": 74.0, "stock": 14, "rating": 4.6, "featured": True, "image": "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80", "description": "Solid wood monitor riser with accessory drawer and cable gap.", "tags": "desk,workspace", "created_at": now},
            {"id": 8, "name": "Pulse Smart Bottle", "category": "Wellness", "price": 36.0, "stock": 22, "rating": 4.2, "featured": False, "image": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=80", "description": "Insulated water bottle with hydration reminders and leakproof cap.", "tags": "hydration,wellness", "created_at": now},
        ],
    )

    op.bulk_insert(
        coupons,
        [
            {"code": "WELCOME10", "discount_type": "percent", "value": 10, "minimum_subtotal": 50, "active": True},
            {"code": "SHIPFREE", "discount_type": "fixed", "value": 8, "minimum_subtotal": 40, "active": True},
            {"code": "VIP25", "discount_type": "percent", "value": 25, "minimum_subtotal": 150, "active": True},
        ],
    )

    op.bulk_insert(
        reviews,
        [
            {"id": 1, "product_id": 1, "author": "Mina", "rating": 5, "comment": "Comfortable enough for long runs and daily wear.", "created_at": now},
            {"id": 2, "product_id": 1, "author": "Dorian", "rating": 4, "comment": "Good support, but size up if you are between sizes.", "created_at": now},
            {"id": 3, "product_id": 4, "author": "Ava", "rating": 5, "comment": "Battery life is excellent and isolation feels premium.", "created_at": now},
        ],
    )

    op.bulk_insert(
        carts,
        [
            {"id": 1, "user_id": 2, "coupon_code": "WELCOME10", "shipping_method": "standard", "updated_at": now},
        ],
    )
    op.bulk_insert(
        cart_items,
        [
            {"cart_id": 1, "product_id": 2, "quantity": 1},
            {"cart_id": 1, "product_id": 5, "quantity": 2},
        ],
    )


def downgrade() -> None:
    op.drop_index("ix_order_items_order_id", table_name="order_items")
    op.drop_table("order_items")
    op.drop_index("ix_orders_user_id", table_name="orders")
    op.drop_table("orders")
    op.drop_index("ix_cart_items_product_id", table_name="cart_items")
    op.drop_index("ix_cart_items_cart_id", table_name="cart_items")
    op.drop_table("cart_items")
    op.drop_index("ix_carts_user_id", table_name="carts")
    op.drop_table("carts")
    op.drop_table("coupons")
    op.drop_index("ix_reviews_product_id", table_name="reviews")
    op.drop_table("reviews")
    op.drop_index("ix_products_category", table_name="products")
    op.drop_index("ix_products_name", table_name="products")
    op.drop_table("products")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
