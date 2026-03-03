import { useEffect } from 'react';
import { X, Leaf, RefreshCw } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useMealPlan } from '../../context/MealPlanContext';
import { useRecipes } from '../../context/RecipeContext';
import { useNutritionReview } from '../../hooks/useNutritionReview';

interface NutritionReviewModalProps {
  onClose: () => void;
}

export default function NutritionReviewModal({ onClose }: NutritionReviewModalProps) {
  const { settings } = useSettings();
  const { weekPlan } = useMealPlan();
  const { recipes } = useRecipes();
  const { review, isLoading, error, generateReview } = useNutritionReview();

  useEffect(() => {
    generateReview(settings.apiKey, weekPlan, recipes);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRetry = () => {
    generateReview(settings.apiKey, weekPlan, recipes);
  };

  // Parse bullet points from the AI response
  const bullets = review
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('-') || line.startsWith('•') || line.startsWith('*'));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-semibold text-gray-900">Nutrition Review</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
              <p className="text-sm text-gray-500">Analyzing your meal plan...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <p className="text-sm text-red-500">{error}</p>
              <button
                onClick={handleRetry}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          )}

          {!isLoading && !error && review && (
            <ul className="space-y-3">
              {bullets.map((bullet, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-700 leading-relaxed">
                  <span className="text-green-500 mt-0.5 shrink-0">•</span>
                  <span dangerouslySetInnerHTML={{
                    __html: bullet
                      .replace(/^[-•*]\s*/, '')
                      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'),
                  }} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100">
          <p className="text-[11px] text-gray-400 italic leading-relaxed">
            This is not nutritional or medical advice. These are general observations based on your
            planned meals and should not replace guidance from a qualified healthcare professional.
          </p>
        </div>
      </div>
    </div>
  );
}
