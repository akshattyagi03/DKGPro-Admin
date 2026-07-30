import { useState, KeyboardEvent } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type ChipListFieldProps = {
  label: string;
  description?: string;
  placeholder?: string;
  values: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  /** Return sanitized value or null to reject (show error via onReject). */
  sanitize?: (raw: string) => string | null;
  onReject?: (message: string) => void;
  error?: string;
  className?: string;
};

const defaultSanitize = (raw: string): string | null => {
  const s = raw.trim();
  return s === '' ? null : s;
};

export function ChipListField({
  label,
  description,
  placeholder = 'Type and press Add or Enter',
  values,
  onChange,
  disabled,
  sanitize = defaultSanitize,
  onReject,
  error,
  className,
}: ChipListFieldProps) {
  const [draft, setDraft] = useState('');

  const addItem = () => {
    const raw = draft.trim();
    if (!raw) return;
    const next = sanitize(raw);
    if (!next) {
      onReject?.('Invalid value — check spelling or reserved words.');
      return;
    }
    if (values.includes(next)) {
      setDraft('');
      return;
    }
    onChange([...values, next]);
    setDraft('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addItem();
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div>
        <Label className="text-foreground">{label}</Label>
        {description ? <p className="text-xs text-muted-foreground mt-0.5">{description}</p> : null}
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1"
        />
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="shrink-0"
          disabled={disabled || !draft.trim()}
          onClick={addItem}
          aria-label="Add item"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {values.length > 0 ? (
        <div className="flex flex-wrap gap-2 rounded-md border bg-muted/30 p-2 min-h-[2.5rem]">
          {values.map((v) => (
            <Badge key={v} variant="secondary" className="gap-1 pr-1 font-normal max-w-full">
              <span className="truncate">{v}</span>
              {!disabled ? (
                <button
                  type="button"
                  className="rounded-sm p-0.5 hover:bg-background/80"
                  onClick={() => onChange(values.filter((x) => x !== v))}
                  aria-label={`Remove ${v}`}
                >
                  <X className="h-3 w-3" />
                </button>
              ) : null}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No items yet.</p>
      )}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
