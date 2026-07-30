import { useCallback, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createAddon, type AddonCustomFieldPayload } from '@/api/admins';
import { toast } from '@/hooks/use-toast';
import { CategoryBannerSingleField } from '@/components/modals/CategoryBannerSingleField';
import { ChipListField } from '@/components/product-form/ChipListField';
import { Loader2, Plus, Trash2 } from 'lucide-react';

type AddAddonModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the new addon name after successful create */
  onCreated: (name: string) => void;
};

type CustomFieldDraft = {
  localId: string;
  label: string;
  key: string;
  type: AddonCustomFieldPayload['type'];
  required: boolean;
  maxLength: string;
  optionsText: string;
};

function newFieldRow(): CustomFieldDraft {
  return {
    localId: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `cf-${Date.now()}`,
    label: '',
    key: '',
    type: 'text',
    required: false,
    maxLength: '',
    optionsText: '',
  };
}

const tagSanitize = (raw: string): string | null => {
  const s = raw.trim();
  return s === '' ? null : s;
};

export function AddAddonModal({ open, onOpenChange, onCreated }: AddAddonModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [customFields, setCustomFields] = useState<CustomFieldDraft[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setName('');
    setDescription('');
    setPrice('');
    setCategory('');
    setImage(null);
    setTags([]);
    setCustomFields([]);
  };

  const chipReject = useCallback((msg: string) => {
    toast({ title: msg, variant: 'destructive' });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = Number(price);
    if (!name.trim() || !description.trim() || !Number.isFinite(p) || p < 0 || !category.trim()) {
      toast({ title: 'Fill name, description, price, and category', variant: 'destructive' });
      return;
    }
    if (!image) {
      toast({ title: 'Add-on image is required', variant: 'destructive' });
      return;
    }

    const customFieldsPayload: AddonCustomFieldPayload[] = customFields
      .filter((r) => r.label.trim() && r.key.trim())
      .map((r) => {
        const base: AddonCustomFieldPayload = {
          label: r.label.trim(),
          key: r.key.trim(),
          type: r.type,
          required: r.required,
        };
        if (r.maxLength.trim()) {
          const ml = Number(r.maxLength);
          if (Number.isFinite(ml) && ml > 0) base.maxLength = ml;
        }
        if (r.type === 'dropdown' && r.optionsText.trim()) {
          base.options = r.optionsText
            .split(',')
            .map((x) => x.trim())
            .filter(Boolean);
        }
        return base;
      });

    setSubmitting(true);
    try {
      await createAddon({
        name: name.trim(),
        description: description.trim(),
        price: p,
        category: category.trim(),
        image,
        tags: tags.length ? tags : undefined,
        customFields: customFieldsPayload.length ? customFieldsPayload : undefined,
      });
      toast({ title: 'Add-on created' });
      onCreated(name.trim());
      reset();
      onOpenChange(false);
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : 'Failed to create add-on',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-h-[min(90vh,880px)] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create add-on</DialogTitle>
          <DialogDescription>
            Name, description, price, image, category, and optional tags or custom fields.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="addon-name">Name</Label>
              <Input
                id="addon-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Extra balloon arch"
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="addon-desc">Description</Label>
              <Textarea
                id="addon-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addon-price">Price (₹)</Label>
              <Input
                id="addon-price"
                type="number"
                min={0}
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addon-cat">Category</Label>
              <Input
                id="addon-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Balloons"
                required
              />
            </div>
          </div>

          <CategoryBannerSingleField
            id="addon-image-upload"
            file={image}
            onChange={setImage}
            label="Add-on image"
            description="Required — same upload pattern as category banners. PNG, JPG, or WebP."
            emptySubtext="Square or wide image works. Max size depends on server limits."
          />

          <div>
            <ChipListField
              label="Tags"
              description="Optional — used for search and filtering."
              placeholder="Type tag and press Enter"
              values={tags}
              onChange={setTags}
              sanitize={tagSanitize}
              onReject={chipReject}
            />
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">Custom fields</p>
                <p className="text-xs text-muted-foreground">
                  Optional — label, key, type; dropdowns need comma-separated options.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => setCustomFields((prev) => [...prev, newFieldRow()])}
              >
                <Plus className="h-4 w-4" />
                Add field
              </Button>
            </div>

            {customFields.length === 0 ? (
              <p className="rounded-lg border border-dashed bg-muted/20 px-3 py-4 text-center text-sm text-muted-foreground">
                No custom fields. Add one if guests should fill extra details for this add-on.
              </p>
            ) : (
              <ul className="space-y-3">
                {customFields.map((row, idx) => (
                  <li
                    key={row.localId}
                    className="rounded-xl border bg-muted/10 p-3 shadow-sm ring-1 ring-border/40"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-muted-foreground">Field {idx + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          setCustomFields((prev) => prev.filter((r) => r.localId !== row.localId))
                        }
                        aria-label="Remove field"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label className="text-xs">Label</Label>
                        <Input
                          value={row.label}
                          onChange={(e) => {
                            const v = e.target.value;
                            setCustomFields((prev) =>
                              prev.map((r) => (r.localId === row.localId ? { ...r, label: v } : r))
                            );
                          }}
                          placeholder="Shown to customer"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Key</Label>
                        <Input
                          value={row.key}
                          onChange={(e) => {
                            const v = e.target.value;
                            setCustomFields((prev) =>
                              prev.map((r) => (r.localId === row.localId ? { ...r, key: v } : r))
                            );
                          }}
                          placeholder="e.g. balloon_color"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Type</Label>
                        <Select
                          value={row.type}
                          onValueChange={(val: AddonCustomFieldPayload['type']) => {
                            setCustomFields((prev) =>
                              prev.map((r) =>
                                r.localId === row.localId ? { ...r, type: val } : r
                              )
                            );
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="textarea">Textarea</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="dropdown">Dropdown</SelectItem>
                            <SelectItem value="file">File</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2.5 pt-2 sm:col-span-2">
                        <Checkbox
                          id={`req-${row.localId}`}
                          checked={row.required}
                          onCheckedChange={(c) => {
                            const checked = c === true;
                            setCustomFields((prev) =>
                              prev.map((r) =>
                                r.localId === row.localId ? { ...r, required: checked } : r
                              )
                            );
                          }}
                        />
                        <Label htmlFor={`req-${row.localId}`} className="text-sm font-normal">
                          Required
                        </Label>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Max length (optional)</Label>
                        <Input
                          type="number"
                          min={1}
                          value={row.maxLength}
                          onChange={(e) => {
                            const v = e.target.value;
                            setCustomFields((prev) =>
                              prev.map((r) => (r.localId === row.localId ? { ...r, maxLength: v } : r))
                            );
                          }}
                          placeholder="e.g. 200"
                        />
                      </div>
                      {row.type === 'dropdown' ? (
                        <div className="space-y-1.5 sm:col-span-2">
                          <Label className="text-xs">Dropdown options (comma-separated)</Label>
                          <Input
                            value={row.optionsText}
                            onChange={(e) => {
                              const v = e.target.value;
                              setCustomFields((prev) =>
                                prev.map((r) =>
                                  r.localId === row.localId ? { ...r, optionsText: v } : r
                                )
                              );
                            }}
                            placeholder="Red, Blue, Gold"
                          />
                        </div>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                'Create add-on'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
