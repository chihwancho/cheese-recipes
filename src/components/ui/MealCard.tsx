import { GripVertical, X } from 'lucide-react';
import type { Meal } from '../../types';

interface MealCardProps {
  meal: Meal;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onRemove?: () => void;
}

const chipStyles: Record<Meal['category'], string> = {
  breakfast: 'bg-amber-50 border-amber-200/60 text-amber-800',
  lunch: 'bg-emerald-50 border-emerald-200/60 text-emerald-800',
  dinner: 'bg-indigo-50 border-indigo-200/60 text-indigo-800',
  snack: 'bg-orange-50 border-orange-200/60 text-orange-800',
};

export default function MealCard({ meal, draggable, onDragStart, onRemove }: MealCardProps) {
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      className={`group flex items-center gap-1 rounded-md border px-1.5 py-1 hover:shadow-sm transition-all duration-150 ${chipStyles[meal.category]} ${
        draggable ? 'cursor-grab active:cursor-grabbing' : ''
      }`}
    >
      {draggable && (
        <GripVertical className="w-3 h-3 opacity-30 shrink-0 group-hover:opacity-60 transition-opacity" />
      )}
      <span className="flex-1 text-xs font-medium truncate leading-tight">
        {meal.name}
      </span>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-black/10 transition-all opacity-40 hover:opacity-70 cursor-pointer shrink-0"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
