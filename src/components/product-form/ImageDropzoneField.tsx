import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { ImagePlus, Link2, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

export type ProductImageItem =
  | { id: string; kind: 'url'; url: string }
  | { id: string; kind: 'file'; file: File };

const MAX_IMAGES = 10;
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = 'image/jpeg,image/jpg,image/png,image/webp';

function newId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `img-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isAllowedImageType(file: File) {
  const t = file.type.toLowerCase();
  return t === 'image/jpeg' || t === 'image/jpg' || t === 'image/png' || t === 'image/webp';
}

type ImageDropzoneFieldProps = {
  items: ProductImageItem[];
  onChange: (items: ProductImageItem[]) => void;
  disabled?: boolean;
  error?: string;
};

/** Multiple product images: file upload (drag-and-drop or pick) and optional HTTPS URLs. */
export function ImageDropzoneField({ items, onChange, disabled, error }: ImageDropzoneFieldProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlDraft, setUrlDraft] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const previewUrlsRef = useRef<Map<string, string>>(new Map());

  const revokePreview = useCallback((id: string) => {
    const u = previewUrlsRef.current.get(id);
    if (u) {
      URL.revokeObjectURL(u);
      previewUrlsRef.current.delete(id);
    }
  }, []);

  useEffect(() => {
    const ids = new Set(items.filter((i) => i.kind === 'file').map((i) => i.id));
    for (const [id, url] of previewUrlsRef.current) {
      if (!ids.has(id)) {
        URL.revokeObjectURL(url);
        previewUrlsRef.current.delete(id);
      }
    }
  }, [items]);

  useEffect(() => {
    return () => {
      for (const url of previewUrlsRef.current.values()) {
        URL.revokeObjectURL(url);
      }
      previewUrlsRef.current.clear();
    };
  }, []);

  const getPreviewSrc = (item: ProductImageItem) => {
    if (item.kind === 'url') return item.url;
    let p = previewUrlsRef.current.get(item.id);
    if (!p) {
      p = URL.createObjectURL(item.file);
      previewUrlsRef.current.set(item.id, p);
    }
    return p;
  };

  const addFiles = (fileList: FileList | File[]) => {
    const next = Array.from(fileList);
    if (next.length === 0) return;
    const remaining = MAX_IMAGES - items.length;
    if (remaining <= 0) {
      toast({ title: `At most ${MAX_IMAGES} images`, variant: 'destructive' });
      return;
    }
    const toAdd: ProductImageItem[] = [];
    for (const file of next) {
      if (toAdd.length + items.length >= MAX_IMAGES) {
        toast({ title: `At most ${MAX_IMAGES} images`, variant: 'destructive' });
        break;
      }
      if (!isAllowedImageType(file)) {
        toast({
          title: 'Unsupported file type',
          description: 'Use JPEG, PNG, or WebP only.',
          variant: 'destructive',
        });
        continue;
      }
      if (file.size > MAX_BYTES) {
        toast({
          title: 'File too large',
          description: 'Each image must be 5 MB or smaller.',
          variant: 'destructive',
        });
        continue;
      }
      toAdd.push({ id: newId(), kind: 'file', file });
    }
    if (toAdd.length) onChange([...items, ...toAdd]);
  };

  const addUrl = () => {
    const u = urlDraft.trim();
    if (!u) return;
    if (items.length >= MAX_IMAGES) {
      toast({ title: `At most ${MAX_IMAGES} images`, variant: 'destructive' });
      return;
    }
    try {
      const parsed = new URL(u);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        toast({ title: 'Invalid URL', description: 'Use http or https image URLs only.', variant: 'destructive' });
        return;
      }
    } catch {
      toast({ title: 'Invalid URL', description: 'Enter a valid link.', variant: 'destructive' });
      return;
    }
    if (items.some((i) => i.kind === 'url' && i.url === u)) {
      setUrlDraft('');
      return;
    }
    onChange([...items, { id: newId(), kind: 'url', url: u }]);
    setUrlDraft('');
  };

  const removeAt = (idx: number) => {
    const item = items[idx];
    if (item?.kind === 'file') revokePreview(item.id);
    onChange(items.filter((_, i) => i !== idx));
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-foreground">Product images</Label>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Upload up to {MAX_IMAGES} images (JPEG, PNG, WebP, max 5 MB each), or add direct HTTPS links. Order is
          preserved.
        </p>
      </div>

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!disabled) fileInputRef.current?.click();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragOver(false);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDrop={onDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors',
          dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 bg-muted/20',
          disabled && 'cursor-not-allowed opacity-60'
        )}
      >
        <input
          ref={fileInputRef}
          id={inputId}
          type="file"
          accept={ACCEPT}
          multiple
          className="sr-only"
          disabled={disabled}
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <Upload className="h-8 w-8 text-muted-foreground" aria-hidden />
        <div className="text-sm font-medium text-foreground">Drop images here or click to browse</div>
        <p className="text-xs text-muted-foreground">Multiple files allowed</p>
        <Button type="button" variant="secondary" size="sm" disabled={disabled} className="pointer-events-none">
          Choose files
        </Button>
      </div>

      <div className="flex gap-2 items-end">
        <div className="flex-1 space-y-1">
          <Label htmlFor="image-url-input" className="flex items-center gap-1 text-xs text-muted-foreground">
            <Link2 className="h-3 w-3" />
            Or paste image URL
          </Label>
          <Input
            id="image-url-input"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            placeholder="https://cdn.example.com/photo.jpg"
            disabled={disabled}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addUrl();
              }
            }}
          />
        </div>
        <Button type="button" variant="secondary" disabled={disabled || !urlDraft.trim()} onClick={addUrl}>
          Add URL
        </Button>
      </div>

      {items.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {items.map((item, idx) => (
            <li
              key={item.id}
              className="group relative aspect-square overflow-hidden rounded-lg border bg-muted/20"
            >
              <img src={getPreviewSrc(item)} alt="" className="h-full w-full object-cover" />
              {!disabled ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute right-1 top-1 h-8 w-8 opacity-90"
                  onClick={() => removeAt(idx)}
                  aria-label="Remove image"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
              {item.kind === 'file' ? (
                <span className="absolute bottom-0 left-0 right-0 truncate bg-background/80 px-1 py-0.5 text-[10px] text-muted-foreground">
                  {item.file.name}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <ImagePlus className="h-3.5 w-3.5" />
          No images yet — upload at least one.
        </p>
      )}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
