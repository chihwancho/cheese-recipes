import { useState } from 'react';
import { X, Key, Eye, EyeOff, Check, Sparkles, Search } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { settings, updateApiKey, updateEmbeddingApiKey } = useSettings();
  const [keyInput, setKeyInput] = useState(settings.apiKey);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [embKeyInput, setEmbKeyInput] = useState(settings.embeddingApiKey);
  const [showEmbKey, setShowEmbKey] = useState(false);
  const [embSaved, setEmbSaved] = useState(false);

  const handleSave = () => {
    updateApiKey(keyInput.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveEmbeddingKey = () => {
    updateEmbeddingApiKey(embKeyInput.trim());
    setEmbSaved(true);
    setTimeout(() => setEmbSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Meal Plan Generation */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-primary-500" />
              <h3 className="text-sm font-semibold text-gray-800">Meal Plan Generation</h3>
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Key className="w-4 h-4 inline mr-1.5 -mt-0.5" />
              Anthropic API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={keyInput}
                onChange={(e) => {
                  setKeyInput(e.target.value);
                  setSaved(false);
                }}
                placeholder="sk-ant-..."
                className="w-full px-3 py-2.5 pr-20 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 font-mono"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  title={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <p className="mt-1.5 text-xs text-gray-400">
              Used by Claude to generate your weekly meal plans.
            </p>
            <button
              onClick={handleSave}
              disabled={keyInput.trim() === settings.apiKey}
              className={`w-full mt-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                saved
                  ? 'bg-green-500 text-white'
                  : keyInput.trim() === settings.apiKey
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {saved ? (
                <span className="flex items-center justify-center gap-1.5">
                  <Check className="w-4 h-4" /> Saved
                </span>
              ) : (
                'Save API Key'
              )}
            </button>
          </div>

          {/* Recipe Search (Embeddings) */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Search className="w-4 h-4 text-primary-500" />
              <h3 className="text-sm font-semibold text-gray-800">Smart Recipe Search</h3>
              <span className="text-xs text-gray-400 font-normal">Optional</span>
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Key className="w-4 h-4 inline mr-1.5 -mt-0.5" />
              OpenAI API Key
            </label>
            <div className="relative">
              <input
                type={showEmbKey ? 'text' : 'password'}
                value={embKeyInput}
                onChange={(e) => {
                  setEmbKeyInput(e.target.value);
                  setEmbSaved(false);
                }}
                placeholder="sk-..."
                className="w-full px-3 py-2.5 pr-20 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 font-mono"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <button
                  onClick={() => setShowEmbKey(!showEmbKey)}
                  className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  title={showEmbKey ? 'Hide key' : 'Show key'}
                >
                  {showEmbKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <p className="mt-1.5 text-xs text-gray-400">
              Enables semantic recipe search when you have 50+ recipes. Uses OpenAI embeddings to find the most relevant recipes for meal plan generation.
            </p>
            <button
              onClick={handleSaveEmbeddingKey}
              disabled={embKeyInput.trim() === settings.embeddingApiKey}
              className={`w-full mt-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                embSaved
                  ? 'bg-green-500 text-white'
                  : embKeyInput.trim() === settings.embeddingApiKey
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {embSaved ? (
                <span className="flex items-center justify-center gap-1.5">
                  <Check className="w-4 h-4" /> Saved
                </span>
              ) : (
                'Save Embedding Key'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
