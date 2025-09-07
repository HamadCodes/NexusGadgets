import { UseFormRegister, Control } from 'react-hook-form';
import { FormField } from './FormField';
import { Input } from '@/components/ui/input';
import { ControlledSelect } from './ControlledSelect';
import { StorageOptionsEditor } from './StorageOptionsEditor';
import { ProductForm, ProductCategory } from '@/models/Product';
import { Label } from '@/components/ui/label';

interface CategorySpecsProps {
  category: ProductCategory;
  register: UseFormRegister<ProductForm>;
  control: Control<ProductForm>;
}

export function CategorySpecs({ category, register, control }: CategorySpecsProps) {
  switch (category) {
    case 'phones':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label className='mb-3'>Storage Options</Label>
            <StorageOptionsEditor control={control} register={register} />
          </div>
          <FormField label="Screen Size"><Input {...register('screenSize')} /></FormField>
          <FormField label="Processor"><Input {...register('processor')} /></FormField>
          <FormField label="RAM"><Input {...register('ram')} /></FormField>
          <FormField label="Camera"><Input {...register('cameraSpecs')} /></FormField>
          <FormField label="Battery"><Input {...register('batteryCapacity')} /></FormField>
          <FormField label="OS"><Input {...register('operatingSystem')} /></FormField>
          <FormField label="Connectivity" note="Comma-separated values allowed"><Input {...register('connectivity')} placeholder="5G, Wi-Fi 6" /></FormField>
        </div>
      );
    case 'laptops':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField label="Screen Size"><Input {...register('screenSize')} /></FormField>
          <FormField label="Resolution"><Input {...register('resolution')} /></FormField>
          <FormField label="Processor"><Input {...register('processor')} /></FormField>
          <FormField label="RAM"><Input {...register('ram')} /></FormField>
          <FormField label="Storage Type">
            <ControlledSelect
              name="storageType"
              control={control}
              placeholder="Select storage type"
              options={[
                { value: 'SSD', label: 'SSD' },
                { value: 'HDD', label: 'HDD' },
                { value: 'Hybrid', label: 'Hybrid' },
              ]}
              defaultValue=""
            />
          </FormField>
          <FormField label="Storage Size"><Input {...register('storageSize')} /></FormField>
          <FormField label="GPU"><Input {...register('gpu')} /></FormField>
          <FormField label="OS"><Input {...register('os')} /></FormField>
          <FormField label="Weight"><Input {...register('weight')} /></FormField>
          <FormField label="Ports" note="Comma-separated values allowed"><Input {...register('ports')} placeholder="USB-C, HDMI" /></FormField>
        </div>
      );
    case 'smartwatches':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField label="Screen Size"><Input {...register('screenSize')} /></FormField>
          <FormField label="Resolution"><Input {...register('resolution')} /></FormField>
          <FormField label="Battery Life"><Input {...register('batteryLife')} /></FormField>
          <FormField label="Water Resistance"><Input {...register('waterResistance')} /></FormField>
          <FormField label="Compatible OS" note="Comma-separated values allowed"><Input {...register('compatibleOs')} placeholder="iOS, Android" /></FormField>
          <FormField label="Health Features" note="Comma-separated values allowed"><Input {...register('healthFeatures')} placeholder="Heart rate, Sleep" /></FormField>
          <FormField label="Connectivity" note="Comma-separated values allowed"><Input {...register('connectivity')} placeholder="Bluetooth, Wi-Fi" /></FormField>
        </div>
      );
    case 'cameras':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField label="Type">
            <ControlledSelect
              name="type"
              control={control}
              placeholder="Select camera type"
              options={[
                { value: 'DSLR', label: 'DSLR' },
                { value: 'Mirrorless', label: 'Mirrorless' },
                { value: 'PointAndShoot', label: 'Point & Shoot' },
              ]}
              defaultValue=""
            />
          </FormField>
          <FormField label="Sensor Resolution"><Input {...register('sensorResolution')} /></FormField>
          <FormField label="Lens Mount"><Input {...register('lensMount')} /></FormField>
          <FormField label="ISO Range"><Input {...register('isoRange')} /></FormField>
          <FormField label="Video Resolution"><Input {...register('videoResolution')} /></FormField>
          <FormField label="Screen Size"><Input {...register('screenSize')} /></FormField>
          <FormField label="Weight"><Input {...register('weight')} /></FormField>
        </div>
      );
    case 'headphones':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField label="Type">
            <ControlledSelect
              name="type"
              control={control}
              placeholder="Select headphone type"
              options={[
                { value: 'Over-ear', label: 'Over-ear' },
                { value: 'On-ear', label: 'On-ear' },
                { value: 'In-ear', label: 'In-ear' },
              ]}
              defaultValue=""
            />
          </FormField>
          <div className="flex items-center gap-2">
            <input type="checkbox" {...register('wireless')} />
            <Label>Wireless</Label>
          </div>
          <FormField label="Battery Life"><Input {...register('batteryLife')} /></FormField>
          <div className="flex items-center gap-2">
            <input type="checkbox" {...register('noiseCancellation')} />
            <Label>Noise Cancellation</Label>
          </div>
          <FormField label="Connectivity" note="Comma-separated values allowed"><Input {...register('connectivity')} placeholder="Bluetooth, 3.5mm" /></FormField>
          <FormField label="Impedance"><Input {...register('impedance')} /></FormField>
        </div>
      );
    case 'consoles':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField label="Storage"><Input {...register('storage')} /></FormField>
          <FormField label="Max Resolution"><Input {...register('maxResolution')} /></FormField>
          <div className="flex items-center gap-2">
            <input type="checkbox" {...register('onlinePlay')} />
            <Label>Online Play</Label>
          </div>
          <FormField label="Included Accessories" note="Comma-separated values allowed"><Input {...register('includedAccessories')} placeholder="Controller, Cables" /></FormField>
          <FormField label="Controller Type"><Input {...register('controllerType')} /></FormField>
          <FormField label="CPU"><Input {...register('cpu')} /></FormField>
          <FormField label="GPU"><Input {...register('gpu')} /></FormField>
        </div>
      );
    default:
      return null;
  }
}