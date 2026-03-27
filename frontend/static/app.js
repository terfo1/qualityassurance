import { ReactDOMRef, html, useDeferredValue, useEffect, useMemo, useState, useTransition } from "./js/core/react.js";
import { api, getAuthToken, jsonHeaders, setAuthToken } from "./js/core/api.js";
import { navigate, useRoute } from "./js/core/router.js";
import { Nav } from "./js/components/Nav.js";
import { HomePage } from "./js/pages/HomePage.js";
import { CatalogPage } from "./js/pages/CatalogPage.js";
import { ProductPage } from "./js/pages/ProductPage.js";
import { CartPage } from "./js/pages/CartPage.js";
import { AdminPage } from "./js/pages/AdminPage.js";
import { AuthPage } from "./js/pages/AuthPage.js";

function emptyCart() {
  return {
    items: [],
    pricing: { subtotal: 0, discount: 0, shipping: 0, tax: 0, total: 0 },
    count: 0,
    shipping_method: "standard",
  };
}

function App() {
  const route = useRoute();
  const [isPending, startTransition] = useTransition();
  const [metrics, setMetrics] = useState({ products: 0, categories: 0, cart_items: 0, orders: 0 });
  const [featured, setFeatured] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState(emptyCart());
  const [detail, setDetail] = useState(null);
  const [dashboard, setDashboard] = useState({ products: 0, orders: 0, revenue: 0, inventory_units: 0, low_stock: [], coupons: [] });
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [reviewForm, setReviewForm] = useState({ author: "", rating: "5", comment: "" });
  const [filters, setFilters] = useState({ q: "", category: "", sort: "featured", featured: "" });
  const [checkoutForm, setCheckoutForm] = useState({ customer_name: "", email: "", address: "", coupon: "" });
  const [adminForm, setAdminForm] = useState({ name: "", category: "", image: "", price: "", stock: "", rating: "4.5", featured: "false", tags: "", description: "" });
  const [orderStatus, setOrderStatus] = useState({});
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ email: "", full_name: "", password: "" });
  const [authMessage, setAuthMessage] = useState("");
  const deferredFilters = useDeferredValue(filters);

  const catalogQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (deferredFilters.q) params.set("q", deferredFilters.q);
    if (deferredFilters.category) params.set("category", deferredFilters.category);
    if (deferredFilters.sort) params.set("sort", deferredFilters.sort);
    if (deferredFilters.featured) params.set("featured", deferredFilters.featured);
    return params.toString();
  }, [deferredFilters]);

  async function loadCurrentUser() {
    if (!getAuthToken()) {
      setUser(null);
      setCart(emptyCart());
      return;
    }
    try {
      const currentUser = await api("/api/auth/me");
      setUser(currentUser);
      setCheckoutForm((current) => ({
        ...current,
        customer_name: current.customer_name || currentUser.full_name,
        email: current.email || currentUser.email,
      }));
    } catch (error) {
      setAuthToken(null);
      setUser(null);
      setCart(emptyCart());
    }
  }

  async function refreshCart() {
    if (!getAuthToken()) {
      setCart(emptyCart());
      return;
    }
    try {
      setCart(await api("/api/cart"));
    } catch (error) {
      setMessage(`Error: ${error.message}`);
      if (error.message === "Authentication required") {
        setAuthToken(null);
        setUser(null);
        setCart(emptyCart());
      }
    }
  }

  async function refreshHome() {
    const [metricsData, featuredData, inventoryData] = await Promise.all([
      api("/api/metrics"),
      api("/api/products/featured"),
      api("/api/products?sort=rating"),
    ]);
    startTransition(() => {
      setMetrics(metricsData);
      setFeatured(featuredData);
      setInventory(inventoryData);
    });
  }

  async function refreshCatalog() {
    const [productsData, categoriesData] = await Promise.all([
      api(`/api/products${catalogQuery ? `?${catalogQuery}` : ""}`),
      api("/api/products/categories"),
    ]);
    startTransition(() => {
      setProducts(productsData);
      setCategories(categoriesData);
    });
  }

  async function refreshProduct(productId) {
    setDetail(await api(`/api/products/${productId}`));
  }

  async function refreshAdmin() {
    if (user?.role !== "admin") {
      return;
    }
    const [dashboardData, productsData, ordersData] = await Promise.all([
      api("/api/admin/dashboard"),
      api("/api/products?sort=featured"),
      api("/api/orders"),
    ]);
    startTransition(() => {
      setDashboard(dashboardData);
      setProducts(productsData);
      setOrders(ordersData);
    });
  }

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    refreshCart();
    if (route.pathname === "/") refreshHome();
    if (route.pathname === "/catalog") refreshCatalog();
    if (route.pathname === "/product") refreshProduct(route.search.get("id") || "1").catch((error) => setMessage(`Error: ${error.message}`));
    if (route.pathname === "/admin") refreshAdmin().catch((error) => setAdminMessage(`Error: ${error.message}`));
  }, [route.pathname, route.search.toString(), catalogQuery, user?.role]);

  async function addToCart(productId, quantityValue = 1) {
    if (!user) {
      navigate("/auth");
      setMessage("Login required to add items to the database-backed cart");
      return;
    }
    try {
      setCart(await api("/api/cart/items", { method: "POST", headers: jsonHeaders, body: JSON.stringify({ product_id: productId, quantity: quantityValue }) }));
      setMessage(`Added ${quantityValue} item(s) to cart`);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  }

  async function submitReview() {
    try {
      const id = route.search.get("id") || "1";
      await api(`/api/products/${id}/reviews`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ author: reviewForm.author, rating: Number(reviewForm.rating), comment: reviewForm.comment }),
      });
      setReviewForm({ author: "", rating: "5", comment: "" });
      setMessage("Review submitted");
      await refreshProduct(id);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  }

  async function checkout() {
    try {
      const order = await api("/api/orders", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({
          customer_name: checkoutForm.customer_name,
          email: checkoutForm.email,
          address: checkoutForm.address,
          shipping_method: cart.shipping_method,
        }),
      });
      setMessage(`Order #${order.id} confirmed`);
      setCheckoutForm((current) => ({
        ...current,
        address: "",
        coupon: "",
      }));
      await refreshCart();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  }

  async function applyCoupon() {
    try {
      setCart(await api("/api/cart/coupon", { method: "POST", headers: jsonHeaders, body: JSON.stringify({ code: checkoutForm.coupon }) }));
      setMessage("Coupon applied");
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  }

  async function removeCoupon() {
    setCart(await api("/api/cart/coupon", { method: "DELETE" }));
  }

  async function updateShipping(method) {
    try {
      setCart(await api("/api/cart/shipping", { method: "POST", headers: jsonHeaders, body: JSON.stringify({ shipping_method: method }) }));
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  }

  async function removeItem(productId) {
    setCart(await api(`/api/cart/items/${productId}`, { method: "DELETE" }));
  }

  async function createProduct() {
    try {
      await api("/api/admin/products", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({
          name: adminForm.name,
          category: adminForm.category,
          image: adminForm.image,
          price: Number(adminForm.price),
          stock: Number(adminForm.stock),
          rating: Number(adminForm.rating),
          featured: adminForm.featured === "true",
          tags: adminForm.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
          description: adminForm.description,
        }),
      });
      setAdminMessage("Product created");
      setAdminForm({ name: "", category: "", image: "", price: "", stock: "", rating: "4.5", featured: "false", tags: "", description: "" });
      await refreshAdmin();
    } catch (error) {
      setAdminMessage(`Error: ${error.message}`);
    }
  }

  async function deleteProduct(productId) {
    await api(`/api/admin/products/${productId}`, { method: "DELETE" });
    await refreshAdmin();
  }

  async function updateOrderStatus(orderId) {
    try {
      await api(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: jsonHeaders,
        body: JSON.stringify({ status: orderStatus[orderId] || "confirmed" }),
      });
      setAdminMessage(`Order #${orderId} updated`);
      await refreshAdmin();
    } catch (error) {
      setAdminMessage(`Error: ${error.message}`);
    }
  }

  async function submitAuth() {
    if (!authForm.email.trim()) {
      setAuthMessage("Error: Email is required");
      return;
    }
    if (authMode === "register" && !authForm.full_name.trim()) {
      setAuthMessage("Error: Full name is required");
      return;
    }
    if (authForm.password.length < 8) {
      setAuthMessage("Error: Password must be at least 8 characters");
      return;
    }

    try {
      const payload = await api(`/api/auth/${authMode === "login" ? "login" : "register"}`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify(authMode === "login"
          ? { email: authForm.email, password: authForm.password }
          : { email: authForm.email, full_name: authForm.full_name, password: authForm.password }),
      });
      setAuthToken(payload.token);
      setUser(payload.user);
      setAuthForm({ email: "", full_name: "", password: "" });
      setAuthMessage("");
      setCheckoutForm((current) => ({
        ...current,
        customer_name: payload.user.full_name,
        email: payload.user.email,
      }));
      navigate("/");
      await refreshCart();
    } catch (error) {
      setAuthMessage(`Error: ${error.message}`);
    }
  }

  function logout() {
    setAuthToken(null);
    setUser(null);
    setCart(emptyCart());
    setOrders([]);
    setDashboard({ products: 0, orders: 0, revenue: 0, inventory_units: 0, low_stock: [], coupons: [] });
    navigate("/");
  }

  return html`
    <div className="app-shell">
      <${Nav} user=${user} onLogout=${logout} />
      ${isPending ? html`<div className="container pending-state">Refreshing view...</div>` : null}
      ${route.pathname === "/" ? html`<${HomePage} metrics=${metrics} featured=${featured} inventory=${inventory} onAdd=${addToCart} />` : null}
      ${route.pathname === "/catalog" ? html`<${CatalogPage} products=${products} categories=${categories} filters=${filters} setFilters=${setFilters} onAdd=${addToCart} />` : null}
      ${route.pathname === "/product" ? html`<${ProductPage} detail=${detail} quantity=${quantity} setQuantity=${setQuantity} reviewForm=${reviewForm} setReviewForm=${setReviewForm} submitReview=${submitReview} onAdd=${addToCart} message=${message} />` : null}
      ${route.pathname === "/cart" ? html`<${CartPage} cart=${cart} form=${checkoutForm} setForm=${setCheckoutForm} checkout=${checkout} applyCoupon=${applyCoupon} removeCoupon=${removeCoupon} updateShipping=${updateShipping} removeItem=${removeItem} message=${message} user=${user} />` : null}
      ${route.pathname === "/admin" ? html`<${AdminPage} dashboard=${dashboard} products=${products} orders=${orders} adminForm=${adminForm} setAdminForm=${setAdminForm} createProduct=${createProduct} deleteProduct=${deleteProduct} orderStatus=${orderStatus} setOrderStatus=${setOrderStatus} updateOrderStatus=${updateOrderStatus} adminMessage=${adminMessage} user=${user} />` : null}
      ${route.pathname === "/auth" ? html`<${AuthPage} mode=${authMode} setMode=${setAuthMode} form=${authForm} setForm=${setAuthForm} submit=${submitAuth} message=${authMessage} user=${user} />` : null}
    </div>
  `;
}

ReactDOMRef.createRoot(document.getElementById("root")).render(html`<${App} />`);
