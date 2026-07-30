import { ChipListField } from "@/components/product-form/ChipListField";
import { FormSectionCard } from "@/components/product-form/FormSectionCard";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Palette } from "lucide-react";

export type BalloonColorSelectionFormState = {
  enabled: boolean;
  defaultOptionLabel: string;
  defaultOptionDescription: string;
  allowCustom: boolean;
  customOptionLabel: string;
  inheritFromCategory: boolean;
  presetLabels: string[];
};

export function emptyBalloonColorForm(): BalloonColorSelectionFormState {
  return {
    enabled: true,
    defaultOptionLabel: "Same as image",
    defaultOptionDescription: "Default colors shown in the photo",
    allowCustom: true,
    customOptionLabel: "Custom",
    inheritFromCategory: true,
    presetLabels: [],
  };
}

export function balloonColorFormFromApi(
  raw: unknown
): BalloonColorSelectionFormState {
  const base = emptyBalloonColorForm();
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  const presets = Array.isArray(o.presets)
    ? o.presets
        .map((p) =>
          p && typeof p === "object" && "label" in p
            ? String((p as { label?: string }).label ?? "").trim()
            : ""
        )
        .filter(Boolean)
    : [];
  return {
    enabled: o.enabled !== false,
    defaultOptionLabel: String(o.defaultOptionLabel ?? base.defaultOptionLabel),
    defaultOptionDescription: String(
      o.defaultOptionDescription ?? base.defaultOptionDescription
    ),
    allowCustom: o.allowCustom !== false,
    customOptionLabel: String(o.customOptionLabel ?? base.customOptionLabel),
    inheritFromCategory: o.inheritFromCategory !== false,
    presetLabels: presets,
  };
}

export function balloonColorFormToApiPayload(
  form: BalloonColorSelectionFormState
) {
  return {
    enabled: form.enabled,
    defaultOptionLabel: form.defaultOptionLabel.trim() || "Same as image",
    defaultOptionDescription:
      form.defaultOptionDescription.trim() ||
      "Default colors shown in the photo",
    allowCustom: form.allowCustom,
    customOptionLabel: form.customOptionLabel.trim() || "Custom",
    inheritFromCategory: form.inheritFromCategory,
    presets: form.presetLabels.map((label) => ({ label: label.trim() })).filter((p) => p.label),
  };
}

type BalloonColorPresetsPanelProps = {
  value: BalloonColorSelectionFormState;
  onChange: (next: BalloonColorSelectionFormState) => void;
  disabled?: boolean;
  onReject?: (message: string) => void;
};

export function BalloonColorPresetsPanel({
  value,
  onChange,
  disabled,
  onReject,
}: BalloonColorPresetsPanelProps) {
  const patch = (partial: Partial<BalloonColorSelectionFormState>) =>
    onChange({ ...value, ...partial });

  return (
    <FormSectionCard
      title="Balloon color picker"
      description="Shown on the product page below tags for Decorations › Balloon Decoration products. Leave presets empty to inherit third-category defaults on the storefront."
      icon={Palette}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
          <div>
            <Label htmlFor="balloon-colors-enabled" className="text-sm font-medium">
              Show on product page
            </Label>
            <p className="text-xs text-muted-foreground">
              Enable the “Choose Balloon Colors” block for this product.
            </p>
          </div>
          <Switch
            id="balloon-colors-enabled"
            checked={value.enabled}
            onCheckedChange={(checked) => patch({ enabled: checked })}
            disabled={disabled}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="balloon-default-label">Default option label</Label>
            <Input
              id="balloon-default-label"
              value={value.defaultOptionLabel}
              onChange={(e) => patch({ defaultOptionLabel: e.target.value })}
              disabled={disabled}
              placeholder="Same as image"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="balloon-custom-label">Custom button label</Label>
            <Input
              id="balloon-custom-label"
              value={value.customOptionLabel}
              onChange={(e) => patch({ customOptionLabel: e.target.value })}
              disabled={disabled}
              placeholder="Custom"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="balloon-default-desc">Default option description</Label>
            <Input
              id="balloon-default-desc"
              value={value.defaultOptionDescription}
              onChange={(e) =>
                patch({ defaultOptionDescription: e.target.value })
              }
              disabled={disabled}
              placeholder="Default colors shown in the photo"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2.5">
          <div>
            <Label htmlFor="balloon-allow-custom" className="text-sm font-medium">
              Allow custom colors
            </Label>
            <p className="text-xs text-muted-foreground">
              Guests can type one or two custom color names (free text).
            </p>
          </div>
          <Switch
            id="balloon-allow-custom"
            checked={value.allowCustom}
            onCheckedChange={(checked) => patch({ allowCustom: checked })}
            disabled={disabled}
          />
        </div>

        <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2.5">
          <div>
            <Label htmlFor="balloon-inherit" className="text-sm font-medium">
              Inherit from third category
            </Label>
            <p className="text-xs text-muted-foreground">
              Use third-category presets when this product has none listed below.
            </p>
          </div>
          <Switch
            id="balloon-inherit"
            checked={value.inheritFromCategory}
            onCheckedChange={(checked) =>
              patch({ inheritFromCategory: checked })
            }
            disabled={disabled}
          />
        </div>

        <ChipListField
          label="Color options"
          description="Each entry is one color pill on the product page (e.g. Gold, Blue, Pink). Customers pick one color, or Custom to combine any two."
          placeholder="Gold"
          values={value.presetLabels}
          onChange={(presetLabels) => patch({ presetLabels })}
          disabled={disabled}
          onReject={onReject}
          sanitize={(raw) => {
            const s = raw.trim();
            return s.length > 0 ? s : null;
          }}
        />
      </div>
    </FormSectionCard>
  );
}

export function isBalloonDecorationCategoryNames(
  mainName?: string,
  subName?: string,
  thirdName?: string
): boolean {
  const main = (mainName ?? "").toLowerCase();
  const sub = (subName ?? "").toLowerCase();
  const third = (thirdName ?? "").toLowerCase();
  if (!main.includes("decor")) return false;
  return sub.includes("balloon") || third.includes("balloon");
}
