# Risk Assessment for NovaCart

## 1. Purpose

This document presents the initial risk assessment for **NovaCart**, a demo commerce platform with a layered FastAPI backend, PostgreSQL persistence, token-based authentication, and a React frontend served by the same application. The purpose of this assessment is to identify the most critical modules of the system and prioritize testing activities based on risk probability and business impact. :contentReference[oaicite:1]{index=1}

## 2. System Context

NovaCart is structured into multiple layers:

- `app/domain` for entities, exceptions, repository contracts, and business rules
- `app/application` for DTOs and business services
- `app/infrastructure` for SQLAlchemy models, database sessions, and repository implementations
- `app/presentation/api` for routers, request schemas, and dependency setup
- `app/presentation/web` for frontend route delivery
- `frontend` for the React UI
- `alembic` for migrations and seed data :contentReference[oaicite:2]{index=2}

The platform supports:

- Product catalog browsing with filtering, sorting, featured items, and related recommendations
- User registration and login with token-based sessions
- Per-user cart operations with inventory checks, shipping selection, coupon support, and price breakdowns
- Checkout with tax and shipping calculations persisted to PostgreSQL
- Product reviews with recalculated average ratings
- Admin dashboard access with inventory metrics and order status updates :contentReference[oaicite:3]{index=3}

## 3. Risk Assessment Method

Each module was evaluated using three criteria:

- **Probability**: the likelihood that defects may occur
- **Impact**: the severity of consequences if the module fails
- **Risk Level**: the resulting priority for testing

The qualitative scale used in this document is:

- Low
- Medium
- High
- Critical

## 4. Identified Modules

The main functional and technical areas identified in NovaCart are:

1. Health and metrics endpoints
2. Authentication
3. Product catalog and search/filter
4. Product details
5. Product reviews
6. Shopping cart
7. Coupon handling
8. Shipping selection
9. Checkout and order creation
10. Order history and order details
11. Admin dashboard
12. Admin product management
13. Order status updates
14. Database migration and persistence layer
15. Frontend delivery and integrated UI flow

## 5. Risk Matrix

| Module | Probability | Impact | Risk Level | Rationale |
|---|---|---|---|---|
| Authentication | High | High | Critical | Authentication controls access to both customer and admin workflows. Any failure can block login, session handling, and protected API access. |
| Shopping Cart | High | High | Critical | The cart is central to the buyer journey and includes inventory checks, quantity updates, shipping dependencies, and coupon logic. |
| Checkout and Order Creation | High | Very High | Critical | Checkout is the primary business transaction. Failure here can prevent order creation, miscalculate totals, or store incorrect data in PostgreSQL. |
| Admin Product Management | Medium | High | High | Errors in product creation, editing, or deletion may corrupt catalog data, pricing, and stock information. |
| Order Status Updates | Medium | High | High | Incorrect status changes can disrupt order lifecycle tracking and admin operations. |
| Product Catalog and Search/Filter | Medium | Medium | Medium | Important for product discovery and usability, but less critical than transactional flows. |
| Product Details | Medium | Medium | Medium | Important for product visibility and purchasing decisions, but usually not the final transaction point. |
| Product Reviews | Medium | Medium | Medium | Affects trust and rating accuracy, but does not directly block checkout. |
| Coupon Handling | Medium | Medium | Medium | Incorrect coupon logic may affect pricing and promotions, but only within a narrow functional area. |
| Shipping Selection | Medium | Medium | Medium | Shipping affects final order totals and checkout completion, but is less critical than overall order creation. |
| Order History and Order Details | Low to Medium | Medium | Medium | Important for post-purchase visibility, but not as critical as order creation itself. |
| Admin Dashboard | Low to Medium | Medium | Medium | Valuable for monitoring and decision support, but not a direct part of customer transactions. |
| Health Endpoint | Low | Low | Low | Simple technical endpoint for service availability checking. |
| Metrics Endpoint | Low | Medium | Low to Medium | Useful for monitoring and QA evidence, but not part of the main customer flow. |
| Database Migration and Persistence | Medium | High | High | Migration or persistence failures affect core data consistency, seeded users, catalog data, and stored orders. |
| Frontend Delivery and UI Integration | Medium | Medium | Medium | The UI is required for end-to-end validation, and it depends on browser internet access for CDN-based React runtime. |

## 6. High-Priority Testing Areas

Based on the initial assessment, the following areas should receive the highest testing priority:

1. Authentication
2. Shopping cart
3. Checkout and order creation
4. Admin product management
5. Order status updates
6. Database migration and persistence

These areas were prioritized because they directly affect access control, transaction correctness, or data integrity.

## 7. Assumptions

The following assumptions were used in this assessment:

- The seeded data created by Alembic is suitable for initial QA activities.
- The provided admin and demo user credentials are valid after migration.
- NovaCart currently represents a self-contained commerce demo without external payment gateway integration.
- Since the frontend uses React from CDN scripts, browser internet access is treated as an environmental dependency during UI testing.
- The assignment focuses on baseline QA preparation rather than full regression, performance, or security certification. :contentReference[oaicite:4]{index=4}

## 8. Conclusion

NovaCart contains several business-critical areas that justify a risk-based testing approach. The most important modules are authentication, cart management, checkout, and admin operations, supported by reliable database persistence. Initial QA efforts should focus on these modules first, while lower-risk areas such as monitoring endpoints can be validated through lightweight smoke checks.