import { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { useGenerateMealPlan } from '../../hooks/useGenerateMealPlan';
import { useSettings } from '../../context/SettingsContext';
import type { MealSlotSelection } from '../../services/ai/types';

interface GenerateMealPlanModalProps {
  onClose: () => void;
}

const slotLabels: { key: keyof MealSlotSelection; label: string }[] = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'snack', label: 'Snack' },
];

export default function GenerateMealPlanModal({ onClose }: GenerateMealPlanModalProps) {
  const { hasApiKey } = useSettings();
  const { generate, isGenerating, error, clearError } = useGenerateMealPlan();

  const [days, setDays] = useState(7);
  const [slots, setSlots] = useState<MealSlotSelection>({
    breakfast: true,
    lunch: true,
    dinner: true,
    snack: false,
  });
  const [dietaryNotes, setDietaryNotes] = useState('');
  const [clearExisting, setClearExisting] = useState(true);

  const hasAnySlot = Object.values(slots).some(Boolean);

  const handleGenerate = async () => {
    clearError();
    const success = await generate({ days, slots, dietaryNotes }, clearExisting);
    if (success) {
      onClose();
    }
  };

  const toggleSlot = (key: keyof MealSlotSelection) => {
    setSlots((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-500" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Generate Plan</h2>
              <p className="text-xs text-gray-400">AI-powered meal planning</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {!hasApiKey && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                Add your API key in Settings (gear icon in sidebar) to use AI generation.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Days to plan</label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                    days === d
                      ? 'bg-primary-50 border-primary-300 text-primary-700'
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Meal slots</label>
            <div className="grid grid-cols-2 gap-2">
              {slotLabels.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => toggleSlot(key)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                    slots[key]
                      ? 'bg-primary-50 border-primary-300 text-primary-700'
                      : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferences <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={dietaryNotes}
              onChange={(e) => setDietaryNotes(e.target.value)}
              placeholder="e.g. more protein, no pasta this week, kid-friendly meals..."
              rows={2}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={clearExisting}
              onChange={(e) => setClearExisting(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
            />
            <span className="text-sm text-gray-600">Clear existing meals first</span>
          </label>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !hasApiKey || !hasAnySlot}
            className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center justify-center gap-2 ${
              isGenerating || !hasApiKey || !hasAnySlot
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Plan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
