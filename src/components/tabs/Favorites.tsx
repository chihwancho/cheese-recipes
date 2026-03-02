import { useState } from 'react';
import { Heart, Clock, Users, CalendarPlus } from 'lucide-react';
import type { Recipe } from '../../types';
import { useRecipes } from '../../context/RecipeContext';
import StarRating from '../ui/StarRating';
import ImageCarousel from '../ui/ImageCarousel';
import RecipeModal from '../ui/RecipeModal';
import RecipeFormModal from '../ui/RecipeFormModal';
import AddToPlanModal from '../ui/AddToPlanModal';

export default function Favorites() {
  const { recipes, toggleFavorite, updateRating, updateNotes, deleteRecipe } = useRecipes();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [addToPlanRecipe, setAddToPlanRecipe] = useState<Recipe | null>(null);

  const favorites = recipes.filter((r) => r.isFavorite);

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
      <div className="flex items-center gap-3 mb-6">
        <Heart className="w-7 h-7 text-red-500 shrink-0" />
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Favorites</h2>
          <p className="text-xs sm:text-sm text-gray-500">Your saved recipes</p>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">No favorites yet.</p>
          <p className="text-gray-400 text-xs mt-1">
            Browse Recipes and tap the heart icon to add favorites.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((recipe) => (
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
                    <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                  </div>
                </div>

                <div className="mb-2">
                  <StarRating rating={recipe.rating} />
                </div>

                <p className="text-sm text-gray-500 mb-3 flex-1">{recipe.description}</p>
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

      {addToPlanRecipe && (
        <AddToPlanModal
          recipe={addToPlanRecipe}
          onClose={() => setAddToPlanRecipe(null)}
        />
      )}
    </div>
  );
}
