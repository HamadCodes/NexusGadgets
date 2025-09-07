import { Label } from '@/components/ui/label';

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  error?: string;
  note?: string;
}

export function FormField({ label, children, error, note }: FormFieldProps) {
  return (
    <div className="space-y-1">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}