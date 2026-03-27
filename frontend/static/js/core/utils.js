export function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

export function statusTone(message) {
  if (!message) {
    return "";
  }
  return message.toLowerCase().includes("error") ? "" : "success";
}

export function groupBy(items, key) {
  return items.reduce((accumulator, item) => {
    const bucket = item[key];
    if (!accumulator[bucket]) {
      accumulator[bucket] = [];
    }
    accumulator[bucket].push(item);
    return accumulator;
  }, {});
}
