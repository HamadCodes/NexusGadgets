import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UseFormRegister } from 'react-hook-form';
import { ProductForm } from '@/models/Product';

interface ColorRowProps {
  idx: number;
  register: UseFormRegister<ProductForm>;
  remove: (i: number) => void;
}

export function ColorRow({ idx, register, remove }: ColorRowProps) {
  return (
    <div className="flex gap-3 items-center">
      <Input {...register(`colors.${idx}.name`)} placeholder="Name (e.g. Midnight)" />
      <input {...register(`colors.${idx}.hexCode`)} type="color" className="w-10 h-10 p-0 border rounded" />
      <Button type="button" variant="destructive" size="sm" onClick={() => remove(idx)}>Remove</Button>
    </div>
  );
}