import { useState, useEffect, useRef } from 'react';
import { X, Palette, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

interface ColorPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  onChange: (color: string) => void;
  presetColors: string[];
  title?: string;
}

const MAX_RECENT_COLORS = 12;

// Expanded color palette organized by hue
const EXTENDED_COLORS = {
  'Blues': ['#0EA5E9', '#0284C7', '#0369A1', '#075985', '#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF', '#06B6D4', '#0891B2', '#0E7490', '#155E75'],
  'Greens': ['#10B981', '#059669', '#047857', '#065F46', '#22C55E', '#16A34A', '#15803D', '#14532D', '#84CC16', '#65A30D', '#4D7C0F', '#3F6212'],
  'Reds': ['#EF4444', '#DC2626', '#B91C1C', '#991B1B', '#F87171', '#EF4444', '#DC2626', '#B91C1C', '#FB923C', '#F97316', '#EA580C', '#C2410C'],
  'Purples': ['#8B5CF6', '#7C3AED', '#6D28D9', '#5B21B6', '#A855F7', '#9333EA', '#7E22CE', '#6B21A8', '#EC4899', '#DB2777', '#BE185D', '#9F1239'],
  'Oranges': ['#F59E0B', '#D97706', '#B45309', '#92400E', '#FB923C', '#F97316', '#EA580C', '#C2410C', '#FDBA74', '#FB923C', '#F97316', '#EA580C'],
  'Yellows': ['#EAB308', '#CA8A04', '#A16207', '#854D0E', '#FCD34D', '#FBBF24', '#F59E0B', '#D97706', '#FEF08A', '#FDE047', '#FACC15', '#EAB308'],
  'Pinks': ['#EC4899', '#DB2777', '#BE185D', '#9F1239', '#F472B6', '#EC4899', '#DB2777', '#BE185D', '#FDA4AF', '#FB7185', '#F43F5E', '#E11D48'],
  'Teals': ['#14B8A6', '#0D9488', '#0F766E', '#115E59', '#2DD4BF', '#14B8A6', '#0D9488', '#0F766E', '#5EEAD4', '#2DD4BF', '#14B8A6', '#0D9488'],
  'Grays': ['#6B7280', '#4B5563', '#374151', '#1F2937', '#9CA3AF', '#6B7280', '#4B5563', '#374151', '#D1D5DB', '#9CA3AF', '#6B7280', '#4B5563'],
  'Gradients': [
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
  ]
};

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
  const [selectedCategory, setSelectedCategory] = useState<string>('Blues');
  const [showAllColors, setShowAllColors] = useState(false);
  const [activeTab, setActiveTab] = useState<'presets' | 'extended' | 'recent'>('presets');
  const modalRef = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  const categories = Object.keys(EXTENDED_COLORS);
  const allExtendedColors = Object.values(EXTENDED_COLORS).flat();

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

  useEffect(() => {
    if (showCustomInput && colorInputRef.current) {
      colorInputRef.current.focus();
    }
  }, [showCustomInput]);

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
        alert('Please enter a valid hex color (e.g., #FF5733 or FF5733)');
      }
    }
  };

  const extractColorFromGradient = (colorValue: string): string => {
    if (colorValue.startsWith('linear-gradient')) {
      const match = colorValue.match(/#[0-9A-Fa-f]{6}/);
      return match ? match[0] : '#666666';
    }
    return colorValue;
  };

  const scrollCategories = (direction: 'left' | 'right') => {
    const currentIndex = categories.indexOf(selectedCategory);
    if (direction === 'left' && currentIndex > 0) {
      setSelectedCategory(categories[currentIndex - 1]);
    } else if (direction === 'right' && currentIndex < categories.length - 1) {
      setSelectedCategory(categories[currentIndex + 1]);
    }
  };

  const displayColors = activeTab === 'presets'
    ? presetColors
    : activeTab === 'recent'
    ? recentColors
    : (showAllColors ? allExtendedColors : EXTENDED_COLORS[selectedCategory as keyof typeof EXTENDED_COLORS]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-4">
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'presets'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Presets
          </button>
          <button
            onClick={() => setActiveTab('extended')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'extended'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            More Colors
          </button>
          {recentColors.length > 0 && (
            <button
              onClick={() => setActiveTab('recent')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'recent'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Recent
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Category Navigation for Extended Colors */}
          {activeTab === 'extended' && !showAllColors && (
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => scrollCategories('left')}
                disabled={categories.indexOf(selectedCategory) === 0}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex-1 overflow-x-auto scrollbar-hide">
                <div className="flex gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                        selectedCategory === category
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => scrollCategories('right')}
                disabled={categories.indexOf(selectedCategory) === categories.length - 1}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Show All Toggle */}
          {activeTab === 'extended' && (
            <div className="mb-3 flex justify-end">
              <button
                onClick={() => setShowAllColors(!showAllColors)}
                className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
              >
                {showAllColors ? 'Show Categories' : 'Show All'}
              </button>
            </div>
          )}

          {/* Color Grid */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            {displayColors.map((color, index) => (
              <button
                key={`${color}-${index}`}
                onClick={() => handleColorSelect(color)}
                className={`h-12 rounded-lg border-2 transition-all hover:scale-105 ${
                  value === color
                    ? 'border-primary-500 ring-2 ring-primary-500 ring-offset-2 scale-105'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
                style={{ background: color }}
                title={extractColorFromGradient(color)}
              />
            ))}
          </div>

          {displayColors.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No recent colors yet
            </p>
          )}

          {/* Custom Color Input */}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            {showCustomInput ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-2.5 text-gray-500 dark:text-gray-400 text-sm">#</span>
                    <input
                      ref={colorInputRef}
                      type="text"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value.replace('#', ''))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCustomColorSubmit();
                        if (e.key === 'Escape') { setShowCustomInput(false); setCustomColor(''); }
                      }}
                      placeholder="FF5733"
                      maxLength={6}
                      className="input pl-8 text-sm"
                    />
                  </div>
                  <button
                    onClick={handleCustomColorSubmit}
                    className="btn-primary px-4 py-2 text-sm"
                  >
                    Add
                  </button>
                </div>
                <button
                  onClick={() => { setShowCustomInput(false); setCustomColor(''); }}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowCustomInput(true)}
                className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
              >
                <Plus className="w-4 h-4" />
                Custom Hex Color
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
