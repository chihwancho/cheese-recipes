import { useState, useMemo } from 'react';
import { X, Search, Star, Heart, TrendingUp, Clock, Users, Plus } from 'lucide-react';
import type { Recipe, MealSlot } from '../../types';
import { useMealPlan } from '../../context/MealPlanContext';
import { useRecipes } from '../../context/RecipeContext';
import StarRating from './StarRating';

interface AddMealPanelProps {
  dayLabel: string;
  slot: MealSlot;
  onAdd: (recipe: Recipe) => void;
  onClose: () => void;
}

type SortBy = 'name' | 'rating' | 'frequency';

export default function AddMealPanel({ dayLabel, slot, onAdd, onClose }: AddMealPanelProps) {
  const { getRecipeUsageCount } = useMealPlan();
  const { recipes: allRecipes } = useRecipes();
  const [search, setSearch] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('name');

  const filtered = useMemo(() => {
    let results = allRecipes.filter((r) => {
      if (search) {
        const q = search.toLowerCase();
        const matchesKeyword =
          r.title.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q)) ||
          r.ingredients.some((ing) => ing.toLowerCase().includes(q));
        if (!matchesKeyword) return false;
      }
      if (minRating > 0 && r.rating < minRating) return false;
      if (favoritesOnly && !r.isFavorite) return false;
      return true;
    });

    results = [...results].sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'frequency') return getRecipeUsageCount(b.title) - getRecipeUsageCount(a.title);
      return a.title.localeCompare(b.title);
    });

    return results;
  }, [allRecipes, search, minRating, favoritesOnly, sortBy, getRecipeUsageCount]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full animate-slide-in-right">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Add Recipe</h3>
            <p className="text-xs text-gray-500">
              {dayLabel} &middot; <span className="capitalize">{slot}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pt-4 pb-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, tag, or ingredient..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300"
              autoFocus
            />
          </div>
        </div>

        {/* Filters */}
        <div className="px-5 py-3 flex flex-wrap items-center gap-2 border-b border-gray-100 shrink-0">
          {/* Favorites toggle */}
          <button
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              favoritesOnly
                ? 'bg-red-50 text-red-600 ring-1 ring-red-200'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${favoritesOnly ? 'fill-red-500' : ''}`} />
            Favorites
          </button>

          {/* Min rating filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-xs text-gray-500">
            <Star className="w-3.5 h-3.5" />
            <select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value={0}>Any rating</option>
              <option value={3}>3+ stars</option>
              <option value={4}>4+ stars</option>
              <option value={5}>5 stars</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-xs text-gray-500">
            <TrendingUp className="w-3.5 h-3.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="name">Sort: A-Z</option>
              <option value="rating">Sort: Rating</option>
              <option value="frequency">Sort: Most used</option>
            </select>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No recipes match your filters.</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((recipe) => (
                <button
                  key={recipe.id}
                  onClick={() => onAdd(recipe)}
                  className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left cursor-pointer group"
                >
                  {/* Thumbnail */}
                  {recipe.images.length > 0 ? (
                    <img
                      src={recipe.images[0]}
                      alt={recipe.title}
                      className="w-14 h-14 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-gray-100 shrink-0" />
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">{recipe.title}</p>
                      <div className="shrink-0 w-6 h-6 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StarRating rating={recipe.rating} size="sm" />
                      {recipe.isFavorite && (
                        <Heart className="w-3 h-3 fill-red-500 text-red-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {recipe.prepTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {recipe.servings}
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {getRecipeUsageCount(recipe.title)}x
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
