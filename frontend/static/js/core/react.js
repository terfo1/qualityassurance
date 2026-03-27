export const ReactRef = window.React;
export const ReactDOMRef = window.ReactDOM;
export const html = window.htm.bind(ReactRef.createElement);

export const {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  useTransition,
} = ReactRef;
