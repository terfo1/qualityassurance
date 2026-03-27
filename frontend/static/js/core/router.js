import { useEffect, useState } from "./react.js";

export const routes = [
  { path: "/", label: "Home" },
  { path: "/catalog", label: "Catalog" },
  { path: "/product", label: "Product" },
  { path: "/cart", label: "Cart" },
  { path: "/admin", label: "Admin" },
  { path: "/auth", label: "Login" },
];

export function navigate(path, query) {
  const next = query ? `${path}?${new URLSearchParams(query)}` : path;
  window.history.pushState({}, "", next);
  window.dispatchEvent(new Event("popstate"));
}

export function linkTo(path, query) {
  return (event) => {
    event.preventDefault();
    navigate(path, query);
  };
}

export function useRoute() {
  const [route, setRoute] = useState({
    pathname: window.location.pathname,
    search: new URLSearchParams(window.location.search),
  });

  useEffect(() => {
    const sync = () =>
      setRoute({
        pathname: window.location.pathname,
        search: new URLSearchParams(window.location.search),
      });
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  return route;
}
