'use client';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: number;
  className?: string;
}

export default function StarRating({
  value,
  onChange,
  readOnly = false,
  size = 24,
  className = ''
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0);
  
  const handleClick = (newValue: number) => {
    if (!readOnly && onChange) {
      onChange(newValue);
    }
  };

  const handleMouseOver = (newValue: number) => {
    if (!readOnly) {
      setHoverValue(newValue);
    }
  };

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoverValue(0);
    }
  };

  const displayValue = hoverValue || value;

  return (
    <div 
      className={cn("flex", className)}
      onMouseLeave={handleMouseLeave}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const starElement = (
          <Star
            key={star}
            size={size}
            className={cn(
              star <= displayValue ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300',
              'transition-colors duration-150'
            )}
          />
        );
        
        return readOnly ? (
          <div key={star} className="pr-[2px]">
            {starElement}
          </div>
        ) : (
          <button
            key={star}
            type="button"
            className="pr-[2px] transition-colors cursor-pointer"
            onClick={() => handleClick(star)}
            onMouseOver={() => handleMouseOver(star)}
            aria-label={`Rate ${star} stars`}
          >
            {starElement}
          </button>
        );
      })}
    </div>
  );
}