import { useState } from 'react';
import { X, Key, Eye, EyeOff, Check } from 'lucide-react';
import type { LlmProvider } from '../../types';
import { useSettings } from '../../context/SettingsContext';

interface SettingsModalProps {
  onClose: () => void;
}

const providers: { id: LlmProvider; label: string; placeholder: string }[] = [
  { id: 'anthropic', label: 'Anthropic (Claude)', placeholder: 'sk-ant-...' },
  { id: 'openai', label: 'OpenAI (GPT)', placeholder: 'sk-...' },
];

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { settings, updateApiKey, updateLlmProvider } = useSettings();
  const [keyInput, setKeyInput] = useState(settings.apiKey);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const selectedProvider = providers.find((p) => p.id === settings.llmProvider) ?? providers[0];

  const handleSave = () => {
    updateApiKey(keyInput.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleProviderChange = (provider: LlmProvider) => {
    updateLlmProvider(provider);
    setKeyInput('');
    updateApiKey('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">AI Provider</label>
            <div className="flex gap-2">
              {providers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleProviderChange(p.id)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                    settings.llmProvider === p.id
                      ? 'bg-primary-50 border-primary-300 text-primary-700'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Key className="w-4 h-4 inline mr-1.5 -mt-0.5" />
              API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={keyInput}
                onChange={(e) => {
                  setKeyInput(e.target.value);
                  setSaved(false);
                }}
                placeholder={selectedProvider.placeholder}
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
              Your key is stored locally on this device only.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={keyInput.trim() === settings.apiKey}
            className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
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
      </div>
    </div>
  );
}
