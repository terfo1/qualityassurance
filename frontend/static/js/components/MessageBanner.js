import { html } from "../core/react.js";
import { statusTone } from "../core/utils.js";

export function MessageBanner({ message }) {
  return html`<div className=${`message ${statusTone(message)}`}>${message}</div>`;
}
