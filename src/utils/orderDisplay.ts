import type { ApiAdminOrderItem } from '@/api/admins';

export function formatOrderDate(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatMoneyInr(amount?: number | null): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '—';
  return `₹${n.toLocaleString('en-IN')}`;
}

type AddonLine = NonNullable<ApiAdminOrderItem['bookingAddonLines']>[number];

export function sortAddonLines(lines?: AddonLine[]): AddonLine[] {
  if (!lines?.length) return [];
  return [...lines].sort((a, b) =>
    `${a.addonName ?? ''}`.trim().toLowerCase().localeCompare(
      `${b.addonName ?? ''}`.trim().toLowerCase(),
      'en',
      { sensitivity: 'base' }
    )
  );
}

export function linePackageTotal(line: ApiAdminOrderItem): number {
  return (Number(line.price) || 0) * (line.quantity || 1);
}

export function lineAddonsTotal(line: ApiAdminOrderItem): number {
  return (
    line.bookingAddonLines?.reduce((sum, addon) => sum + (Number(addon.lineTotal) || 0), 0) ?? 0
  );
}

export function lineGrandTotal(line: ApiAdminOrderItem): number {
  return linePackageTotal(line) + lineAddonsTotal(line);
}

export function sumLineGrandTotals(lines: ApiAdminOrderItem[]): number {
  return lines.reduce((sum, line) => sum + lineGrandTotal(line), 0);
}

type ShippingAddress = {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  phoneNumber?: string;
  alternatePhoneNumber?: string;
};

export function shippingAddressRows(
  address?: ShippingAddress | null
): Array<{ label: string; value: string }> {
  if (!address) return [];

  const rows: Array<{ label: string; value: string }> = [];
  if (address.street?.trim()) rows.push({ label: 'Street', value: address.street.trim() });
  if (address.city?.trim()) rows.push({ label: 'City', value: address.city.trim() });
  if (address.state?.trim()) rows.push({ label: 'State', value: address.state.trim() });
  if (address.zipCode?.trim()) rows.push({ label: 'PIN code', value: address.zipCode.trim() });
  if (address.country?.trim()) rows.push({ label: 'Country', value: address.country.trim() });
  if (address.phoneNumber?.trim()) rows.push({ label: 'Phone', value: address.phoneNumber.trim() });
  if (address.alternatePhoneNumber?.trim()) {
    rows.push({ label: 'Alternate phone', value: address.alternatePhoneNumber.trim() });
  }
  return rows;
}

export function formatBalloonColorLine(
  choice?: { mode?: string; label?: string; colors?: string[] } | null
): string | null {
  if (!choice || choice.mode === 'default') return null;
  if (choice.colors?.length) return choice.colors.join(' & ');
  return choice.label?.trim() || null;
}

export function giftCardDisplayRows(
  choice?: {
    babyName?: string;
    whichBirthday?: string;
    size?: string;
    sizePrice?: number;
  } | null
): Array<{ label: string; value: string }> {
  if (!choice) return [];
  const rows: Array<{ label: string; value: string }> = [];
  if (choice.babyName?.trim()) rows.push({ label: 'Baby name', value: choice.babyName.trim() });
  if (choice.whichBirthday?.trim()) {
    rows.push({ label: 'Birthday', value: choice.whichBirthday.trim() });
  }
  if (choice.size?.trim()) {
    const price = Number(choice.sizePrice);
    const sizeValue =
      Number.isFinite(price) && price > 0
        ? `${choice.size.trim()} · ₹${price.toLocaleString('en-IN')}`
        : choice.size.trim();
    rows.push({ label: 'Size', value: sizeValue });
  }
  return rows;
}
