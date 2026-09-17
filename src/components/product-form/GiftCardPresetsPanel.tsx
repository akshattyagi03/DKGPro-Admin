import { FormSectionCard } from "@/components/product-form/FormSectionCard";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Gift, Plus, X } from "lucide-react";

export const DEFAULT_GIFT_CARD_SIZES: Array<{ label: string; price: number }> = [
  { label: "1x1.5 Ft. (2mm Foam Board)", price: 1299 },
  { label: "2x1.5 Ft. (3mm Foam Board)", price: 1999 },
  { label: "2x3 Ft. (3mm Foam Board)", price: 2499 },
];

export type GiftCardSizeFormRow = {
  label: string;
  price: string;
};

export type GiftCardSelectionFormState = {
  enabled: boolean;
  babyNameLabel: string;
  birthdayLabel: string;
  sizeLabel: string;
  inheritFromCategory: boolean;
  sizes: GiftCardSizeFormRow[];
};

export function emptyGiftCardForm(): GiftCardSelectionFormState {
  return {
    enabled: true,
    babyNameLabel: "Baby Name",
    birthdayLabel: "Which Birthday It Is",
    sizeLabel: "Select Size",
    inheritFromCategory: true,
    sizes: DEFAULT_GIFT_CARD_SIZES.map((row) => ({
      label: row.label,
      price: String(row.price),
    })),
  };
}

function parseSizePrice(raw: unknown): string {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return "";
  return String(n);
}

export function giftCardFormFromApi(raw: unknown): GiftCardSelectionFormState {
  const base = emptyGiftCardForm();
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  const sizes = Array.isArray(o.sizes)
    ? o.sizes
        .map((p) => {
          if (!p || typeof p !== "object") return null;
          const row = p as { label?: string; price?: unknown };
          const label = String(row.label ?? "").trim();
          if (!label) return null;
          return { label, price: parseSizePrice(row.price) };
        })
        .filter((row): row is GiftCardSizeFormRow => Boolean(row))
    : [];
  return {
    enabled: o.enabled !== false,
    babyNameLabel: String(o.babyNameLabel ?? base.babyNameLabel),
    birthdayLabel: String(o.birthdayLabel ?? base.birthdayLabel),
    sizeLabel: String(o.sizeLabel ?? base.sizeLabel),
    inheritFromCategory: o.inheritFromCategory !== false,
    sizes: sizes.length ? sizes : base.sizes,
  };
}

export function giftCardFormToApiPayload(form: GiftCardSelectionFormState) {
  return {
    enabled: form.enabled,
    babyNameLabel: form.babyNameLabel.trim() || "Baby Name",
    birthdayLabel: form.birthdayLabel.trim() || "Which Birthday It Is",
    sizeLabel: form.sizeLabel.trim() || "Select Size",
    inheritFromCategory: form.inheritFromCategory,
    sizes: form.sizes
      .map((row) => {
        const label = row.label.trim();
        const price = Number(row.price);
        if (!label) return null;
        return {
          label,
          ...(Number.isFinite(price) && price > 0 ? { price } : {}),
        };
      })
      .filter((row): row is { label: string; price?: number } => Boolean(row)),
  };
}

export function giftCardSizePriceError(
  form: GiftCardSelectionFormState
): string | null {
  const rows = form.sizes.filter((row) => row.label.trim());
  if (rows.length === 0) {
    return "Add at least one size and a price for it.";
  }
  if (rows.some((row) => !(Number(row.price) > 0))) {
    return "Enter a price for each size. Guests are charged that amount when they pick the size.";
  }
  return null;
}

type GiftCardPresetsPanelProps = {
  value: GiftCardSelectionFormState;
  onChange: (next: GiftCardSelectionFormState) => void;
  disabled?: boolean;
  onReject?: (message: string) => void;
  sizePriceError?: string;
};

export function GiftCardPresetsPanel({
  value,
  onChange,
  disabled,
  sizePriceError,
}: GiftCardPresetsPanelProps) {
  const patch = (partial: Partial<GiftCardSelectionFormState>) =>
    onChange({ ...value, ...partial });

  const updateSize = (index: number, partial: Partial<GiftCardSizeFormRow>) => {
    patch({
      sizes: value.sizes.map((row, i) =>
        i === index ? { ...row, ...partial } : row
      ),
    });
  };

  return (
    <FormSectionCard
      title="Digital gift card details"
      description="Shown on the product page for Gifts › Digital Gift Card products. Guests enter baby name, which birthday it is, and pick a foam-board size. Each size can have its own price."
      icon={Gift}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
          <div>
            <Label htmlFor="gift-card-enabled" className="text-sm font-medium">
              Show on product page
            </Label>
            <p className="text-xs text-muted-foreground">
              Enable the personalization block for this product.
            </p>
          </div>
          <Switch
            id="gift-card-enabled"
            checked={value.enabled}
            onCheckedChange={(checked) => patch({ enabled: checked })}
            disabled={disabled}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="gift-card-baby-label">Baby name field label</Label>
            <Input
              id="gift-card-baby-label"
              value={value.babyNameLabel}
              onChange={(e) => patch({ babyNameLabel: e.target.value })}
              disabled={disabled}
              placeholder="Baby Name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gift-card-birthday-label">Birthday field label</Label>
            <Input
              id="gift-card-birthday-label"
              value={value.birthdayLabel}
              onChange={(e) => patch({ birthdayLabel: e.target.value })}
              disabled={disabled}
              placeholder="Which Birthday It Is"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="gift-card-size-label">Size field label</Label>
            <Input
              id="gift-card-size-label"
              value={value.sizeLabel}
              onChange={(e) => patch({ sizeLabel: e.target.value })}
              disabled={disabled}
              placeholder="Select Size"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2.5">
          <div>
            <Label htmlFor="gift-card-inherit" className="text-sm font-medium">
              Inherit from third category
            </Label>
            <p className="text-xs text-muted-foreground">
              Use third-category sizes when this product has none listed below.
            </p>
          </div>
          <Switch
            id="gift-card-inherit"
            checked={value.inheritFromCategory}
            onCheckedChange={(checked) =>
              patch({ inheritFromCategory: checked })
            }
            disabled={disabled}
          />
        </div>

        <div className="space-y-3 rounded-lg border border-border/60 bg-muted/10 p-3">
          <div>
            <Label>Size prices charged at checkout</Label>
            <p className="text-xs text-muted-foreground">
              Set a selling price for each board size while uploading this product. The guest pays the price of the size they pick, not the MRP above.
            </p>
            {sizePriceError ? (
              <p className="pt-1 text-sm text-destructive">{sizePriceError}</p>
            ) : null}
          </div>
          <div className="hidden gap-2 text-xs font-medium text-muted-foreground sm:grid sm:grid-cols-[1fr_8.5rem_auto]">
            <span>Size</span>
            <span>Price (₹)</span>
            <span className="sr-only">Remove</span>
          </div>
          <div className="space-y-2">
            {value.sizes.map((row, index) => (
              <div
                key={`gift-card-size-${index}`}
                className="grid gap-2 sm:grid-cols-[1fr_8.5rem_auto]"
              >
                <div className="space-y-1">
                  <Label className="sm:hidden text-xs">Size</Label>
                  <Input
                    value={row.label}
                    onChange={(e) => updateSize(index, { label: e.target.value })}
                    disabled={disabled}
                    placeholder="e.g. 1x1.5 Ft. (2mm Foam Board)"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="sm:hidden text-xs">Price (₹)</Label>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    value={row.price}
                    onChange={(e) => updateSize(index, { price: e.target.value })}
                    disabled={disabled}
                    placeholder="1299"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="self-end sm:self-auto"
                  disabled={disabled || value.sizes.length <= 1}
                  onClick={() =>
                    patch({
                      sizes: value.sizes.filter((_, i) => i !== index),
                    })
                  }
                  aria-label="Remove size"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() =>
              patch({
                sizes: [...value.sizes, { label: "", price: "" }],
              })
            }
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add another size
          </Button>
        </div>
      </div>
    </FormSectionCard>
  );
}

export function isDigitalGiftCardCategoryNames(
  mainName?: string,
  subName?: string,
  thirdName?: string
): boolean {
  const third = (thirdName ?? "").toLowerCase();
  if (third.includes("gift card") || third.includes("digital card")) return true;
  const blob = `${mainName ?? ""} ${subName ?? ""} ${third}`.toLowerCase();
  return blob.includes("digital gift card");
}
