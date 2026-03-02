import { useEffect, useRef, useState } from 'react';
import { X, Clock, Users, Heart, StickyNote, ChefHat, Pencil, Trash2, CalendarPlus, ExternalLink } from 'lucide-react';
import type { Recipe } from '../../types';
import ImageCarousel from './ImageCarousel';
import StarRating from './StarRating';

interface RecipeModalProps {
  recipe: Recipe;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  onRatingChange: (id: string, rating: number) => void;
  onNotesChange: (id: string, notes: string) => void;
  onEdit?: (recipe: Recipe) => void;
  onDelete?: (id: string) => void;
  onAddToPlan?: (recipe: Recipe) => void;
}

export default function RecipeModal({
  recipe,
  onClose,
  onToggleFavorite,
  onRatingChange,
  onNotesChange,
  onEdit,
  onDelete,
  onAddToPlan,
}: RecipeModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [noteDraft, setNoteDraft] = useState(recipe.notes);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const saveNotes = () => {
    onNotesChange(recipe.id, noteDraft);
    setEditingNotes(false);
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up">
        {/* Image carousel header */}
        <div className="relative">
          <ImageCarousel
            images={recipe.images}
            alt={recipe.title}
            className="h-40 sm:h-64 w-full"
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors cursor-pointer z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Title row */}
          <div className="flex items-start justify-between gap-3 mb-1">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{recipe.title}</h2>
            <div className="flex items-center gap-1 shrink-0">
              {onAddToPlan && (
                <button
                  onClick={() => onAddToPlan(recipe)}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                  title="Add to meal plan"
                >
                  <CalendarPlus className="w-5 h-5 text-gray-400 hover:text-primary-500" />
                </button>
              )}
              {onEdit && (
                <button
                  onClick={() => onEdit(recipe)}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                  title="Edit recipe"
                >
                  <Pencil className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                  title="Delete recipe"
                >
                  <Trash2 className="w-5 h-5 text-gray-400 hover:text-red-500" />
                </button>
              )}
              <button
                onClick={() => onToggleFavorite(recipe.id)}
                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <Heart
                  className={`w-6 h-6 transition-colors ${
                    recipe.isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-300'
                  }`}
                />
              </button>
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-3">{recipe.description}</p>

          {recipe.source && (
            <a
              href={recipe.source}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary-500 hover:text-primary-700 mb-3 truncate max-w-full"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{recipe.source}</span>
            </a>
          )}

          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            <StarRating
              rating={recipe.rating}
              onChange={(r) => onRatingChange(recipe.id, r)}
              size="md"
            />
            <span className="text-xs text-gray-400">
              {recipe.rating > 0 ? `${recipe.rating}/5` : 'Not rated'}
            </span>
          </div>

          {/* Meta badges */}
          <div className="flex flex-wrap items-center gap-3 mb-6 text-sm text-gray-500">
            <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full">
              <Clock className="w-4 h-4" />
              {recipe.prepTime} prep
            </span>
            <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full">
              <Clock className="w-4 h-4" />
              {recipe.cookTime} cook
            </span>
            <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full">
              <Users className="w-4 h-4" />
              {recipe.servings} servings
            </span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-6">
            {recipe.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 font-medium"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Ingredients */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
              <ChefHat className="w-4 h-4" />
              Ingredients
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {recipe.ingredients.map((ingredient, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-1.5 shrink-0" />
                  {ingredient}
                </li>
              ))}
            </ul>
          </div>

          {/* Steps */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Steps
            </h3>
            <ol className="space-y-3">
              {recipe.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-700">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <p className="pt-0.5">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* Notes */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
              <StickyNote className="w-4 h-4" />
              Notes
            </h3>
            {editingNotes ? (
              <div className="space-y-2">
                <textarea
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="Add your personal notes..."
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 p-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300 resize-none"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={saveNotes}
                    className="px-3 py-1.5 text-xs font-medium bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setNoteDraft(recipe.notes);
                      setEditingNotes(false);
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-gray-500 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setEditingNotes(true)}
                className="w-full text-left cursor-pointer"
              >
                {recipe.notes ? (
                  <p className="text-sm text-gray-600 bg-amber-50 border border-amber-100 rounded-lg p-3 hover:bg-amber-100/70 transition-colors">
                    {recipe.notes}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 italic bg-gray-50 border border-dashed border-gray-200 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                    Click to add personal notes...
                  </p>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && onDelete && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl z-10">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Recipe?</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete "{recipe.title}"? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete(recipe.id);
                  onClose();
                }}
                className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
