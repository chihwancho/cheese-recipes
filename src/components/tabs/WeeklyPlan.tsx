import { useState, useRef, useCallback, useMemo } from 'react';
import { CalendarDays, Plus, Copy, ArrowRightLeft, ChevronLeft, ChevronRight, RotateCcw, ShoppingCart, Sparkles } from 'lucide-react';
import { getMonday, formatDate, formatDateShort } from '../../data/sampleData';
import { useMealPlan } from '../../context/MealPlanContext';
import { useRecipes } from '../../context/RecipeContext';
import { useShoppingList } from '../../context/ShoppingListContext';
import { mergeIngredients } from '../../utils/ingredientMerge';
import MealCard from '../ui/MealCard';
import AddMealPanel from '../ui/AddMealPanel';
import GenerateMealPlanModal from '../ui/GenerateMealPlanModal';
import type { DayPlan, Meal, MealSlot, Recipe } from '../../types';

interface DragData {
  dayIndex: number;
  slot: MealSlot;
  mealIndex: number;
  meal: Meal;
}

const mealSlots: { key: MealSlot; label: string }[] = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'snack', label: 'Snack' },
];

let nextId = 100;

export default function WeeklyPlan() {
  const { currentMonday, setCurrentMonday, weekPlan, setWeekPlan } = useMealPlan();
  const { recipes } = useRecipes();
  const { addItems, replaceItems } = useShoppingList();

  const [dropTarget, setDropTarget] = useState<{ dayIndex: number; slot: MealSlot } | null>(null);
  const [isCopy, setIsCopy] = useState(false);
  const dragDataRef = useRef<DragData | null>(null);
  const [addMealTarget, setAddMealTarget] = useState<{ dayIndex: number; slot: MealSlot } | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const isCurrentWeek = useMemo(() => {
    const today = getMonday(new Date());
    return formatDate(today) === formatDate(currentMonday);
  }, [currentMonday]);

  // Week navigation
  const goToPrevWeek = () => {
    const prev = new Date(currentMonday);
    prev.setDate(prev.getDate() - 7);
    setCurrentMonday(prev);
  };

  const goToNextWeek = () => {
    const next = new Date(currentMonday);
    next.setDate(next.getDate() + 7);
    setCurrentMonday(next);
  };

  const goToCurrentWeek = () => {
    setCurrentMonday(getMonday(new Date()));
  };

  // Date range label
  const weekLabel = useMemo(() => {
    const end = new Date(currentMonday);
    end.setDate(end.getDate() + 6);
    return `${formatDateShort(currentMonday)} – ${formatDateShort(end)}`;
  }, [currentMonday]);

  // Drag handlers (unchanged logic)
  const handleDragStart = useCallback(
    (e: React.DragEvent, dayIndex: number, slot: MealSlot, mealIndex: number, meal: Meal) => {
      dragDataRef.current = { dayIndex, slot, mealIndex, meal };
      e.dataTransfer.setData('text/plain', '');
      e.dataTransfer.effectAllowed = 'copyMove';
      setIsCopy(e.ctrlKey);
    },
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent, dayIndex: number, slot: MealSlot) => {
    e.preventDefault();
    const copy = e.ctrlKey;
    e.dataTransfer.dropEffect = copy ? 'copy' : 'move';
    setIsCopy(copy);
    setDropTarget((prev) =>
      prev?.dayIndex === dayIndex && prev?.slot === slot ? prev : { dayIndex, slot }
    );
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    const related = e.relatedTarget as HTMLElement | null;
    if (!related || !e.currentTarget.contains(related)) {
      setDropTarget(null);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetDayIndex: number, targetSlot: MealSlot) => {
      e.preventDefault();
      setDropTarget(null);

      const source = dragDataRef.current;
      if (!source) return;

      const copy = e.ctrlKey;
      const sameSlot = source.dayIndex === targetDayIndex && source.slot === targetSlot;
      if (sameSlot && !copy) return;

      setWeekPlan((prev) => {
        const next = prev.map((day) => ({
          ...day,
          breakfast: [...day.breakfast],
          lunch: [...day.lunch],
          dinner: [...day.dinner],
          snack: [...day.snack],
        }));

        if (!copy) {
          next[source.dayIndex][source.slot].splice(source.mealIndex, 1);
        }

        const newMeal = copy
          ? { ...source.meal, id: `${source.meal.id}-copy-${nextId++}` }
          : source.meal;
        next[targetDayIndex][targetSlot].push(newMeal);

        return next;
      });

      dragDataRef.current = null;
    },
    [setWeekPlan]
  );

  const handleDragEnd = useCallback(() => {
    setDropTarget(null);
    setIsCopy(false);
    dragDataRef.current = null;
  }, []);

  const removeMeal = useCallback((dayIndex: number, slot: MealSlot, mealIndex: number) => {
    setWeekPlan((prev) => {
      const next = prev.map((day) => ({
        ...day,
        breakfast: [...day.breakfast],
        lunch: [...day.lunch],
        dinner: [...day.dinner],
        snack: [...day.snack],
      }));
      next[dayIndex][slot].splice(mealIndex, 1);
      return next;
    });
  }, [setWeekPlan]);

  const addMealFromRecipe = useCallback((recipe: Recipe) => {
    if (!addMealTarget) return;
    const { dayIndex, slot } = addMealTarget;

    const meal: Meal = {
      id: `recipe-${recipe.id}-${nextId++}`,
      name: recipe.title,
      category: slot === 'snack' ? 'snack' : slot,
      prepTime: recipe.prepTime,
      calories: Math.round(
        recipe.tags.includes('Healthy') ? 350 :
        recipe.tags.includes('Sweet') ? 450 :
        500
      ),
    };

    setWeekPlan((prev) => {
      const next = prev.map((day) => ({
        ...day,
        breakfast: [...day.breakfast],
        lunch: [...day.lunch],
        dinner: [...day.dinner],
        snack: [...day.snack],
      }));
      next[dayIndex][slot].push(meal);
      return next;
    });

    setAddMealTarget(null);
  }, [addMealTarget, setWeekPlan]);

  const isDropTarget = (dayIndex: number, slot: MealSlot) =>
    dropTarget?.dayIndex === dayIndex && dropTarget?.slot === slot;

  // Build a day label with date
  const dayLabel = (day: DayPlan) => {
    const d = new Date(day.date + 'T00:00:00');
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const dayNum = d.getDate();
    return { name: day.day.slice(0, 3), date: `${month} ${dayNum}` };
  };

  // Count total meals in the week
  const totalMeals = useMemo(() => {
    const slots: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack'];
    return weekPlan.reduce((sum, day) =>
      sum + slots.reduce((s, slot) => s + day[slot].length, 0), 0);
  }, [weekPlan]);

  // Collect all ingredients from planned meals
  const collectIngredients = useCallback(() => {
    const slots: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack'];
    const ingredientLists: string[][] = [];

    for (const day of weekPlan) {
      for (const slot of slots) {
        for (const meal of day[slot]) {
          const recipe = recipes.find((r) => r.title === meal.name);
          if (recipe && recipe.ingredients.length > 0) {
            ingredientLists.push(recipe.ingredients);
          }
        }
      }
    }

    return mergeIngredients(ingredientLists);
  }, [weekPlan, recipes]);

  const handleExport = (mode: 'add' | 'replace') => {
    const items = collectIngredients();
    if (mode === 'replace') {
      replaceItems(items);
    } else {
      addItems(items);
    }
    setShowExportModal(false);
  };

  return (
    <div onDragEnd={handleDragEnd}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <CalendarDays className="w-7 h-7 text-primary-500 shrink-0" />
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Weekly Meal Plan</h2>
            <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Drag meals between slots to reorganize</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden lg:flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <ArrowRightLeft className="w-3.5 h-3.5" />
              Drag to move
            </span>
            <span className="flex items-center gap-1.5">
              <Copy className="w-3.5 h-3.5" />
              Ctrl + drag to copy
            </span>
          </div>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-2 px-3 sm:px-3.5 py-2 bg-primary-500 text-white text-xs font-medium rounded-lg hover:bg-primary-600 transition-colors cursor-pointer shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Generate Plan</span>
            <span className="sm:hidden">Generate</span>
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            disabled={totalMeals === 0}
            className="flex items-center gap-2 px-3 sm:px-3.5 py-2 bg-accent-500 text-white text-xs font-medium rounded-lg hover:bg-accent-600 transition-colors cursor-pointer shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Shopping List</span>
            <span className="sm:hidden">Shop</span>
          </button>
        </div>
      </div>

      {/* Week navigation */}
      <div className="flex items-center justify-between mb-4 bg-white rounded-lg shadow-sm border border-gray-100 px-4 py-2.5">
        <button
          onClick={goToPrevWeek}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-800">{weekLabel}</span>
          {!isCurrentWeek && (
            <button
              onClick={goToCurrentWeek}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary-600 bg-primary-50 rounded-full hover:bg-primary-100 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Today
            </button>
          )}
        </div>
        <button
          onClick={goToNextWeek}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3 lg:grid lg:grid-cols-7 lg:gap-4">
          {weekPlan.map((day, dayIndex) => {
            const { name, date } = dayLabel(day);
            const isToday = day.date === formatDate(new Date());

            return (
              <div key={day.date} className="min-w-[160px] sm:min-w-[180px] lg:min-w-0 shrink-0 lg:shrink flex flex-col gap-2">
                <div className={`text-center py-2 rounded-lg shadow-sm border ${
                  isToday
                    ? 'bg-primary-50 border-primary-200'
                    : 'bg-white border-gray-100'
                }`}>
                  <p className={`text-sm font-semibold ${isToday ? 'text-primary-700' : 'text-gray-700'}`}>
                    {name}
                  </p>
                  <p className={`text-[11px] ${isToday ? 'text-primary-500' : 'text-gray-400'}`}>
                    {date}
                  </p>
                </div>
                {mealSlots.map(({ key: slotKey, label }) => {
                  const meals = day[slotKey];
                  const isOver = isDropTarget(dayIndex, slotKey);

                  return (
                    <div key={slotKey}>
                      <div className="flex items-center justify-between mb-1 px-1">
                        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                          {label}
                        </p>
                        <button
                          onClick={() => setAddMealTarget({ dayIndex, slot: slotKey })}
                          className="w-4 h-4 flex items-center justify-center rounded hover:bg-primary-50 text-gray-300 hover:text-primary-500 transition-colors cursor-pointer"
                          title={`Add ${label.toLowerCase()}`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div
                        onDragOver={(e) => handleDragOver(e, dayIndex, slotKey)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, dayIndex, slotKey)}
                        className={`h-[72px] rounded-lg transition-all duration-200 flex flex-col gap-1 p-1 overflow-y-auto ${
                          isOver
                            ? isCopy
                              ? 'bg-blue-50 ring-2 ring-blue-300 ring-dashed'
                              : 'bg-primary-50 ring-2 ring-primary-300 ring-dashed'
                            : meals.length === 0
                            ? 'bg-gray-50/50 border border-dashed border-gray-200'
                            : 'bg-gray-50/30'
                        }`}
                      >
                        {meals.map((meal, mealIndex) => (
                          <MealCard
                            key={meal.id}
                            meal={meal}
                            draggable
                            onDragStart={(e) => handleDragStart(e, dayIndex, slotKey, mealIndex, meal)}
                            onRemove={() => removeMeal(dayIndex, slotKey, mealIndex)}
                          />
                        ))}
                        {isOver && (
                          <div
                            className={`border-2 border-dashed rounded-md p-1.5 flex items-center justify-center gap-1 text-[11px] font-medium ${
                              isCopy
                                ? 'border-blue-300 text-blue-500'
                                : 'border-primary-300 text-primary-500'
                            }`}
                          >
                            {isCopy ? (
                              <>
                                <Copy className="w-3 h-3" />
                                Copy here
                              </>
                            ) : (
                              <>
                                <Plus className="w-3 h-3" />
                                Move here
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add meal panel */}
      {addMealTarget && (
        <AddMealPanel
          dayLabel={`${weekPlan[addMealTarget.dayIndex].day}, ${dayLabel(weekPlan[addMealTarget.dayIndex]).date}`}
          slot={addMealTarget.slot}
          onAdd={addMealFromRecipe}
          onClose={() => setAddMealTarget(null)}
        />
      )}

      {/* Generate meal plan modal */}
      {showGenerateModal && (
        <GenerateMealPlanModal onClose={() => setShowGenerateModal(false)} />
      )}

      {/* Export to shopping list modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-accent-50 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-accent-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Export to Shopping List</h3>
                <p className="text-xs text-gray-500">
                  {totalMeals} meal{totalMeals !== 1 ? 's' : ''} this week
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              Ingredients from all planned meals will be combined and added to your shopping list.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => handleExport('add')}
                className="w-full px-4 py-2.5 text-sm font-medium bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors cursor-pointer"
              >
                Add to existing list
              </button>
              <button
                onClick={() => handleExport('replace')}
                className="w-full px-4 py-2.5 text-sm font-medium bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Replace entire list
              </button>
              <button
                onClick={() => setShowExportModal(false)}
                className="w-full px-4 py-2.5 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
