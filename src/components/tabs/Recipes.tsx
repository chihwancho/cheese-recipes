import { useState } from 'react';
import { BookOpen, Search, Clock, Users, Heart, Plus, CalendarPlus, ArrowUpDown, LayoutGrid, List } from 'lucide-react';
import type { Recipe } from '../../types';
import { useRecipes } from '../../context/RecipeContext';
import StarRating from '../ui/StarRating';
import ImageCarousel from '../ui/ImageCarousel';
import RecipeModal from '../ui/RecipeModal';
import RecipeFormModal from '../ui/RecipeFormModal';
import AddToPlanModal from '../ui/AddToPlanModal';

export default function Recipes() {
  const { recipes, toggleFavorite, updateRating, updateNotes, deleteRecipe } = useRecipes();
  const [search, setSearch] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [showNewRecipe, setShowNewRecipe] = useState(false);
  const [addToPlanRecipe, setAddToPlanRecipe] = useState<Recipe | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');

  const filtered = recipes
    .map((r, i) => ({ recipe: r, index: i }))
    .filter(
      ({ recipe: r }) =>
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === 'name') return a.recipe.title.localeCompare(b.recipe.title);
      if (sortBy === 'oldest') return a.index - b.index;
      return b.index - a.index; // newest first (default)
    })
    .map(({ recipe }) => recipe);

  // Keep modal recipe in sync with state
  const activeRecipe = selectedRecipe
    ? recipes.find((r) => r.id === selectedRecipe.id) ?? null
    : null;

  const handleEdit = (recipe: Recipe) => {
    setSelectedRecipe(null);
    setEditingRecipe(recipe);
  };

  const handleDelete = (id: string) => {
    deleteRecipe(id);
    setSelectedRecipe(null);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <BookOpen className="w-7 h-7 text-primary-500 shrink-0" />
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Recipes</h2>
            <p className="text-xs sm:text-sm text-gray-500">Browse and discover meal ideas</p>
          </div>
        </div>
        <button
          onClick={() => setShowNewRecipe(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Recipe
        </button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search recipes or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300 transition-shadow"
          />
        </div>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'name')}
            className="appearance-none pl-8 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name">Name</option>
          </select>
          <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => setViewMode('cards')}
            className={`p-2.5 transition-colors cursor-pointer ${
              viewMode === 'cards' ? 'bg-primary-50 text-primary-600' : 'bg-white text-gray-400 hover:text-gray-600'
            }`}
            title="Card view"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2.5 border-l border-gray-200 transition-colors cursor-pointer ${
              viewMode === 'list' ? 'bg-primary-50 text-primary-600' : 'bg-white text-gray-400 hover:text-gray-600'
            }`}
            title="List view"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-400 text-sm">No recipes match your search.</p>
      ) : (
        viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((recipe) => (
            <div
              key={recipe.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col cursor-pointer"
              onClick={() => setSelectedRecipe(recipe)}
            >
              <ImageCarousel
                images={recipe.images}
                alt={recipe.title}
                className="h-44"
              />
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-lg font-semibold text-gray-900">{recipe.title}</h3>
                  <div className="flex items-center gap-0.5 shrink-0 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAddToPlanRecipe(recipe);
                      }}
                      className="p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                      title="Add to meal plan"
                    >
                      <CalendarPlus className="w-5 h-5 text-gray-300 hover:text-primary-500 transition-colors" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(recipe.id);
                      }}
                      className="p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <Heart
                        className={`w-5 h-5 transition-colors ${
                          recipe.isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="mb-2">
                  <StarRating rating={recipe.rating} />
                </div>

                <p className="text-sm text-gray-500 mb-3 flex-1 line-clamp-3">{recipe.description}</p>
                <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {recipe.prepTime} prep
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {recipe.cookTime} cook
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {recipe.servings}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {recipe.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        ) : (
        <div className="space-y-2">
          {filtered.map((recipe) => (
            <div
              key={recipe.id}
              className="bg-white rounded-lg border border-gray-100 hover:shadow-sm transition-shadow cursor-pointer flex items-center gap-4 p-3"
              onClick={() => setSelectedRecipe(recipe)}
            >
              {recipe.images.length > 0 && (
                <img
                  src={recipe.images[0]}
                  alt={recipe.title}
                  className="w-16 h-16 rounded-lg object-cover shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">{recipe.title}</h3>
                  {recipe.isFavorite && <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500 shrink-0" />}
                </div>
                <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{recipe.description}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {recipe.prepTime} + {recipe.cookTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {recipe.servings}
                  </span>
                  {recipe.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="px-1.5 py-0.5 rounded-full bg-primary-50 text-primary-700 text-[10px] font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setAddToPlanRecipe(recipe);
                  }}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                  title="Add to meal plan"
                >
                  <CalendarPlus className="w-4 h-4 text-gray-300 hover:text-primary-500 transition-colors" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(recipe.id);
                  }}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <Heart
                    className={`w-4 h-4 transition-colors ${
                      recipe.isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-300'
                    }`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
        )
      )}

      {activeRecipe && (
        <RecipeModal
          recipe={activeRecipe}
          onClose={() => setSelectedRecipe(null)}
          onToggleFavorite={toggleFavorite}
          onRatingChange={updateRating}
          onNotesChange={updateNotes}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAddToPlan={(recipe) => {
            setSelectedRecipe(null);
            setAddToPlanRecipe(recipe);
          }}
        />
      )}

      {editingRecipe && (
        <RecipeFormModal
          recipe={editingRecipe}
          onClose={() => setEditingRecipe(null)}
        />
      )}

      {showNewRecipe && (
        <RecipeFormModal
          onClose={() => setShowNewRecipe(false)}
        />
      )}

      {addToPlanRecipe && (
        <AddToPlanModal
          recipe={addToPlanRecipe}
          onClose={() => setAddToPlanRecipe(null)}
        />
      )}
    </div>
  );
}
