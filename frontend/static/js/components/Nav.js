import { html } from "../core/react.js";
import { linkTo, routes } from "../core/router.js";

export function Nav({ user, onLogout }) {
  const visibleRoutes = routes.filter((route) => {
    if (route.path === "/auth") {
      return !user;
    }
    if (route.path === "/admin") {
      return user?.role === "admin";
    }
    return true;
  });

  return html`
    <header className="topbar container">
      <a className="brand" href="/" onClick=${linkTo("/")}>NovaCart</a>
      <nav className="nav-links">
        ${visibleRoutes.map(
          (route) => html`
            <a
              key=${route.path}
              className=${`nav-link ${window.location.pathname === route.path ? "active" : ""}`}
              href=${route.path}
              onClick=${linkTo(route.path)}
            >
              ${route.label}
            </a>
          `
        )}
        ${user
          ? html`
              <span className="nav-link">${user.full_name}</span>
              <button className="button-ghost" onClick=${onLogout}>Logout</button>
            `
          : null}
      </nav>
    </header>
  `;
}
