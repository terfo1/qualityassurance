import { html } from "../core/react.js";
import { linkTo } from "../core/router.js";
import { money } from "../core/utils.js";
import { MessageBanner } from "../components/MessageBanner.js";
import { ProductCard } from "../components/ProductCard.js";

export function ProductPage({
  detail,
  quantity,
  setQuantity,
  reviewForm,
  setReviewForm,
  submitReview,
  onAdd,
  message,
}) {
  if (!detail) {
    return html`<main className="container section"><p>Loading...</p></main>`;
  }

  const { product, reviews, related } = detail;

  return html`
    <main className="container section">
      <section className="detail-layout">
        <div className="detail-visual glass"><img src=${product.image} alt=${product.name} /></div>
        <div className="detail-panel glass form-grid">
          <p className="eyebrow">${product.category}</p>
          <h1 className="detail-name">${product.name}</h1>
          <p className="muted">${product.description}</p>
          <div className="pill-row">
            ${(product.tags || []).map((tag) => html`<span key=${tag} className="pill">${tag}</span>`)}
          </div>
          <div className="stats-inline">
            <div className="mini-panel"><span className="muted">Rating</span><strong>${product.rating}/5</strong></div>
            <div className="mini-panel"><span className="muted">Inventory</span><strong>${product.stock} units</strong></div>
          </div>
          <div className="price-band">
            <strong>${money(product.price)}</strong>
            <span className="badge">${product.featured ? "Featured pick" : "Standard item"}</span>
          </div>
          <div className="purchase-row">
            <select className="select" value=${quantity} onChange=${(e) => setQuantity(e.target.value)}>
              ${[1, 2, 3, 4, 5].map((value) => html`<option key=${value} value=${value}>Qty ${value}</option>`)}
            </select>
            <button className="button" onClick=${() => onAdd(product.id, Number(quantity))}>Add ${quantity} to cart</button>
            <a className="button-ghost" href="/cart" onClick=${linkTo("/cart")}>Checkout</a>
          </div>
        </div>
      </section>

      <section className="section two-column">
        <div className="list-stack">
          <div className="section-head">
            <div>
              <p className="eyebrow">Customer voice</p>
              <h2>Reviews</h2>
            </div>
            <span className="muted">${reviews.length} entries</span>
          </div>
          ${reviews.map(
            (review) => html`
              <article key=${review.id} className="review-card">
                <div className="meta-row">
                  <strong>${review.author}</strong>
                  <span>${review.rating}/5</span>
                </div>
                <p className="muted">${review.comment}</p>
              </article>
            `
          )}
        </div>
        <aside className="sidebar-card">
          <p className="eyebrow">Contribute</p>
          <h3>Write a review</h3>
          <div className="form-grid">
            <input className="input" placeholder="Your name" value=${reviewForm.author} onChange=${(e) => setReviewForm({ ...reviewForm, author: e.target.value })} />
            <select className="select" value=${reviewForm.rating} onChange=${(e) => setReviewForm({ ...reviewForm, rating: e.target.value })}>
              <option value="5">5</option>
              <option value="4">4</option>
              <option value="3">3</option>
              <option value="2">2</option>
              <option value="1">1</option>
            </select>
            <textarea className="textarea" placeholder="What stood out?" value=${reviewForm.comment} onChange=${(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}></textarea>
            <button className="button" onClick=${submitReview}>Submit review</button>
            <${MessageBanner} message=${message} />
          </div>
        </aside>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Recommended</p>
            <h2>Related products</h2>
          </div>
        </div>
        <div className="grid">
          ${related.map((item) => html`<${ProductCard} key=${item.id} product=${item} onAdd=${onAdd} />`)}
        </div>
      </section>
    </main>
  `;
}
