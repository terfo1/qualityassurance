import { html } from "../core/react.js";
import { MessageBanner } from "../components/MessageBanner.js";

export function AuthPage({ mode, setMode, form, setForm, submit, message, user }) {
  if (user) {
    return html`
      <main className="container section">
        <article className="sidebar-card">
          <p className="eyebrow">Account</p>
          <h1>You are signed in</h1>
          <p className="muted">${user.full_name} • ${user.email}</p>
        </article>
      </main>
    `;
  }

  return html`
    <main className="container section">
      <section className="layout">
        <article className="sidebar-card">
          <p className="eyebrow">Access</p>
          <h1>${mode === "login" ? "Login to continue" : "Create an account"}</h1>
          <p className="muted">Cart, checkout, and admin operations are now backed by PostgreSQL user data.</p>
        </article>

        <article className="sidebar-card">
          <div className="action-row">
            <button className=${mode === "login" ? "button" : "button-ghost"} onClick=${() => setMode("login")}>Login</button>
            <button className=${mode === "register" ? "button" : "button-ghost"} onClick=${() => setMode("register")}>Register</button>
          </div>

          <div className="form-grid">
            ${mode === "register"
              ? html`
                  <input className="input" placeholder="Full name" value=${form.full_name} onChange=${(e) => setForm({ ...form, full_name: e.target.value })} />
                `
              : null}
            <input className="input" placeholder="Email" value=${form.email} onChange=${(e) => setForm({ ...form, email: e.target.value })} />
            <input className="input" type="password" placeholder="Password" value=${form.password} onChange=${(e) => setForm({ ...form, password: e.target.value })} />
            <button className="button" onClick=${submit}>${mode === "login" ? "Login" : "Create account"}</button>
            <${MessageBanner} message=${message} />
          </div>
        </article>
      </section>
    </main>
  `;
}
