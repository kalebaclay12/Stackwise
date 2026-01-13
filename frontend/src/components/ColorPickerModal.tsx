import { useState, useEffect } from 'react';
import { X, Palette, Plus } from 'lucide-react';

interface ColorPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  onChange: (color: string) => void;
  presetColors: string[];
  title?: string;
}

const MAX_RECENT_COLORS = 8;

// All available colors shown upfront - clean and modern
const ALL_COLORS = [
  // Blues
  '#0EA5E9', '#0284C7', '#0369A1', '#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF', '#06B6D4',
  // Greens
  '#10B981', '#059669', '#047857', '#22C55E', '#16A34A', '#15803D', '#84CC16', '#65A30D',
  // Reds & Oranges
  '#EF4444', '#DC2626', '#B91C1C', '#F87171', '#FB923C', '#F97316', '#EA580C', '#FDBA74',
  // Purples & Pinks
  '#8B5CF6', '#7C3AED', '#6D28D9', '#A855F7', '#9333EA', '#EC4899', '#DB2777', '#BE185D',
  // Yellows
  '#EAB308', '#CA8A04', '#F59E0B', '#D97706', '#FCD34D', '#FBBF24', '#FACC15', '#FEF08A',
  // Teals & Cyans
  '#14B8A6', '#0D9488', '#0F766E', '#2DD4BF', '#5EEAD4', '#06B6D4', '#0891B2', '#22D3EE',
  // Grays
  '#6B7280', '#4B5563', '#374151', '#1F2937', '#9CA3AF', '#D1D5DB', '#E5E7EB', '#F3F4F6',
  // Gradients
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)',
  'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
  'linear-gradient(135deg, #f77062 0%, #fe5196 100%)',
  'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
  'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
];

const getStorageKey = (presetColors: string[]): string => {
  const firstColor = presetColors[0] || '';
  if (firstColor.includes('667eea') || firstColor.includes('3B82F6')) {
    return 'colorPicker_recent_checking';
  } else if (firstColor.includes('10b981') || firstColor.includes('34d399')) {
    return 'colorPicker_recent_savings';
  } else {
    return 'colorPicker_recent_stacks';
  }
};

export default function ColorPickerModal({
  isOpen,
  onClose,
  value,
  onChange,
  presetColors,
  title = 'Choose Color'
}: ColorPickerModalProps) {
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customColor, setCustomColor] = useState('');

  useEffect(() => {
    const storageKey = getStorageKey(presetColors);
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setRecentColors(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        console.error('Failed to parse recent colors:', e);
      }
    }
  }, [presetColors]);

  if (!isOpen) return null;

  const saveRecentColor = (color: string) => {
    const storageKey = getStorageKey(presetColors);
    setRecentColors((prev) => {
      const filtered = prev.filter((c) => c !== color);
      const updated = [color, ...filtered].slice(0, MAX_RECENT_COLORS);
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
  };

  const handleColorSelect = (color: string) => {
    onChange(color);
    saveRecentColor(color);
    onClose();
  };

  const handleCustomColorSubmit = () => {
    if (customColor) {
      let formattedColor = customColor.trim();
      if (/^[0-9A-Fa-f]{6}$/.test(formattedColor)) {
        formattedColor = `#${formattedColor}`;
      }
      if (/^#[0-9A-Fa-f]{6}$/.test(formattedColor)) {
        handleColorSelect(formattedColor);
        setCustomColor('');
        setShowCustomInput(false);
      } else {
        alert('Please enter a valid hex color (e.g., FF5733)');
      }
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
              <Palette className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[70vh] overflow-y-auto">
          {/* Recent Colors */}
          {recentColors.length > 0 && (
            <div className="mb-5">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Recent
              </h4>
              <div className="grid grid-cols-8 gap-2">
                {recentColors.map((color, index) => (
                  <button
                    key={`recent-${color}-${index}`}
                    type="button"
                    onClick={() => handleColorSelect(color)}
                    className={`aspect-square rounded-xl border-2 transition-all hover:scale-110 active:scale-95 ${
                      value === color
                        ? 'border-primary-600 dark:border-primary-400 ring-2 ring-primary-300 dark:ring-primary-600 scale-105'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                    style={{ background: color }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All Colors */}
          <div className="mb-5">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              All Colors
            </h4>
            <div className="grid grid-cols-8 gap-2">
              {ALL_COLORS.map((color, index) => (
                <button
                  key={`color-${color}-${index}`}
                  type="button"
                  onClick={() => handleColorSelect(color)}
                  className={`aspect-square rounded-xl border-2 transition-all hover:scale-110 active:scale-95 ${
                    value === color
                      ? 'border-primary-600 dark:border-primary-400 ring-2 ring-primary-300 dark:ring-primary-600 scale-105'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                  style={{ background: color }}
                />
              ))}
            </div>
          </div>

          {/* Custom Color Input */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            {showCustomInput ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-2.5 text-gray-500 dark:text-gray-400 text-sm font-medium">#</span>
                    <input
                      type="text"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value.replace('#', '').toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCustomColorSubmit();
                        if (e.key === 'Escape') { setShowCustomInput(false); setCustomColor(''); }
                      }}
                      placeholder="FF5733"
                      maxLength={6}
                      className="input pl-8"
                      autoFocus
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCustomColorSubmit}
                    className="btn-primary px-6"
                  >
                    Add
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowCustomInput(false); setCustomColor(''); }}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowCustomInput(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-primary-400 dark:hover:border-primary-600 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">Custom Hex Color</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
