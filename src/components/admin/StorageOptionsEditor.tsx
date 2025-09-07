import { useFieldArray, Control, UseFormRegister,} from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ProductForm } from '@/models/Product';

interface StorageOptionsEditorProps {
  control: Control<ProductForm>;
  register: UseFormRegister<ProductForm>;
}

export function StorageOptionsEditor({ control, register }: StorageOptionsEditorProps) {
  const { fields, append, remove } = useFieldArray({ 
    control, 
    name: 'storageOptions'
  });
  
  return (
    <div className="space-y-3">
      {fields.map((f, idx) => (
        <div key={f.id} className="flex gap-2 items-end">
          <Input 
            {...register(`storageOptions.${idx}.storage` as const)} 
            placeholder="128GB" 
          />
          <Input 
            type="number" 
            step="0.01" 
            {...register(`storageOptions.${idx}.price` as const, { valueAsNumber: true })} 
            placeholder="Extra price" 
          />
          <Button 
            type="button" 
            variant="destructive" 
            size="sm" 
            onClick={() => remove(idx)}
          >
            Remove
          </Button>
        </div>
      ))}
      <Button 
        type="button" 
        onClick={() => append({ storage: '', price: 0 })}
      >
        Add Storage Option
      </Button>
    </div>
  );
}