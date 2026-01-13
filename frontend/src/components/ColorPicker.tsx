import { useState, useEffect, useRef } from 'react';
import { Palette, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  presetColors: string[];
  label?: string;
  className?: string;
  showExpanded?: boolean;
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

// Helper function to get storage key based on preset colors
const getStorageKey = (presetColors: string[]): string => {
  // Use first color as identifier to separate checking/savings/stacks
  const firstColor = presetColors[0] || '';
  if (firstColor.includes('667eea') || firstColor.includes('3B82F6')) {
    return 'colorPicker_recent_checking';
  } else if (firstColor.includes('10b981') || firstColor.includes('34d399')) {
    return 'colorPicker_recent_savings';
  } else {
    return 'colorPicker_recent_stacks';
  }
};

export default function ColorPicker({
  value,
  onChange,
  presetColors,
  label = 'Color',
  className = '',
  showExpanded = false
}: ColorPickerProps) {
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customColor, setCustomColor] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Blues');
  const [showAllColors, setShowAllColors] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);

  const categories = Object.keys(EXTENDED_COLORS);
  const allExtendedColors = Object.values(EXTENDED_COLORS).flat();

  // Load recent colors from localStorage on mount
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

  // Save color to recent colors
  const saveRecentColor = (color: string) => {
    const storageKey = getStorageKey(presetColors);
    setRecentColors((prev) => {
      // Remove if already exists
      const filtered = prev.filter((c) => c !== color);
      // Add to beginning
      const updated = [color, ...filtered].slice(0, MAX_RECENT_COLORS);
      // Save to localStorage
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
  };

  const handleColorSelect = (color: string) => {
    onChange(color);
    saveRecentColor(color);
  };

  const handleCustomColorSubmit = () => {
    if (customColor) {
      let formattedColor = customColor.trim();

      // If it's a hex color without #, add it
      if (/^[0-9A-Fa-f]{6}$/.test(formattedColor)) {
        formattedColor = `#${formattedColor}`;
      }

      // Validate hex color format
      if (/^#[0-9A-Fa-f]{6}$/.test(formattedColor)) {
        handleColorSelect(formattedColor);
        setCustomColor('');
        setShowCustomInput(false);
      } else {
        alert('Please enter a valid hex color (e.g., #FF5733 or FF5733)');
      }
    }
  };

  const handleCustomColorKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCustomColorSubmit();
    } else if (e.key === 'Escape') {
      setShowCustomInput(false);
      setCustomColor('');
    }
  };

  // Auto-focus custom input when shown
  useEffect(() => {
    if (showCustomInput && colorInputRef.current) {
      colorInputRef.current.focus();
    }
  }, [showCustomInput]);

  // Extract color from gradient if needed
  const extractColorFromGradient = (colorValue: string): string => {
    if (colorValue.startsWith('linear-gradient')) {
      // Extract first color from gradient
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

  const displayColors = showExpanded
    ? (showAllColors ? allExtendedColors : EXTENDED_COLORS[selectedCategory as keyof typeof EXTENDED_COLORS])
    : presetColors;

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>

      {/* Category Navigation for Expanded Mode */}
      {showExpanded && !showAllColors && (
        <div className="flex items-center gap-2 mb-3">
          <button
            type="button"
            onClick={() => scrollCategories('left')}
            disabled={categories.indexOf(selectedCategory) === 0}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous category"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>

          <div className="flex-1 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    selectedCategory === category
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => scrollCategories('right')}
            disabled={categories.indexOf(selectedCategory) === categories.length - 1}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Next category"
          >
            <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      )}

      {/* Toggle View Button for Expanded Mode */}
      {showExpanded && (
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={() => setShowAllColors(!showAllColors)}
            className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            {showAllColors ? `Show Categories` : `Show All Colors`}
          </button>
        </div>
      )}

      {/* Color Grid with Horizontal Scroll */}
      <div className="relative">
        <div
          className="overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent pb-2"
          style={{ scrollbarWidth: 'thin' }}
        >
          <div
            className={`inline-grid gap-2 ${showExpanded ? '' : 'grid-cols-5'}`}
            style={showExpanded ? {
              gridTemplateColumns: `repeat(${Math.min(displayColors.length, 12)}, minmax(2.5rem, 1fr))`,
              gridTemplateRows: showAllColors ? 'repeat(auto-fill, 2.5rem)' : 'repeat(2, 2.5rem)',
              maxHeight: showAllColors ? '200px' : 'auto',
              overflowY: showAllColors ? 'auto' : 'visible',
              minWidth: '100%'
            } : {}}
          >
            {displayColors.map((color, index) => (
              <button
                key={`${color}-${index}`}
                type="button"
                onClick={() => handleColorSelect(color)}
                className={`h-12 rounded-lg border-2 transition-all hover:scale-105 ${
                  value === color
                    ? 'border-gray-900 dark:border-white ring-2 ring-offset-2 ring-gray-900 dark:ring-white scale-105'
                    : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                style={{ background: color }}
                title={extractColorFromGradient(color)}
              />
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        {showExpanded && !showAllColors && displayColors.length > 10 && (
          <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-white dark:from-gray-800 to-transparent pointer-events-none" />
        )}
      </div>

      {/* Recent Colors */}
      {recentColors.length > 0 && (
        <div className="mb-3 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Palette className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Recent Colors</span>
          </div>
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent pb-2">
            <div className="flex gap-2" style={{ minWidth: 'max-content' }}>
              {recentColors.map((color, index) => (
                <button
                  key={`${color}-${index}`}
                  type="button"
                  onClick={() => handleColorSelect(color)}
                  className={`h-10 w-10 flex-shrink-0 rounded-lg border-2 transition-all hover:scale-105 ${
                    value === color
                      ? 'border-gray-900 dark:border-white ring-2 ring-offset-2 ring-gray-900 dark:ring-white scale-105'
                      : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  style={{ background: color }}
                  title={`Recent: ${extractColorFromGradient(color)}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Custom Color Input */}
      {showCustomInput ? (
        <div className="flex gap-2 items-center">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-2.5 text-gray-500 dark:text-gray-400 text-sm">#</span>
            <input
              ref={colorInputRef}
              type="text"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value.replace('#', ''))}
              onKeyDown={handleCustomColorKeyDown}
              placeholder="FF5733"
              maxLength={6}
              className="input pl-8 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleCustomColorSubmit}
            className="btn-primary px-4 py-2 text-sm"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setShowCustomInput(false);
              setCustomColor('');
            }}
            className="btn-secondary px-4 py-2 text-sm"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowCustomInput(true)}
          className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Custom Color
        </button>
      )}

      {/* Selected Color Preview */}
      {value && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div
              className="w-16 h-16 rounded-lg border-2 border-gray-300 dark:border-gray-600 shadow-sm"
              style={{ background: value }}
            />
            <div className="flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">Selected</p>
              <p className="text-sm font-mono text-gray-900 dark:text-white">
                {extractColorFromGradient(value)}
              </p>
              <button
                type="button"
                onClick={() => onChange('')}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mt-1"
              >
                Clear selection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
