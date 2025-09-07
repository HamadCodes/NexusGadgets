import { CameraProduct, ConsoleProduct, HeadphoneProduct, LaptopProduct, PhoneProduct, Product, SmartwatchProduct } from '@/models/Product';

const getCategorySpecs = (product: Product) => {
  switch (product.category) {
    case 'phones':
      return [
        { name: 'Screen Size', value: (product as PhoneProduct).screenSize },
        { name: 'Processor', value: (product as PhoneProduct).processor },
        { name: 'RAM', value: (product as PhoneProduct).ram },
        { name: 'Storage Options', value: (product as PhoneProduct).storageOptions?.map((object)=>object.storage)},
        { name: 'Camera', value: (product as PhoneProduct).cameraSpecs },
        { name: 'Battery', value: (product as PhoneProduct).batteryCapacity },
        { name: 'OS', value: (product as PhoneProduct).operatingSystem },
      ];
    
    case 'laptops':
      return [
        { name: 'Screen Size', value: (product as LaptopProduct).screenSize },
        { name: 'Resolution', value: (product as LaptopProduct).resolution },
        { name: 'Processor', value: (product as LaptopProduct).processor },
        { name: 'RAM', value: (product as LaptopProduct).ram },
        { name: 'Storage', value: `${(product as LaptopProduct).storageType} ${(product as LaptopProduct).storageSize}` },
        { name: 'GPU', value: (product as LaptopProduct).gpu },
        { name: 'OS', value: (product as LaptopProduct).os },
        { name: 'Weight', value: (product as LaptopProduct).weight },
      ];
    
    case 'smartwatches':
      return [
        { name: 'Screen Size', value: (product as SmartwatchProduct).screenSize },
        { name: 'Resolution', value: (product as SmartwatchProduct).resolution },
        { name: 'Battery Life', value: (product as SmartwatchProduct).batteryLife },
        { name: 'Water Resistance', value: (product as SmartwatchProduct).waterResistance },
        { name: 'Compatible OS', value: (product as SmartwatchProduct).compatibleOs?.join(', ') },
        { name: 'Health Features', value: (product as SmartwatchProduct).healthFeatures?.join(', ') },
      ];
    
    case 'cameras':
      return [
        { name: 'Type', value: (product as CameraProduct).type },
        { name: 'Sensor Resolution', value: (product as CameraProduct).sensorResolution },
        { name: 'Lens Mount', value: (product as CameraProduct).lensMount },
        { name: 'ISO Range', value: (product as CameraProduct).isoRange },
        { name: 'Video Resolution', value: (product as CameraProduct).videoResolution },
        { name: 'Weight', value: (product as CameraProduct).weight },
      ];
    
    case 'headphones':
      return [
        { name: 'Type', value: (product as HeadphoneProduct).type },
        { name: 'Wireless', value: (product as HeadphoneProduct).wireless ? 'Yes' : 'No' },
        { name: 'Battery Life', value: (product as HeadphoneProduct).batteryLife },
        { name: 'Noise Cancellation', value: (product as HeadphoneProduct).noiseCancellation ? 'Yes' : 'No' },
        { name: 'Impedance', value: (product as HeadphoneProduct).impedance },
      ];
    
    case 'consoles':
      return [
        { name: 'Storage', value: (product as ConsoleProduct).storage },
        { name: 'Max Resolution', value: (product as ConsoleProduct).maxResolution },
        { name: 'Online Play', value: (product as ConsoleProduct).onlinePlay ? 'Yes' : 'No' },
        { name: 'Controller Type', value: (product as ConsoleProduct).controllerType },
        { name: 'CPU', value: (product as ConsoleProduct).cpu },
        { name: 'GPU', value: (product as ConsoleProduct).gpu },
      ];
    
    default:
      return [];
  }
};

export default function ProductSpecifications({ product }: { product: Product }) {
  const specs = getCategorySpecs(product);
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Specifications</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {specs.map((spec, index) => (
          spec.value && (
            <div key={index} className="border-b pb-2">
              <span className="font-medium">{spec.name}: </span>
              <span>{`${spec.value}`}</span>
            </div>
          )
        ))}
      </div>
      
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Description</h3>
        <p className="text-gray-700 wrap-anywhere">{product.description}</p>
      </div>
    </div>
  );
}