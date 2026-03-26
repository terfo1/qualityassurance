# QA Test Strategy for NovaCart

## 1. Purpose

This document defines the initial QA strategy for **NovaCart**. It describes the testing scope, objectives, test approach, prioritization, tools, and initial deliverables required for baseline quality assurance work.

NovaCart is a demo commerce platform with a FastAPI backend, PostgreSQL persistence, token authentication, and a React frontend served by the same application. The strategy in this document is based on the current repository structure and publicly documented features. :contentReference[oaicite:5]{index=5}

## 2. Test Objectives

The main objectives of the initial QA phase are:

- Validate the most critical customer and admin workflows
- Prioritize test execution based on business risk
- Establish a reproducible QA environment
- Create a baseline set of manual and automated smoke tests
- Produce evidence and metrics for future research and reporting

## 3. Scope

### 3.1 In Scope

The following features are included in the initial QA scope:

- User registration and login
- Token-based session validation
- Product catalog browsing
- Filtering and sorting of products
- Product details and review retrieval
- Review submission
- Cart operations
- Coupon application and removal
- Shipping method selection
- Checkout and order creation
- Order history and order details
- Admin dashboard access
- Admin product creation, update, and deletion
- Order status updates
- Health and metrics endpoints

These areas are supported by the API endpoints listed in the repository README. :contentReference[oaicite:6]{index=6}

### 3.2 Out of Scope

The following areas are excluded from this initial assignment phase:

- Full performance and load testing
- Penetration testing
- Deep cross-browser compatibility testing
- Production deployment validation
- Accessibility certification
- External third-party payment processing validation

## 4. Risk-Based Prioritization

Testing will be prioritized according to the risk assessment.

### Priority 1
- Authentication
- Shopping cart
- Checkout and order creation

### Priority 2
- Admin product management
- Order status updates
- Database persistence validation

### Priority 3
- Product catalog
- Product details
- Product reviews
- Order history
- Admin dashboard

### Priority 4
- Health endpoint
- Metrics endpoint

This order ensures that the highest business-impact workflows are tested first.

## 5. Test Approach

## 5.1 Manual Testing

Manual testing will be used for:

- Exploratory testing of the main user interface
- Validation of complete user flows
- Negative form scenarios
- Role-based access checks
- Basic visual verification of major pages
- Admin versus non-admin behavior comparison

## 5.2 Automated Testing

Automated testing will be introduced through:

- **Postman** for API smoke testing
- **Playwright** for UI smoke testing
- **GitHub Actions** for basic repeatable QA checks in CI

Initial automation is intentionally small and focused on the highest-priority flows.

## 5.3 Test Levels

### API-Level Testing
The API layer will be validated through direct endpoint testing. Key areas include:

- Authentication endpoints
- Product endpoints
- Cart endpoints
- Order endpoints
- Admin endpoints
- Health and metrics endpoints

### UI-Level Testing
The UI layer will be validated for:

- Home page access
- Login workflow
- Product browsing
- Cart interaction
- Admin dashboard access

### Integration-Level Testing
Initial integration checks will verify:

- Frontend to backend communication
- Backend to PostgreSQL persistence
- Cart to order transition
- Admin operations affecting stored data

## 6. Initial Test Types

The following test types are included in this phase:

- Smoke testing
- Functional testing
- Basic negative testing
- Basic authorization testing
- Basic integration testing

Optional future extension:
- Broader regression testing
- Load testing
- Expanded API automation
- Security-oriented checks

## 7. Entry Criteria

Testing may begin when the following conditions are met:

- The repository is cloned successfully
- Python dependencies are installed
- PostgreSQL is running through Docker Compose
- `.env` is created from `.env.example`
- Alembic migrations run successfully
- The FastAPI application starts successfully
- The application is accessible at `http://127.0.0.1:8000`
- Seeded users are available for login
- `/api/health` responds successfully :contentReference[oaicite:7]{index=7}

## 8. Exit Criteria

The initial QA phase is considered complete when:

- High-risk modules have been reviewed
- Core smoke scenarios have been executed
- Initial defects have been documented
- Baseline metrics have been collected
- Supporting screenshots are stored
- QA documents are completed
- Basic CI validation has been prepared

## 9. Tools

The following tools are recommended for the QA setup:

- **Postman** for API endpoint testing
- **Playwright** for browser-based smoke testing
- **Docker Compose** for local PostgreSQL environment
- **Alembic** for schema migration and seed setup
- **GitHub Actions** for a basic CI pipeline

These tools are suitable for a modern web application and can be set up quickly for initial QA work.

## 10. Initial Smoke Coverage Plan

The initial smoke suite should cover:

### Authentication
- Valid login
- Invalid login
- Protected endpoint without token
- Admin-only endpoint access control

### Product Area
- Product list retrieval
- Featured product retrieval
- Category retrieval
- Product details access

### Cart and Checkout
- Add item to cart
- Update cart item quantity
- Remove item from cart
- Apply coupon
- Set shipping method
- Create order

### Orders
- Get user orders
- Get order details

### Admin
- Admin login
- Admin dashboard access
- Create product
- Update product
- Delete product
- Update order status

### Technical Endpoints
- Health endpoint
- Metrics endpoint

## 11. Deliverables

The output of the initial QA phase will include:

- Risk assessment document
- Test strategy document
- QA environment setup report
- Baseline metrics summary
- Postman collection
- Playwright smoke tests
- CI workflow configuration
- Screenshots and supporting evidence

## 12. Conclusion

The NovaCart QA strategy uses a risk-based approach to direct limited testing effort toward the most business-critical modules. Initial work will focus on authentication, transaction flow, and administrative control. This strategy is appropriate for a first QA assignment because it creates a practical baseline for later expansion into regression, performance, and research-oriented testing.