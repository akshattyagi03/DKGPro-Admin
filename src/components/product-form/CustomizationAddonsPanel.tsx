import { useCallback, useEffect, useRef, useState } from 'react';
import { Boxes, ChevronDown, ListChecks, Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { searchAddons, type ApiAddonSearchItem } from '@/api/admins';
import { FormSectionCard } from '@/components/product-form/FormSectionCard';
import { AddAddonModal } from '@/components/product-form/AddAddonModal';

/** Form state for one customization section (maps to product `customizationSections[]`). */
export type CustomizationSectionFormRow = {
  localId: string;
  name: string;
  priority: number;
  addons: { localId: string; name: string }[];
};

function newLocalId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function emptyCustomizationSection(
  partial?: Partial<Pick<CustomizationSectionFormRow, 'name' | 'priority'>>
): CustomizationSectionFormRow {
  return {
    localId: newLocalId(),
    name: partial?.name ?? '',
    priority: partial?.priority ?? 0,
    addons: [],
  };
}

type CustomizationAddonsPanelProps = {
  sections: CustomizationSectionFormRow[];
  onSectionsChange: (next: CustomizationSectionFormRow[]) => void;
  sanitize: (raw: string) => string | null;
  onReject: (msg: string) => void;
  disabled?: boolean;
};

function SectionAddonPickRow({
  addon,
  index,
  siblingAddonNames,
  onAddonChange,
  onRemove,
  disabled,
}: {
  addon: { localId: string; name: string };
  index: number;
  siblingAddonNames: string[];
  onAddonChange: (idx: number, next: { localId: string; name: string }) => void;
  onRemove: (idx: number) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState(addon.name);
  const [results, setResults] = useState<ApiAddonSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const otherNames = siblingAddonNames
    .filter((_, i) => i !== index)
    .map((a) => a.trim())
    .filter(Boolean);

  useEffect(() => {
    setQuery(addon.name);
  }, [addon.name]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = window.setTimeout(() => {
      searchAddons(q)
        .then((res) => {
          const filtered = (res.addons ?? []).filter(
            (a) => !otherNames.includes(a.name) || a.name.trim() === addon.name.trim()
          );
          setResults(filtered);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 320);
    return () => window.clearTimeout(t);
  }, [query, addon.name, otherNames.join('|')]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const pick = useCallback(
    (item: ApiAddonSearchItem) => {
      onAddonChange(index, { ...addon, name: item.name });
      setQuery(item.name);
      setOpen(false);
      setResults([]);
    },
    [addon, index, onAddonChange]
  );

  return (
    <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm ring-1 ring-black/[0.03]">
      <div className="space-y-2">
        <Label htmlFor={`addon-search-${addon.localId}`} className="text-xs font-medium text-muted-foreground">
          Search & select add-on
        </Label>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
          <div className="relative min-w-0 flex-1" ref={wrapRef}>
            <Input
              id={`addon-search-${addon.localId}`}
              value={query}
              onChange={(e) => {
                const v = e.target.value;
                setQuery(v);
                onAddonChange(index, { ...addon, name: v });
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder="Type to search catalog…"
              disabled={disabled}
              autoComplete="off"
              className="h-10 w-full"
            />
            {open && (loading || results.length > 0) && (
              <div
                className="absolute left-0 right-0 top-full z-20 mt-1 max-h-52 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md"
                role="listbox"
              >
                {loading ? (
                  <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Searching…
                  </div>
                ) : (
                  results.map((r) => (
                    <button
                      key={r._id}
                      type="button"
                      className="flex w-full flex-col gap-0.5 px-3 py-2.5 text-left text-sm hover:bg-muted"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        pick(r);
                      }}
                    >
                      <span className="font-medium">{r.name}</span>
                      {r.category != null && r.category !== '' && (
                        <span className="text-xs text-muted-foreground">{r.category}</span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center justify-end sm:border-l sm:border-border/60 sm:pl-4">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={disabled}
              onClick={() => onRemove(index)}
              aria-label="Remove add-on row"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Search existing add-ons — the product stores the add-on name exactly.
        </p>
      </div>
    </div>
  );
}

const SECTION_PRESETS = ['Recommended', 'Engagement Activity'] as const;

export function CustomizationAddonsPanel({
  sections,
  onSectionsChange,
  sanitize,
  onReject,
  disabled,
}: CustomizationAddonsPanelProps) {
  const [addonsOpen, setAddonsOpen] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForSectionId, setCreateForSectionId] = useState<string | null>(null);

  const openCreateFor = (sectionId: string) => {
    setCreateForSectionId(sectionId);
    setCreateOpen(true);
  };

  const onAddonCreated = (name: string) => {
    const sid = createForSectionId;
    if (!sid) return;
    onSectionsChange(
      sections.map((s) =>
        s.localId === sid
          ? {
              ...s,
              addons: [...s.addons, { localId: newLocalId(), name }],
            }
          : s
      )
    );
    setAddonsOpen(true);
    setCreateForSectionId(null);
  };

  const addPresetSection = (preset: string) => {
    const cleaned = sanitize(preset);
    if (cleaned == null) {
      onReject('That section name is not allowed.');
      return;
    }
    if (sections.some((s) => s.name.trim().toLowerCase() === cleaned.toLowerCase())) {
      onReject(`Section "${cleaned}" is already in the list.`);
      return;
    }
    onSectionsChange([...sections, emptyCustomizationSection({ name: cleaned, priority: sections.length })]);
  };

  const updateSection = (localId: string, patch: Partial<CustomizationSectionFormRow>) => {
    onSectionsChange(
      sections.map((s) => (s.localId === localId ? { ...s, ...patch } : s))
    );
  };

  const removeSection = (localId: string) => {
    onSectionsChange(sections.filter((s) => s.localId !== localId));
  };

  return (
    <>
      <FormSectionCard
        title="Make your experience special"
        description="Each customization section (e.g. Recommended, Engagement Activity) groups catalog add-ons shown under that tab on the guest site. Names must match how you want them to appear."
        icon={ListChecks}
      >
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pl-4">
            <span className="text-xs font-medium leading-none text-muted-foreground">
              Quick add section:
            </span>
            {SECTION_PRESETS.map((label) => (
              <Button
                key={label}
                type="button"
                variant="outline"
                size="sm"
                className="h-9 shrink-0"
                disabled={disabled}
                onClick={() => addPresetSection(label)}
              >
                {label}
              </Button>
            ))}
          </div>

          <Collapsible open={addonsOpen} onOpenChange={setAddonsOpen}>
            <div className="flex flex-col gap-3 rounded-xl border border-dashed border-muted-foreground/25 bg-muted/10 p-4 sm:flex-row sm:items-center sm:justify-between">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex flex-1 items-center gap-2 text-left text-sm font-semibold text-foreground"
                >
                  <Boxes className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>Customization sections & add-ons</span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                      addonsOpen && 'rotate-180'
                    )}
                  />
                  <span className="text-xs font-normal text-muted-foreground">
                    (section name, priority, nested catalog add-ons)
                  </span>
                </button>
              </CollapsibleTrigger>
            </div>

            <CollapsibleContent className="space-y-6 pt-4">
              {sections.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No sections yet. Use <span className="font-medium">Quick add</span> or{' '}
                  <span className="font-medium">Add customization section</span> below, then link add-ons from the
                  catalog per section.
                </p>
              ) : null}

              {sections.map((section) => {
                const siblingNames = section.addons.map((a) => a.name);
                return (
                  <div
                    key={section.localId}
                    className="rounded-xl border border-border bg-card/50 p-4 shadow-sm ring-1 ring-black/[0.02]"
                  >
                    <div className="mb-4">
                      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                        <div className="min-w-0 space-y-1.5">
                          <Label htmlFor={`sec-name-${section.localId}`}>Section name</Label>
                          <Input
                            id={`sec-name-${section.localId}`}
                            value={section.name}
                            onChange={(e) => updateSection(section.localId, { name: e.target.value })}
                            onBlur={() => {
                              const cleaned = sanitize(section.name);
                              if (cleaned == null && section.name.trim()) {
                                onReject('That section name is not allowed.');
                                updateSection(section.localId, { name: '' });
                              } else if (cleaned != null) {
                                updateSection(section.localId, { name: cleaned });
                              }
                            }}
                            placeholder="e.g. Recommended"
                            disabled={disabled}
                            className="h-10"
                          />
                        </div>
                        <div className="min-w-0 space-y-1.5">
                          <Label htmlFor={`sec-prio-${section.localId}`}>Priority</Label>
                          <Input
                            id={`sec-prio-${section.localId}`}
                            type="number"
                            min={0}
                            step={1}
                            value={Number.isFinite(section.priority) ? section.priority : 0}
                            onChange={(e) => {
                              const n = parseInt(e.target.value, 10);
                              updateSection(section.localId, {
                                priority: Number.isNaN(n) ? 0 : Math.max(0, n),
                              });
                            }}
                            disabled={disabled}
                            className="h-10"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-10 shrink-0 border-destructive/30 text-destructive hover:bg-destructive/10"
                          disabled={disabled}
                          onClick={() => removeSection(section.localId)}
                        >
                          <Trash2 className="mr-1.5 h-4 w-4" />
                          Remove section
                        </Button>
                      </div>
                      <div className="mt-1.5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                        <div className="hidden sm:block" aria-hidden />
                        <p className="text-[11px] leading-snug text-muted-foreground">
                          Lower numbers appear first when sorted.
                        </p>
                        <div className="hidden sm:block" aria-hidden />
                      </div>
                    </div>

                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Add-ons in this section
                    </p>

                    <div className="space-y-3">
                      {section.addons.map((addon, idx) => (
                        <SectionAddonPickRow
                          key={addon.localId}
                          addon={addon}
                          index={idx}
                          siblingAddonNames={siblingNames}
                          disabled={disabled}
                          onAddonChange={(i, next) => {
                            const copy = [...section.addons];
                            copy[i] = next;
                            updateSection(section.localId, { addons: copy });
                          }}
                          onRemove={(i) =>
                            updateSection(section.localId, {
                              addons: section.addons.filter((_, j) => j !== i),
                            })
                          }
                        />
                      ))}

                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          disabled={disabled}
                          onClick={() =>
                            updateSection(section.localId, {
                              addons: [...section.addons, { localId: newLocalId(), name: '' }],
                            })
                          }
                        >
                          <Plus className="h-4 w-4" />
                          Link add-on
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="gap-1"
                          disabled={disabled}
                          onClick={() => openCreateFor(section.localId)}
                        >
                          <Plus className="h-4 w-4" />
                          New add-on
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={disabled}
                onClick={() => onSectionsChange([...sections, emptyCustomizationSection()])}
              >
                <Plus className="h-4 w-4" />
                Add customization section
              </Button>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </FormSectionCard>

      <AddAddonModal
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o);
          if (!o) setCreateForSectionId(null);
        }}
        onCreated={onAddonCreated}
      />
    </>
  );
}
