import { html } from "../core/react.js";
import { ProductCard } from "../components/ProductCard.js";

export function CatalogPage({ products, categories, filters, setFilters, onAdd }) {
  return html`
    <main className="container section">
      <div className="section-head">
        <div>
          <p className="eyebrow">Storefront</p>
          <h1>Catalog explorer</h1>
        </div>
        <span className="muted">${products.length} products matched</span>
      </div>

      <section className="catalog-shell">
        <aside className="sidebar-card filter-panel">
          <p className="eyebrow">Refine</p>
          <h3>Search and sort</h3>
          <div className="form-grid">
            <input className="input" placeholder="Search products or tags" value=${filters.q} onChange=${(e) => setFilters({ ...filters, q: e.target.value })} />
            <select className="select" value=${filters.category} onChange=${(e) => setFilters({ ...filters, category: e.target.value })}>
              <option value="">All categories</option>
              ${categories.map((category) => html`<option key=${category} value=${category}>${category}</option>`)}
            </select>
            <select className="select" value=${filters.sort} onChange=${(e) => setFilters({ ...filters, sort: e.target.value })}>
              <option value="featured">Featured</option>
              <option value="price_asc">Price low-high</option>
              <option value="price_desc">Price high-low</option>
              <option value="rating">Top rated</option>
            </select>
            <select className="select" value=${filters.featured} onChange=${(e) => setFilters({ ...filters, featured: e.target.value })}>
              <option value="">All inventory</option>
              <option value="true">Featured only</option>
              <option value="false">Non-featured</option>
            </select>
          </div>
        </aside>

        <div className="catalog-content">
          <div className="toolbar glass">
            <div>
              <strong>Active query</strong>
              <p className="muted">${filters.q || "Showing the full catalog with live sorting and category filters."}</p>
            </div>
            <button className="button-ghost" onClick=${() => setFilters({ q: "", category: "", sort: "featured", featured: "" })}>Reset filters</button>
          </div>
          <div className="grid">
            ${products.map((item) => html`<${ProductCard} key=${item.id} product=${item} onAdd=${onAdd} />`)}
          </div>
        </div>
      </section>
    </main>
  `;
}
