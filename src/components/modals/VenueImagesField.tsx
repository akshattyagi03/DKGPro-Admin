import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type VenueImagesFieldProps = {
  files: File[];
  onChange: (files: File[]) => void;
  id?: string;
  className?: string;
  maxFiles?: number;
  label?: ReactNode;
  description?: string;
  emptySubtext?: string;
};

function collectImageFiles(
  list: FileList | null,
  current: File[],
  max: number
): File[] {
  if (!list?.length) return current;
  const next = [...current];
  for (let i = 0; i < list.length && next.length < max; i++) {
    const f = list[i];
    if (f?.type.startsWith('image/')) next.push(f);
  }
  return next;
}

/** Multi-image drop zone — same visual language as `CategoryBannerSingleField` (blog featured image). */
export function VenueImagesField({
  files,
  onChange,
  id = 'venue-images',
  className,
  maxFiles = 10,
  label = (
    <>
      Venue images <span className="text-destructive">*</span>
    </>
  ),
  description = 'At least one image required. PNG, JPG, or WebP — drag & drop or browse. Up to 10 files.',
  emptySubtext = 'Wide hero-style images work well on the guest venue page (e.g. 1200×630).',
}: VenueImagesFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    const nextUrls = files.map((f) => URL.createObjectURL(f));
    setUrls(nextUrls);
    return () => nextUrls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const openPicker = useCallback(() => inputRef.current?.click(), []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const merged = collectImageFiles(e.target.files, files, maxFiles);
    onChange(merged);
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const merged = collectImageFiles(e.dataTransfer.files, files, maxFiles);
    onChange(merged);
  };

  const onDragOverZone = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOver(true);
  };

  const removeAt = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  const canAddMore = files.length < maxFiles;

  const dropZone = (compact: boolean) => (
    <button
      type="button"
      aria-label="Upload venue images"
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
      disabled={!canAddMore}
      className={cn(
        'group relative w-full rounded-xl border-2 border-dashed transition-all duration-200',
        'bg-muted/20 hover:bg-muted/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        !canAddMore && 'opacity-50 pointer-events-none',
        dragOver && canAddMore
          ? 'border-primary bg-primary/5 scale-[1.01] shadow-md'
          : 'border-muted-foreground/25 hover:border-primary/40 hover:shadow-sm'
      )}
    >
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-3 px-6',
          compact ? 'py-8 sm:py-9' : 'py-10 sm:py-12'
        )}
      >
        <div
          className={cn(
            'flex h-14 w-14 items-center justify-center rounded-2xl border bg-background shadow-sm',
            'transition-transform duration-200 group-hover:scale-105',
            dragOver ? 'border-primary text-primary' : 'border-border text-muted-foreground'
          )}
        >
          <ImagePlus className="h-7 w-7" strokeWidth={1.5} />
        </div>
        <div className="text-center space-y-1 max-w-md">
          <p className="text-sm font-medium text-foreground">
            {dragOver ? 'Drop images here' : compact ? 'Add more images' : 'Drop images or click to browse'}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">{emptySubtext}</p>
          {files.length > 0 && (
            <p className="text-xs font-medium text-muted-foreground">
              {files.length} of {maxFiles} selected
            </p>
          )}
        </div>
        <span
          className={cn(
            'inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium',
            'bg-secondary text-secondary-foreground border border-border/60'
          )}
        >
          Choose files
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
        multiple
        className="sr-only"
        tabIndex={-1}
        onChange={onInputChange}
      />

      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {files.map((file, idx) => (
            <div
              key={`${file.name}-${file.size}-${idx}`}
              className={cn(
                'relative overflow-hidden rounded-xl border bg-muted/30',
                'shadow-sm ring-1 ring-border/80 flex flex-col'
              )}
            >
              <div className="aspect-[16/10] w-full min-h-[88px] bg-muted">
                <img
                  src={urls[idx]}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <div
                className={cn(
                  'flex flex-wrap items-center justify-between gap-1.5',
                  'border-t bg-background/95 px-2 py-2 backdrop-blur-sm'
                )}
              >
                <p className="text-[11px] text-muted-foreground truncate flex-1 min-w-0" title={file.name}>
                  {file.name}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeAt(idx)}
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {files.length === 0 ? dropZone(false) : canAddMore ? dropZone(true) : null}

      {!canAddMore && files.length > 0 && (
        <p className="text-xs text-muted-foreground">Maximum {maxFiles} images (server limit).</p>
      )}
    </div>
  );
}
