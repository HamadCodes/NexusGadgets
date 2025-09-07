'use client';

import { useState, useEffect } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { ValidCategory } from '@/models/Product';
import { Sliders, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import FiltersSkeleton from './FiltersSkeleton';

interface FilterConfig {
  key: string;
  title: string;
  type: 'multi' | 'single' | 'range' | 'boolean';
  options: string[];
}

const getTitle = (key: string) => {
  const titles: Record<string, string> = {
    brand: 'Brand',
    storage: 'Storage',
    operatingSystem: 'OS',
    screenSize: 'Screen Size',
    color: 'Color',
    price: 'Price Range',
    ram: 'RAM',
    storageSize: 'Storage',
    processor: 'Processor',
    batteryLife: 'Battery Life',
    waterResistance: 'Water Resistance',
    type: 'Type',
    sensorResolution: 'Resolution',
    videoResolution: 'Video',
    lensMount: 'Lens Mount',
    noiseCancellation: 'Noise Cancellation',
    wireless: 'Wireless',
    maxResolution: 'Resolution',
    onlinePlay: 'Online Play'
  };
  return titles[key] || key.replace(/([A-Z])/g, ' $1');
};



export default function CategoryFilters({ 
  category,
  filterOptions
}: { 
  category: ValidCategory;
  filterOptions: Record<string, string[]>;
}) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [filterConfigs, setFilterConfigs] = useState<FilterConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    setIsLoading(true);
    
    // Build filter config from dynamic options
    const configs: FilterConfig[] = [];
    
    // Add category-specific filters
    const categoryFilters: Record<ValidCategory, string[]> = {
      phones: ['brand', 'storage', 'operatingSystem', 'screenSize', 'color', 'price'],
      laptops: ['brand', 'ram', 'storageSize', 'processor', 'screenSize', 'price'],
      smartwatches: ['brand', 'screenSize', 'batteryLife', 'waterResistance', 'color', 'price'],
      cameras: ['brand', 'type', 'sensorResolution', 'videoResolution', 'lensMount', 'price'],
      headphones: ['brand', 'type', 'noiseCancellation', 'wireless', 'color', 'price'],
      consoles: ['brand', 'storage', 'maxResolution', 'onlinePlay', 'color', 'price']
    };
    
    for (const key of categoryFilters[category]) {
      if (filterOptions[key]?.length > 0) {
        configs.push({
          key,
          title: getTitle(key),
          type: key === 'price' ? 'range' : 
                ['noiseCancellation', 'wireless', 'onlinePlay'].includes(key) ? 'boolean' : 
                key === 'operatingSystem' || key === 'type' ? 'single' : 'multi',
          options: filterOptions[key]
        });
      }
    }
    
    setFilterConfigs(configs);
    setIsLoading(false);
  }, [category, filterOptions]);

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (params.getAll(key).includes(value)) {
      // Remove the filter if already applied
      const values = params.getAll(key).filter(v => v !== value);
      params.delete(key);
      values.forEach(v => params.append(key, v));
    } else {
      // Add the filter
      params.append(key, value);
    }
    
    // Reset to first page when filters change
    params.delete('page');
    
    router.replace(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    router.replace(pathname);
  };

  const activeFilters = filterConfigs.flatMap(config => {
    const values = searchParams.getAll(config.key);
    return values.map(value => ({
      key: config.key,
      value,
      title: `${config.title}: ${value}`
    }));
  });

  if (isLoading) {
    return <FiltersSkeleton />;
  }

  if (filterConfigs.length === 0) return null;

  return (
    <div className="bg-white">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 hidden lg:block">Filters</h2>
        
        <div className="flex items-center">
          {activeFilters.length > 0 && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800 hidden lg:block"
            >
              Clear all
            </button>
          )}
          
          {/* Mobile filter trigger using Sheet */}
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="ml-4 lg:hidden flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                <Sliders className="mr-2 h-5 w-5" aria-hidden="true" />
                Filters
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-xs overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>
                  Filter products to find exactly what you are looking for.
                </SheetDescription>
              </SheetHeader>
              
              <div className="mt-6 mx-6">
                <FilterSection 
                  configs={filterConfigs} 
                  searchParams={searchParams} 
                  onChange={handleFilterChange}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Active filters */}
      {activeFilters.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Applied filters</h3>
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((filter, index) => (
              <span
                key={index}
                className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700"
              >
                {filter.title}
                <button
                  type="button"
                  className="ml-1.5 flex-shrink-0 text-blue-500 hover:text-blue-700"
                  onClick={() => handleFilterChange(filter.key, filter.value)}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </span>
            ))}
            <button
              onClick={clearFilters}
              className="text-xs text-blue-600 hover:text-blue-800 self-center"
            >
              Clear all
            </button>
          </div>
        </div>
      )}

      {/* Desktop filters */}
      <div className="hidden lg:block">
        <FilterSection 
          configs={filterConfigs} 
          searchParams={searchParams} 
          onChange={handleFilterChange}
        />
      </div>
    </div>
  );
}

function FilterSection({ configs, searchParams, onChange }: { 
  configs: FilterConfig[]; 
  searchParams: URLSearchParams;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="space-y-6">
      {configs.map((config, sectionIdx) => (
        <div key={sectionIdx} className="border-b border-gray-200 pb-6">
          <h3 className="font-medium text-gray-900 mb-3">{config.title}</h3>
          
          <div className="space-y-3">
            {config.type === 'range' && (
              <div className="grid grid-cols-2 gap-3">
                {config.options.map((option, optionIdx) => {
                  const isActive = searchParams.getAll(config.key).includes(option);
                  
                  return (
                    <button
                      key={optionIdx}
                      onClick={() => onChange(config.key, option)}
                      className={`rounded-md px-3 py-2 text-sm font-medium ${
                        isActive 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {option.includes('+') 
                        ? `$${option.replace('+', '')}+` 
                        : `$${option.replace('-', '-$')}`
                      }
                    </button>
                  );
                })}
              </div>
            )}
            
            {config.type === 'boolean' && (
              <div className="flex flex-col gap-3">
                {config.options.map((option, optionIdx) => {
                  const isActive = searchParams.getAll(config.key).includes(option);
                  
                  return (
                    <div key={optionIdx} className="flex items-center gap-3">
                      <Checkbox
                        id={`${config.key}-${optionIdx}`}
                        checked={isActive}
                        onCheckedChange={() => onChange(config.key, option)}
                      />
                      <Label
                        htmlFor={`${config.key}-${optionIdx}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {option}
                      </Label>
                    </div>
                  );
                })}
              </div>
            )}
            
            {config.type === 'multi' && (
              <div className="flex flex-col gap-3">
                {config.options.map((option, optionIdx) => {
                  const isActive = searchParams.getAll(config.key).includes(option);
                  
                  return (
                    <div key={optionIdx} className="flex items-center gap-3">
                      <Checkbox
                        id={`${config.key}-${optionIdx}`}
                        checked={isActive}
                        onCheckedChange={() => onChange(config.key, option)}
                      />
                      <Label
                        htmlFor={`${config.key}-${optionIdx}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {option}
                      </Label>
                    </div>
                  );
                })}
              </div>
            )}
            
            {config.type === 'single' && (
              <RadioGroup 
                value={searchParams.get(config.key) || ''}
                onValueChange={(value) => onChange(config.key, value)}
              >
                <div className="flex flex-col gap-3">
                  {config.options.map((option, optionIdx) => (
                    <div key={optionIdx} className="flex items-center gap-3">
                      <RadioGroupItem 
                        value={option} 
                        id={`${config.key}-${optionIdx}`}
                      />
                      <Label
                        htmlFor={`${config.key}-${optionIdx}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}