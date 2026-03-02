import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  onChange?: (rating: number) => void;
  size?: 'sm' | 'md';
}

export default function StarRating({ rating, onChange, size = 'sm' }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const interactive = !!onChange;
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <div className="flex items-center gap-0.5" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = hovered ? star <= hovered : star <= rating;
        const icon = (
          <Star
            className={`${iconSize} transition-colors duration-150 ${
              filled
                ? 'fill-amber-400 text-amber-400'
                : 'fill-transparent text-gray-300'
            }`}
          />
        );
        return interactive ? (
          <button
            key={star}
            type="button"
            onClick={() => onChange?.(star === rating ? 0 : star)}
            onMouseEnter={() => setHovered(star)}
            className="cursor-pointer transition-colors duration-150"
          >
            {icon}
          </button>
        ) : (
          <span key={star} className="cursor-default">
            {icon}
          </span>
        );
      })}
    </div>
  );
}
