import { html } from "../core/react.js";

export function SectionHeader({ eyebrow, title, aside }) {
  return html`
    <div className="section-head">
      <div>
        <p className="eyebrow">${eyebrow}</p>
        <h2>${title}</h2>
      </div>
      ${aside ? html`<div>${aside}</div>` : null}
    </div>
  `;
}
