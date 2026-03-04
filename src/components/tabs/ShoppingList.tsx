import { ShoppingCart, Check, Trash2, Sparkles } from 'lucide-react';
import { useShoppingList } from '../../context/ShoppingListContext';
import type { ShoppingItem } from '../../types';

const categoryLabels: Record<ShoppingItem['category'], string> = {
  produce: 'Produce',
  dairy: 'Dairy & Eggs',
  meat: 'Meat & Seafood',
  pantry: 'Pantry',
  frozen: 'Frozen',
  bakery: 'Bakery',
};

const categoryOrder: ShoppingItem['category'][] = ['produce', 'meat', 'dairy', 'pantry', 'bakery', 'frozen'];

export default function ShoppingList() {
  const { items, isMerging, toggleItem, clearChecked } = useShoppingList();

  const checkedCount = items.filter((i) => i.checked).length;

  const grouped = categoryOrder
    .map((cat) => ({
      category: cat,
      label: categoryLabels[cat],
      items: items.filter((i) => i.category === cat),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <ShoppingCart className="w-7 h-7 text-primary-500 shrink-0" />
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Shopping List</h2>
            <p className="text-xs sm:text-sm text-gray-500">
              {checkedCount} of {items.length} items checked off
            </p>
          </div>
        </div>
        {checkedCount > 0 && (
          <button
            onClick={clearChecked}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear checked ({checkedCount})
          </button>
        )}
      </div>

      {isMerging && (
        <div className="max-w-2xl mb-4 flex items-center gap-2.5 px-4 py-3 bg-primary-50 border border-primary-100 rounded-xl text-sm text-primary-700">
          <Sparkles className="w-4 h-4 animate-pulse shrink-0" />
          <span>Combining similar ingredients...</span>
        </div>
      )}

      <div className="max-w-2xl space-y-6">
        {grouped.map((group) => (
          <div key={group.category}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 px-1">
              {group.label}
            </h3>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
              {group.items.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <button
                    onClick={() => toggleItem(item.id)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                      item.checked
                        ? 'bg-primary-500 border-primary-500'
                        : 'border-gray-300 hover:border-primary-400'
                    }`}
                  >
                    {item.checked && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <span
                    className={`flex-1 text-sm transition-colors ${
                      item.checked ? 'line-through text-gray-400' : 'text-gray-800'
                    }`}
                  >
                    {item.name}
                  </span>
                  <span className="text-xs text-gray-400">{item.quantity}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
