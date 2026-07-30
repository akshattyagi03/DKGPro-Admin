import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ImagePlus, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type CategoryBannerSingleFieldProps = {
  file: File | null;
  onChange: (file: File | null) => void;
  id?: string;
  className?: string;
  /** Override default "Banner image" label */
  label?: ReactNode;
  /** Helper line under the label */
  description?: string;
  /** Hint under the drop zone title */
  emptySubtext?: string;
  /** When set and `file` is null, show this image with Replace (edit mode). */
  remotePreviewUrl?: string | null;
  /** Caption in the footer when showing `remotePreviewUrl` */
  remotePreviewCaption?: string;
};

function pickImageFile(list: FileList | null): File | null {
  const f = list?.[0];
  if (!f || !f.type.startsWith('image/')) return null;
  return f;
}

/** Optional banner image for sub / third / additional categories (multipart `bannerImage`). */
export function CategoryBannerSingleField({
  file,
  onChange,
  id = 'category-banner-image',
  className,
  label = 'Banner image',
  description = 'Optional — shown on listings when set. PNG, JPG, or WebP.',
  emptySubtext = 'Recommended wide banner ratio (e.g. 1200×400). Max size depends on server limits.',
  remotePreviewUrl = null,
  remotePreviewCaption = 'Current image',
}: CategoryBannerSingleFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const openPicker = useCallback(() => inputRef.current?.click(), []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = pickImageFile(e.target.files);
    onChange(next);
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const next = pickImageFile(e.dataTransfer.files);
    if (next) onChange(next);
  };

  const onDragOverZone = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOver(true);
  };

  const dropZone = (
    <button
      type="button"
      aria-label="Upload banner image"
      onClick={openPicker}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openPicker();
        }
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false);
      }}
      onDragOver={onDragOverZone}
      onDrop={onDrop}
      className={cn(
        'group relative w-full rounded-xl border-2 border-dashed transition-all duration-200',
        'bg-muted/20 hover:bg-muted/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        dragOver
          ? 'border-primary bg-primary/5 scale-[1.01] shadow-md'
          : 'border-muted-foreground/25 hover:border-primary/40 hover:shadow-sm'
      )}
    >
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 sm:py-12">
        <div
          className={cn(
            'flex h-14 w-14 items-center justify-center rounded-2xl border bg-background shadow-sm',
            'transition-transform duration-200 group-hover:scale-105',
            dragOver ? 'border-primary text-primary' : 'border-border text-muted-foreground'
          )}
        >
          <ImagePlus className="h-7 w-7" strokeWidth={1.5} />
        </div>
        <div className="text-center space-y-1 max-w-sm">
          <p className="text-sm font-medium text-foreground">
            {dragOver ? 'Drop image here' : 'Drop an image or click to browse'}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">{emptySubtext}</p>
        </div>
        <span
          className={cn(
            'inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium',
            'bg-secondary text-secondary-foreground border border-border/60'
          )}
        >
          Choose file
        </span>
      </div>
    </button>
  );

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <Label htmlFor={id} className="text-foreground cursor-pointer">
            {label}
          </Label>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        onChange={onInputChange}
      />

      {file && preview ? (
        <div
          className={cn(
            'relative overflow-hidden rounded-xl border bg-muted/30',
            'shadow-sm ring-1 ring-border/80'
          )}
        >
          <div className="aspect-[21/9] w-full min-h-[120px] max-h-[200px] bg-muted">
            <img src={preview} alt="" className="h-full w-full object-cover" />
          </div>
          <div
            className={cn(
              'flex flex-wrap items-center justify-between gap-2',
              'border-t bg-background/95 px-3 py-2.5 backdrop-blur-sm'
            )}
          >
            <p className="text-xs text-muted-foreground truncate max-w-[60%]" title={file.name}>
              {file.name}
            </p>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button type="button" variant="secondary" size="sm" className="h-8" onClick={openPicker}>
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                Replace
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => onChange(null)}
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : remotePreviewUrl ? (
        <div
          className={cn(
            'relative overflow-hidden rounded-xl border bg-muted/30',
            'shadow-sm ring-1 ring-border/80'
          )}
        >
          <div className="aspect-[21/9] w-full min-h-[120px] max-h-[200px] bg-muted">
            <img src={remotePreviewUrl} alt="" className="h-full w-full object-cover" />
          </div>
          <div
            className={cn(
              'flex flex-wrap items-center justify-between gap-2',
              'border-t bg-background/95 px-3 py-2.5 backdrop-blur-sm'
            )}
          >
            <p className="text-xs text-muted-foreground truncate max-w-[55%]">{remotePreviewCaption}</p>
            <Button type="button" variant="secondary" size="sm" className="h-8 shrink-0" onClick={openPicker}>
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Replace
            </Button>
          </div>
        </div>
      ) : (
        dropZone
      )}
    </div>
  );
}
