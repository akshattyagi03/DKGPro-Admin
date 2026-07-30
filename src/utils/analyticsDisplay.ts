/** Pie / legend labels — backend sends lowercase status enums */
export function formatOrderStatusLabel(status: string) {
  if (!status) return '';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function ordersByStatusForCharts(rows: { status: string; count: number }[]) {
  return rows.map((r) => ({
    status: formatOrderStatusLabel(r.status),
    count: r.count,
  }));
}

export function formatInr(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}
