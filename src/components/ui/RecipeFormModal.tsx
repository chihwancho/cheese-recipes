import { useEffect, useRef, useState } from 'react';
import { X, Plus, Trash2, GripVertical, Link, Loader2, AlertCircle, ImageOff, FileText, Type } from 'lucide-react';
import type { Recipe } from '../../types';
import { useRecipes } from '../../context/RecipeContext';
import { useSettings } from '../../context/SettingsContext';
import { parseRecipeFromUrl } from '../../utils/recipeImport';
import { parseRecipeFromText, parseRecipeFromImage, parseRecipeFromPdf, fileToBase64 } from '../../utils/recipeImportAI';
import StarRating from './StarRating';

type ImportMode = 'url' | 'file' | 'text';

interface RecipeFormModalProps {
  recipe?: Recipe;
  onClose: () => void;
}

interface FormState {
  title: string;
  description: string;
  prepTime: string;
  cookTime: string;
  servings: number;
  ingredients: string[];
  steps: string[];
  tags: string[];
  images: string[];
  rating: number;
  notes: string;
  isFavorite: boolean;
  source: string;
}

function emptyForm(): FormState {
  return {
    title: '',
    description: '',
    prepTime: '',
    cookTime: '',
    servings: 4,
    ingredients: [''],
    steps: [''],
    tags: [],
    images: [],
    rating: 0,
    notes: '',
    isFavorite: false,
    source: '',
  };
}

function recipeToForm(recipe: Recipe): FormState {
  return {
    title: recipe.title,
    description: recipe.description,
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    servings: recipe.servings,
    ingredients: recipe.ingredients.length > 0 ? [...recipe.ingredients] : [''],
    steps: recipe.steps.length > 0 ? [...recipe.steps] : [''],
    tags: [...recipe.tags],
    images: [...recipe.images],
    rating: recipe.rating,
    notes: recipe.notes,
    isFavorite: recipe.isFavorite,
    source: recipe.source || '',
  };
}

const inputClass =
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300';
const labelClass = 'block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5';

export default function RecipeFormModal({ recipe, onClose }: RecipeFormModalProps) {
  const { addRecipe, updateRecipe } = useRecipes();
  const { settings } = useSettings();
  const overlayRef = useRef<HTMLDivElement>(null);
  const isEditing = !!recipe;

  const [form, setForm] = useState<FormState>(recipe ? recipeToForm(recipe) : emptyForm());
  const [tagInput, setTagInput] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');

  // Import state
  const [importMode, setImportMode] = useState<ImportMode>('url');
  const [importUrl, setImportUrl] = useState('');
  const [importText, setImportText] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const dropZoneRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // --- List helpers ---
  const updateListItem = (key: 'ingredients' | 'steps', index: number, value: string) => {
    setForm((prev) => {
      const list = [...prev[key]];
      list[index] = value;
      return { ...prev, [key]: list };
    });
  };

  const addListItem = (key: 'ingredients' | 'steps') => {
    setForm((prev) => ({ ...prev, [key]: [...prev[key], ''] }));
  };

  const removeListItem = (key: 'ingredients' | 'steps', index: number) => {
    setForm((prev) => {
      const list = prev[key].filter((_, i) => i !== index);
      return { ...prev, [key]: list.length > 0 ? list : [''] };
    });
  };

  const moveListItem = (key: 'ingredients' | 'steps', from: number, to: number) => {
    if (to < 0 || to >= form[key].length) return;
    setForm((prev) => {
      const list = [...prev[key]];
      const [item] = list.splice(from, 1);
      list.splice(to, 0, item);
      return { ...prev, [key]: list };
    });
  };

  // --- Tags ---
  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      update('tags', [...form.tags, tag]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    update('tags', form.tags.filter((t) => t !== tag));
  };

  // --- Images ---
  const addImage = () => {
    const url = imageUrlInput.trim();
    if (url) {
      update('images', [...form.images, url]);
      setImageUrlInput('');
    }
  };

  const removeImage = (index: number) => {
    update('images', form.images.filter((_, i) => i !== index));
  };

  // --- Apply parsed recipe to form ---
  const applyParsed = (parsed: Partial<Recipe>, sourceUrl?: string) => {
    setForm((prev) => ({
      ...prev,
      title: parsed.title || prev.title,
      description: parsed.description || prev.description,
      prepTime: parsed.prepTime || prev.prepTime,
      cookTime: parsed.cookTime || prev.cookTime,
      servings: parsed.servings || prev.servings,
      ingredients: parsed.ingredients && parsed.ingredients.length > 0 ? parsed.ingredients : prev.ingredients,
      steps: parsed.steps && parsed.steps.length > 0 ? parsed.steps : prev.steps,
      tags: parsed.tags && parsed.tags.length > 0 ? parsed.tags : prev.tags,
      images: parsed.images && parsed.images.length > 0 ? parsed.images : prev.images,
      source: sourceUrl ?? prev.source,
    }));
  };

  // --- Import handlers ---
  const handleUrlImport = async () => {
    if (!importUrl.trim()) return;
    setImporting(true);
    setImportError('');
    try {
      const url = importUrl.trim();
      const parsed = await parseRecipeFromUrl(url);
      applyParsed(parsed, url);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to import recipe.');
    } finally {
      setImporting(false);
    }
  };

  const handleFileImport = async () => {
    if (!importFile) return;
    if (!settings.apiKey) {
      setImportError('An API key is required for file import. Add it in Settings.');
      return;
    }
    setImporting(true);
    setImportError('');
    try {
      const base64 = await fileToBase64(importFile);
      const parsed = importFile.type === 'application/pdf'
        ? await parseRecipeFromPdf(base64, settings.apiKey)
        : await parseRecipeFromImage(base64, importFile.type, settings.apiKey);
      applyParsed(parsed);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to extract recipe from file.');
    } finally {
      setImporting(false);
    }
  };

  const handleTextImport = async () => {
    if (!importText.trim()) return;
    if (!settings.apiKey) {
      setImportError('An API key is required for text import. Add it in Settings.');
      return;
    }
    setImporting(true);
    setImportError('');
    try {
      const parsed = await parseRecipeFromText(importText.trim(), settings.apiKey);
      applyParsed(parsed);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to extract recipe from text.');
    } finally {
      setImporting(false);
    }
  };

  // --- Save ---
  const handleSave = () => {
    if (!form.title.trim()) return;

    const cleanIngredients = form.ingredients.filter((i) => i.trim());
    const cleanSteps = form.steps.filter((s) => s.trim());

    if (isEditing && recipe) {
      updateRecipe(recipe.id, {
        ...form,
        ingredients: cleanIngredients,
        steps: cleanSteps,
      });
    } else {
      const newRecipe: Recipe = {
        id: crypto.randomUUID(),
        ...form,
        ingredients: cleanIngredients,
        steps: cleanSteps,
      };
      addRecipe(newRecipe);
    }
    onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold text-gray-900">
            {isEditing ? 'Edit Recipe' : 'New Recipe'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Import section (create mode only) */}
          {!isEditing && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              {/* Mode tabs */}
              <div className="flex gap-1 mb-3">
                {([
                  { mode: 'url' as ImportMode, icon: Link, label: 'URL' },
                  { mode: 'file' as ImportMode, icon: FileText, label: 'File' },
                  { mode: 'text' as ImportMode, icon: Type, label: 'Text' },
                ] as const).map(({ mode, icon: Icon, label }) => (
                  <button
                    key={mode}
                    onClick={() => { setImportMode(mode); setImportError(''); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      importMode === mode
                        ? 'bg-blue-500 text-white'
                        : 'text-blue-500 hover:bg-blue-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              {/* URL mode */}
              {importMode === 'url' && (
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://www.example.com/recipe/..."
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUrlImport()}
                    className="flex-1 rounded-lg border border-blue-200 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                  />
                  <button
                    onClick={handleUrlImport}
                    disabled={importing || !importUrl.trim()}
                    className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    {importing ? <><Loader2 className="w-4 h-4 animate-spin" />Importing...</> : 'Import'}
                  </button>
                </div>
              )}

              {/* File mode */}
              {importMode === 'file' && (
                <div className="space-y-2">
                  <div className="relative flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-100/50 focus-within:border-blue-400 transition-colors">
                    <textarea
                      ref={dropZoneRef}
                      className="absolute inset-0 opacity-0 cursor-pointer resize-none rounded-lg w-full h-full focus:outline-none"
                      onMouseEnter={() => dropZoneRef.current?.focus()}
                      onClick={() => fileInputRef.current?.click()}
                      onPaste={(e) => {
                        const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith('image/'));
                        if (item) {
                          const file = item.getAsFile();
                          if (file) { setImportFile(file); setImportError(''); }
                          e.preventDefault();
                        }
                      }}
                      readOnly
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        setImportFile(file);
                        setImportError('');
                      }}
                    />
                    {importFile ? (
                      <span className="text-sm font-medium text-blue-700 pointer-events-none">{importFile.name}</span>
                    ) : (
                      <>
                        <FileText className="w-6 h-6 text-blue-300 mb-1 pointer-events-none" />
                        <span className="text-xs text-blue-400 pointer-events-none">Click to select, or paste a screenshot</span>
                      </>
                    )}
                  </div>
                  <button
                    onClick={handleFileImport}
                    disabled={importing || !importFile}
                    className="w-full px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    {importing ? <><Loader2 className="w-4 h-4 animate-spin" />Extracting...</> : 'Extract Recipe'}
                  </button>
                </div>
              )}

              {/* Text mode */}
              {importMode === 'text' && (
                <div className="space-y-2">
                  <textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="Paste recipe text here — ingredients, steps, anything..."
                    rows={5}
                    className="w-full rounded-lg border border-blue-200 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white resize-none"
                  />
                  <button
                    onClick={handleTextImport}
                    disabled={importing || !importText.trim()}
                    className="w-full px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    {importing ? <><Loader2 className="w-4 h-4 animate-spin" />Extracting...</> : 'Extract Recipe'}
                  </button>
                </div>
              )}

              {importError && (
                <div className="mt-2 flex items-start gap-2 text-xs text-red-600">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{importError}</span>
                </div>
              )}
            </div>
          )}

          {/* Title */}
          <div>
            <label className={labelClass}>Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="Recipe name"
              className={inputClass}
            />
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Brief description of the recipe"
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Source */}
          <div>
            <label className={labelClass}>Source</label>
            <input
              type="url"
              value={form.source}
              onChange={(e) => update('source', e.target.value)}
              placeholder="https://www.example.com/recipe/..."
              className={inputClass}
            />
          </div>

          {/* Time / Servings row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Prep time</label>
              <input
                type="text"
                value={form.prepTime}
                onChange={(e) => update('prepTime', e.target.value)}
                placeholder="15 min"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Cook time</label>
              <input
                type="text"
                value={form.cookTime}
                onChange={(e) => update('cookTime', e.target.value)}
                placeholder="30 min"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Servings</label>
              <input
                type="number"
                min={1}
                value={form.servings}
                onChange={(e) => update('servings', Math.max(1, parseInt(e.target.value) || 1))}
                className={inputClass}
              />
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className={labelClass}>Rating</label>
            <div className="flex items-center gap-2">
              <StarRating rating={form.rating} onChange={(r) => update('rating', r)} size="md" />
              <span className="text-xs text-gray-400">
                {form.rating > 0 ? `${form.rating}/5` : 'Not rated'}
              </span>
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <label className={labelClass}>Ingredients</label>
            <div className="space-y-2">
              {form.ingredients.map((ingredient, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={ingredient}
                    onChange={(e) => updateListItem('ingredients', i, e.target.value)}
                    placeholder={`Ingredient ${i + 1}`}
                    className={`${inputClass} flex-1`}
                  />
                  <button
                    onClick={() => removeListItem('ingredients', i)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => addListItem('ingredients')}
                className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add ingredient
              </button>
            </div>
          </div>

          {/* Steps */}
          <div>
            <label className={labelClass}>Steps</label>
            <div className="space-y-2">
              {form.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="flex flex-col items-center gap-0.5 pt-2">
                    <button
                      onClick={() => moveListItem('steps', i, i - 1)}
                      disabled={i === 0}
                      className="text-gray-300 hover:text-gray-500 disabled:opacity-30 cursor-pointer disabled:cursor-default"
                    >
                      <GripVertical className="w-4 h-4 rotate-180" />
                    </button>
                    <span className="text-[10px] font-bold text-gray-400 w-5 text-center">{i + 1}</span>
                    <button
                      onClick={() => moveListItem('steps', i, i + 1)}
                      disabled={i === form.steps.length - 1}
                      className="text-gray-300 hover:text-gray-500 disabled:opacity-30 cursor-pointer disabled:cursor-default"
                    >
                      <GripVertical className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    value={step}
                    onChange={(e) => updateListItem('steps', i, e.target.value)}
                    placeholder={`Step ${i + 1}`}
                    rows={2}
                    className={`${inputClass} flex-1 resize-none`}
                  />
                  <button
                    onClick={() => removeListItem('steps', i)}
                    className="p-1.5 mt-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => addListItem('steps')}
                className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add step
              </button>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className={labelClass}>Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {form.tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 font-medium"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="hover:text-red-500 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Add a tag..."
                className={`${inputClass} flex-1`}
              />
              <button
                onClick={addTag}
                disabled={!tagInput.trim()}
                className="px-3 py-2 text-sm font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </div>

          {/* Images */}
          <div>
            <label className={labelClass}>Images</label>
            {form.images.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {form.images.map((url, i) => (
                  <div key={i} className="relative group w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={url}
                      alt={`Image ${i + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden w-full h-full flex items-center justify-center absolute inset-0">
                      <ImageOff className="w-6 h-6 text-gray-300" />
                    </div>
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute top-0.5 right-0.5 bg-black/50 hover:bg-black/70 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="url"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addImage();
                  }
                }}
                placeholder="Paste image URL..."
                className={`${inputClass} flex-1`}
              />
              <button
                onClick={addImage}
                disabled={!imageUrlInput.trim()}
                className="px-3 py-2 text-sm font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              placeholder="Personal notes, tips, or variations..."
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!form.title.trim()}
            className="px-5 py-2 text-sm font-medium bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEditing ? 'Save Changes' : 'Add Recipe'}
          </button>
        </div>
      </div>
    </div>
  );
}
