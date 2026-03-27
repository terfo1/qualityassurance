import { html } from "../core/react.js";
import { linkTo } from "../core/router.js";
import { money } from "../core/utils.js";

export function ProductCard({ product, onAdd }) {
  return html`
    <article className="product-card">
      <img className="product-image" src=${product.image} alt=${product.name} />
      <div className="product-content form-grid">
        <div className="meta-row">
          <span className="muted">${product.category}</span>
          <span className="badge">${product.featured ? "Featured" : "Curated"}</span>
        </div>
        <div>
          <h3 className="product-name">${product.name}</h3>
          <p className="muted">${product.description}</p>
        </div>
        <div className="pill-row">
          ${(product.tags || []).slice(0, 3).map((tag) => html`<span key=${tag} className="pill small">${tag}</span>`)}
        </div>
        <div className="price-row">
          <strong>${money(product.price)}</strong>
          <span className="muted">${product.rating}/5 rating</span>
        </div>
        <div className="action-row">
          <a className="button-ghost" href="/product?id=${product.id}" onClick=${linkTo("/product", { id: product.id })}>View details</a>
          <button className="button" onClick=${() => onAdd(product.id)}>Add to cart</button>
        </div>
      </div>
    </article>
  `;
}
