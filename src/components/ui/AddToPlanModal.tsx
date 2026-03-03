import { useState, useEffect, useRef } from 'react';
import { CalendarPlus, Check, ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { Recipe, MealSlot } from '../../types';
import { useMealPlan } from '../../context/MealPlanContext';
import { getMonday, formatDate, formatDateShort } from '../../data/sampleData';

const mealSlots: { key: MealSlot; label: string; color: string }[] = [
  { key: 'breakfast', label: 'Breakfast', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { key: 'lunch', label: 'Lunch', color: 'bg-sky-100 text-sky-700 border-sky-200' },
  { key: 'dinner', label: 'Dinner', color: 'bg-violet-100 text-violet-700 border-violet-200' },
  { key: 'snack', label: 'Snack', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
];

interface AddToPlanModalProps {
  recipe: Recipe;
  onClose: () => void;
}

export default function AddToPlanModal({ recipe, onClose }: AddToPlanModalProps) {
  const { currentMonday, weekPlan, addMealToPlan, setCurrentMonday } = useMealPlan();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<MealSlot | null>(null);
  const [added, setAdded] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const goToPrevWeek = () => {
    const prev = new Date(currentMonday);
    prev.setDate(prev.getDate() - 7);
    setCurrentMonday(prev);
    setSelectedDay(null);
    setSelectedSlot(null);
  };

  const goToNextWeek = () => {
    const next = new Date(currentMonday);
    next.setDate(next.getDate() + 7);
    setCurrentMonday(next);
    setSelectedDay(null);
    setSelectedSlot(null);
  };

  const isCurrentWeek = () => {
    const today = getMonday(new Date());
    return formatDate(today) === formatDate(currentMonday);
  };

  const goToThisWeek = () => {
    setCurrentMonday(getMonday(new Date()));
    setSelectedDay(null);
    setSelectedSlot(null);
  };

  const handleAdd = () => {
    if (selectedDay === null || !selectedSlot) return;
    addMealToPlan(recipe, selectedDay, selectedSlot);
    setAdded(true);
    setTimeout(() => onClose(), 800);
  };

  const weekLabel = () => {
    const start = formatDateShort(currentMonday);
    const end = new Date(currentMonday);
    end.setDate(end.getDate() + 6);
    return `${start} – ${formatDateShort(end)}`;
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <CalendarPlus className="w-5 h-5 text-primary-500" />
              <h3 className="text-lg font-bold text-gray-900">Add to Meal Plan</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <p className="text-sm text-gray-500 truncate">{recipe.title}</p>
        </div>

        <div className="p-6 space-y-5">
          {/* Week navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={goToPrevWeek}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </button>
            <div className="text-center">
              <span className="text-sm font-medium text-gray-700">{weekLabel()}</span>
              {!isCurrentWeek() && (
                <button
                  onClick={goToThisWeek}
                  className="block mx-auto mt-0.5 text-xs text-primary-500 hover:text-primary-600 cursor-pointer"
                >
                  Back to this week
                </button>
              )}
            </div>
            <button
              onClick={goToNextWeek}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Day selection */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 block">
              Select Day
            </label>
            <div className="grid grid-cols-7 gap-1.5">
              {weekPlan.map((day, i) => {
                const date = new Date(day.date + 'T00:00:00');
                const dayAbbr = day.day.slice(0, 3);
                const dateNum = date.getDate();
                const isToday = day.date === formatDate(new Date());
                const isSelected = selectedDay === i;

                return (
                  <button
                    key={day.date}
                    onClick={() => {
                      setSelectedDay(i);
                      setAdded(false);
                    }}
                    className={`flex flex-col items-center py-2 px-1 rounded-lg text-center transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                        : isToday
                        ? 'bg-primary-50 border-primary-200 text-primary-700 hover:bg-primary-100'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <span className={`text-[10px] font-medium ${isSelected ? 'text-primary-100' : 'text-gray-400'}`}>
                      {dayAbbr}
                    </span>
                    <span className="text-sm font-semibold">{dateNum}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Meal slot selection */}
          {selectedDay !== null && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 block">
                Select Meal
              </label>
              <div className="grid grid-cols-2 gap-2">
                {mealSlots.map(({ key, label, color }) => {
                  const existingCount = weekPlan[selectedDay][key].length;
                  const isSelected = selectedSlot === key;

                  return (
                    <button
                      key={key}
                      onClick={() => {
                        setSelectedSlot(key);
                        setAdded(false);
                      }}
                      className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                          : `${color} border hover:opacity-80`
                      }`}
                    >
                      <span>{label}</span>
                      {existingCount > 0 && (
                        <span className={`ml-1.5 text-xs ${isSelected ? 'text-primary-100' : 'opacity-60'}`}>
                          ({existingCount})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add button */}
          <button
            onClick={handleAdd}
            disabled={selectedDay === null || !selectedSlot || added}
            className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer flex items-center justify-center gap-2 ${
              added
                ? 'bg-green-500 text-white'
                : selectedDay !== null && selectedSlot
                ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-sm'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {added ? (
              <>
                <Check className="w-4 h-4" />
                Added!
              </>
            ) : (
              <>
                <CalendarPlus className="w-4 h-4" />
                Add to Plan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
