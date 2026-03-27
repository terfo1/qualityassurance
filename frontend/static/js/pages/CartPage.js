import { html } from "../core/react.js";
import { money } from "../core/utils.js";
import { MessageBanner } from "../components/MessageBanner.js";

export function CartPage({
  cart,
  form,
  setForm,
  checkout,
  applyCoupon,
  removeCoupon,
  updateShipping,
  removeItem,
  message,
  user,
}) {
  if (!user) {
    return html`
      <main className="container section">
        <article className="sidebar-card">
          <p className="eyebrow">Authentication</p>
          <h1>Login required</h1>
          <p className="muted">Sign in or register to persist your cart and place orders.</p>
          <${MessageBanner} message=${message || "Open the Login page to continue."} />
        </article>
      </main>
    `;
  }

  const progress = cart.pricing.total >= 120 ? 100 : Math.min((cart.pricing.total / 120) * 100, 100);

  return html`
    <main className="container section">
      <div className="section-head">
        <div>
          <p className="eyebrow">Checkout</p>
          <h1>Cart and pricing engine</h1>
        </div>
        <span className="muted">${cart.count} items</span>
      </div>

      <section className="layout">
        <div className="list-stack">
          <div className="promo-band glass">
            <div>
              <strong>Free premium handling at $120 total</strong>
              <p className="muted">This progress bar reacts to coupon discounts and shipping changes.</p>
            </div>
            <div className="progress"><span style=${{ width: `${progress}%` }}></span></div>
          </div>

          ${cart.items.map(
            (item) => html`
              <article key=${item.product.id} className="list-card">
                <div className="meta-row">
                  <strong>${item.product.name}</strong>
                  <strong>${money(item.line_total)}</strong>
                </div>
                <div className="meta-row">
                  <span className="muted">${item.quantity} x ${money(item.product.price)}</span>
                  <span className=${item.low_stock ? "stock-low" : "muted"}>${item.low_stock ? "Low stock" : "In stock"}</span>
                </div>
                <div className="action-row">
                  <span className="badge">${item.product.category}</span>
                  <button className="button-danger" onClick=${() => removeItem(item.product.id)}>Remove</button>
                </div>
              </article>
            `
          )}
        </div>

        <aside className="sidebar-card">
          <div className="form-grid">
            <h3>Order summary</h3>
            <select className="select" value=${cart.shipping_method} onChange=${(e) => updateShipping(e.target.value)}>
              <option value="standard">Standard shipping</option>
              <option value="express">Express shipping</option>
              <option value="pickup">Store pickup</option>
            </select>

            <div className="action-row">
              <input className="input" placeholder="Coupon code" value=${form.coupon} onChange=${(e) => setForm({ ...form, coupon: e.target.value })} />
              <button className="button-ghost" onClick=${applyCoupon}>Apply</button>
            </div>

            ${cart.coupon_code ? html`<button className="button-danger" onClick=${removeCoupon}>Remove ${cart.coupon_code}</button>` : null}

            <div className="summary-grid">
              <div className="summary-item"><span>Subtotal</span><strong>${money(cart.pricing.subtotal)}</strong></div>
              <div className="summary-item"><span>Discount</span><strong>${money(cart.pricing.discount)}</strong></div>
              <div className="summary-item"><span>Shipping</span><strong>${money(cart.pricing.shipping)}</strong></div>
              <div className="summary-item"><span>Tax</span><strong>${money(cart.pricing.tax)}</strong></div>
              <div className="summary-item summary-total"><span>Total</span><strong>${money(cart.pricing.total)}</strong></div>
            </div>

            <input className="input" placeholder="Full name" value=${form.customer_name} onChange=${(e) => setForm({ ...form, customer_name: e.target.value })} />
            <input className="input" placeholder="Email" value=${form.email} onChange=${(e) => setForm({ ...form, email: e.target.value })} />
            <textarea className="textarea" placeholder="Shipping address" value=${form.address} onChange=${(e) => setForm({ ...form, address: e.target.value })}></textarea>
            <button className="button" onClick=${checkout}>Place order</button>
            <${MessageBanner} message=${message} />
          </div>
        </aside>
      </section>
    </main>
  `;
}
