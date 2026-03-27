import { html } from "../core/react.js";
import { linkTo } from "../core/router.js";
import { groupBy, money } from "../core/utils.js";
import { ProductCard } from "../components/ProductCard.js";
import { SectionHeader } from "../components/SectionHeader.js";

export function HomePage({ metrics, featured, inventory, onAdd }) {
  const grouped = groupBy(inventory, "category");
  const spotlight = Object.entries(grouped)
    .slice(0, 3)
    .map(([category, items]) => ({
      category,
      count: items.length,
      startPrice: Math.min(...items.map((item) => item.price)),
    }));

  return html`
    <main className="container">
      <section className="hero">
        <div className="hero-card">
          <p className="eyebrow">Structured commerce demo</p>
          <h1 className="hero-title">An e-commerce frontend that behaves like a product, not a mockup.</h1>
          <p className="muted">
            Curated storefront modules, richer admin workflows, pricing states, and React-driven navigation layered on top of the FastAPI backend.
          </p>
          <div className="pill-row">
            <span className="pill">React modules</span>
            <span className="pill">Pricing flows</span>
            <span className="pill">Admin ops</span>
          </div>
          <div className="action-row hero-actions">
            <a className="button" href="/catalog" onClick=${linkTo("/catalog")}>Shop catalog</a>
            <a className="button-ghost" href="/admin" onClick=${linkTo("/admin")}>Inspect operations</a>
          </div>
        </div>
        <div className="hero-grid">
          <div className="stat-card"><span className="muted">Products</span><strong className="stat-value">${metrics.products}</strong></div>
          <div className="stat-card"><span className="muted">Categories</span><strong className="stat-value">${metrics.categories}</strong></div>
          <div className="stat-card"><span className="muted">Cart items</span><strong className="stat-value">${metrics.cart_items}</strong></div>
          <div className="stat-card"><span className="muted">Orders</span><strong className="stat-value">${metrics.orders}</strong></div>
        </div>
      </section>

      <section className="section two-column">
        <div>
          <${SectionHeader} eyebrow="Storefront" title="Featured collection" />
          <div className="grid">
            ${featured.map((item) => html`<${ProductCard} key=${item.id} product=${item} onAdd=${onAdd} />`)}
          </div>
        </div>
        <aside className="sidebar-card">
          <p className="eyebrow">Category radar</p>
          <h3>Where the catalog is strongest</h3>
          <div className="list-stack">
            ${spotlight.map(
              (item) => html`
                <div key=${item.category} className="mini-panel">
                  <div className="meta-row">
                    <strong>${item.category}</strong>
                    <span>${item.count} SKUs</span>
                  </div>
                  <p className="muted">Starts at ${money(item.startPrice)}</p>
                </div>
              `
            )}
          </div>
        </aside>
      </section>
    </main>
  `;
}
