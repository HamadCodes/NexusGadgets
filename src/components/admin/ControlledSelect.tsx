import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { ProductForm, Option } from '@/models/Product';

interface ControlledSelectProps<T extends FieldValues = ProductForm> {
  name: FieldPath<T>;
  control: Control<T>;
  options: Option[];
  placeholder?: string;
  defaultValue?: string;
}

export function ControlledSelect<T extends FieldValues = ProductForm>({
  name,
  control,
  options,
  placeholder,
  defaultValue = ''
}: ControlledSelectProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      defaultValue={defaultValue as never}
      render={({ field }) => (
        <Select 
          value={field.value ? String(field.value) : ''} 
          onValueChange={(val) => field.onChange(val)}
        >
          <SelectTrigger>
            <SelectValue placeholder={placeholder ?? 'Select...'} />
          </SelectTrigger>
          <SelectContent>
            {options.filter(opt => String(opt.value) !== '').map(opt => (
              <SelectItem key={String(opt.value)} value={String(opt.value)}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  );
}