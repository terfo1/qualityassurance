import { html } from "../core/react.js";
import { money } from "../core/utils.js";
import { MessageBanner } from "../components/MessageBanner.js";

export function AdminPage({
  dashboard,
  products,
  orders,
  adminForm,
  setAdminForm,
  createProduct,
  deleteProduct,
  orderStatus,
  setOrderStatus,
  updateOrderStatus,
  adminMessage,
  user,
}) {
  if (user?.role !== "admin") {
    return html`
      <main className="container section">
        <article className="sidebar-card">
          <p className="eyebrow">Restricted</p>
          <h1>Admin access required</h1>
          <${MessageBanner} message=${adminMessage || "Login with an admin account to manage inventory and orders."} />
        </article>
      </main>
    `;
  }

  return html`
    <main className="container section">
      <div className="section-head">
        <div>
          <p className="eyebrow">Operations</p>
          <h1>Admin control room</h1>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><span className="muted">Products</span><strong className="kpi">${dashboard.products}</strong></div>
        <div className="stat-card"><span className="muted">Orders</span><strong className="kpi">${dashboard.orders}</strong></div>
        <div className="stat-card"><span className="muted">Revenue</span><strong className="kpi">${money(dashboard.revenue)}</strong></div>
        <div className="stat-card"><span className="muted">Inventory units</span><strong className="kpi">${dashboard.inventory_units}</strong></div>
      </div>

      <section className="admin-shell">
        <div className="list-stack">
          <article className="sidebar-card">
            <p className="eyebrow">Risk</p>
            <h3>Low stock watchlist</h3>
            <div className="list-stack">
              ${(dashboard.low_stock || []).length
                ? dashboard.low_stock.map(
                    (product) => html`
                      <div key=${product.id} className="admin-row-card">
                        <div className="meta-row">
                          <strong>${product.name}</strong>
                          <span className="stock-low">${product.stock} left</span>
                        </div>
                        <p className="muted">${product.category}</p>
                      </div>
                    `
                  )
                : html`<p className="muted">No low-stock products right now.</p>`}
            </div>
          </article>

          <article className="sidebar-card">
            <p className="eyebrow">Coupons</p>
            <h3>Promotion inventory</h3>
            <div className="list-stack">
              ${(dashboard.coupons || []).map(
                (coupon) => html`
                  <div key=${coupon.code} className="admin-row-card">
                    <div className="meta-row">
                      <strong>${coupon.code}</strong>
                      <span className="badge">${coupon.discount_type}</span>
                    </div>
                    <p className="muted">Value ${coupon.value} • Minimum subtotal ${money(coupon.minimum_subtotal)}</p>
                  </div>
                `
              )}
            </div>
          </article>

          <article className="sidebar-card">
            <p className="eyebrow">Orders</p>
            <h3>Status management</h3>
            <div className="list-stack">
              ${orders.map(
                (order) => html`
                  <div key=${order.id} className="admin-row-card">
                    <div className="meta-row">
                      <strong>Order #${order.id}</strong>
                      <span>${money(order.pricing.total)}</span>
                    </div>
                    <div className="meta-row">
                      <span className="muted">${order.customer_name}</span>
                      <span className="muted">${order.status}</span>
                    </div>
                    <div className="action-row">
                      <select className="select" value=${orderStatus[order.id] || order.status} onChange=${(e) => setOrderStatus({ ...orderStatus, [order.id]: e.target.value })}>
                        <option value="pending">pending</option>
                        <option value="confirmed">confirmed</option>
                        <option value="fulfilled">fulfilled</option>
                      </select>
                      <button className="button" onClick=${() => updateOrderStatus(order.id)}>Save</button>
                    </div>
                  </div>
                `
              )}
            </div>
          </article>
        </div>

        <div className="list-stack">
          <article className="sidebar-card">
            <p className="eyebrow">Inventory</p>
            <h3>Current products</h3>
            <div className="list-stack">
              ${products.map(
                (product) => html`
                  <div key=${product.id} className="admin-row-card">
                    <div className="meta-row">
                      <strong>${product.name}</strong>
                      <span>${money(product.price)}</span>
                    </div>
                    <div className="meta-row">
                      <span className="muted">${product.category}</span>
                      <span className="muted">Stock ${product.stock}</span>
                    </div>
                    <button className="button-danger" onClick=${() => deleteProduct(product.id)}>Delete</button>
                  </div>
                `
              )}
            </div>
          </article>

          <article className="sidebar-card">
            <p className="eyebrow">Create</p>
            <h3>Add inventory item</h3>
            <div className="form-grid">
              <input className="input" placeholder="Name" value=${adminForm.name} onChange=${(e) => setAdminForm({ ...adminForm, name: e.target.value })} />
              <input className="input" placeholder="Category" value=${adminForm.category} onChange=${(e) => setAdminForm({ ...adminForm, category: e.target.value })} />
              <input className="input" placeholder="Image URL" value=${adminForm.image} onChange=${(e) => setAdminForm({ ...adminForm, image: e.target.value })} />
              <div className="price-row">
                <input className="input" type="number" min="1" step="0.01" placeholder="Price" value=${adminForm.price} onChange=${(e) => setAdminForm({ ...adminForm, price: e.target.value })} />
                <input className="input" type="number" min="0" step="1" placeholder="Stock" value=${adminForm.stock} onChange=${(e) => setAdminForm({ ...adminForm, stock: e.target.value })} />
              </div>
              <div className="price-row">
                <input className="input" type="number" min="0" max="5" step="0.1" placeholder="Rating" value=${adminForm.rating} onChange=${(e) => setAdminForm({ ...adminForm, rating: e.target.value })} />
                <select className="select" value=${adminForm.featured} onChange=${(e) => setAdminForm({ ...adminForm, featured: e.target.value })}>
                  <option value="false">Standard</option>
                  <option value="true">Featured</option>
                </select>
              </div>
              <input className="input" placeholder="Tags: comma,separated" value=${adminForm.tags} onChange=${(e) => setAdminForm({ ...adminForm, tags: e.target.value })} />
              <textarea className="textarea" placeholder="Description" value=${adminForm.description} onChange=${(e) => setAdminForm({ ...adminForm, description: e.target.value })}></textarea>
              <button className="button" onClick=${createProduct}>Create product</button>
              <${MessageBanner} message=${adminMessage} />
            </div>
          </article>
        </div>
      </section>
    </main>
  `;
}
