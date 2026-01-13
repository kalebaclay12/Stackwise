import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  label?: string;
  className?: string;
}

// Expanded icon collection organized by category
const ICON_CATEGORIES = {
  'Money & Finance': ['💰', '💵', '💴', '💶', '💷', '💳', '💸', '🪙', '💲', '🏦', '📈', '📉', '💹', '🤑'],
  'Home & Living': ['🏠', '🏡', '🏘️', '🏚️', '🏗️', '🏢', '🏬', '🏭', '🏛️', '⛪', '🕌', '🛋️', '🛏️', '🚪'],
  'Transportation': ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '✈️', '🚁', '🚂', '🚝', '🚄', '🚅', '🚆', '🚇', '🚊', '🚉', '⛴️', '🛳️', '⛵', '🚤'],
  'Food & Dining': ['🍔', '🍕', '🍗', '🍖', '🌭', '🍟', '🥪', '🌮', '🌯', '🥙', '🍝', '🍜', '🍲', '🍱', '🍛', '🍣', '🍤', '🥘', '🍰', '🎂', '🧁', '🍩', '🍪', '☕', '🍺', '🍻', '🥂', '🍷', '🥤'],
  'Shopping & Retail': ['🛒', '🛍️', '💍', '👗', '👔', '👕', '👚', '👖', '🧥', '👘', '👠', '👟', '👞', '🥾', '👜', '👝', '🎒', '💼', '🧳'],
  'Education': ['🎓', '📚', '📖', '📝', '✏️', '📐', '📏', '🖊️', '🖍️', '📌', '📍', '🖇️', '📎', '📋', '📁', '📂', '🗂️', '🎒', '🏫', '🎨'],
  'Health & Fitness': ['🏥', '💊', '💉', '🩺', '🩹', '🏋️', '🤸', '🧘', '🚴', '🏃', '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏓', '🏸', '🥊', '🥋', '⛳', '🏹'],
  'Entertainment': ['🎮', '🎯', '🎲', '🎰', '🎪', '🎭', '🎬', '🎤', '🎧', '🎼', '🎹', '🎸', '🎺', '🎷', '🥁', '🎻', '📺', '📻', '📱', '💻', '🎟️', '🎫'],
  'Travel & Vacation': ['✈️', '🏖️', '🏝️', '🗺️', '🧳', '🎒', '🏕️', '⛺', '🗿', '🗽', '🗼', '🏰', '🏯', '🎡', '🎢', '🎠', '⛲', '⛩️', '🕌', '🛕'],
  'Tech & Devices': ['📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '💾', '💿', '📀', '🎮', '🕹️', '📷', '📹', '🎥', '📞', '☎️', '📟', '📠', '📡', '🔋', '🔌', '💡'],
  'Goals & Targets': ['🎯', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '⭐', '🌟', '✨', '💫', '🔥', '⚡', '💪', '👍', '✅', '☑️', '✔️'],
  'Gifts & Special': ['🎁', '🎀', '🎈', '🎉', '🎊', '🎂', '💝', '💐', '🌹', '🌺', '🌸', '🌼', '🌻', '💮', '🏵️', '🎗️'],
  'Nature & Weather': ['☀️', '🌤️', '⛅', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '🌬️', '💨', '🌪️', '🌫️', '🌈', '☂️', '⛱️', '🌳', '🌲', '🌴', '🌵', '🍀', '🌿'],
  'Animals & Pets': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦗', '🕷️'],
  'Symbols & Misc': ['❤️', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💖', '💗', '💓', '💞', '💘', '💝', '⚠️', '🔒', '🔓', '🔑', '🗝️', '⏰', '⏱️', '⏲️', '⏳', '⌛', '📅', '📆', '🗓️', '📌', '📍', '🚩', '⛳']
};

const ALL_ICONS = Object.values(ICON_CATEGORIES).flat();

export default function IconPicker({ value, onChange, label = 'Icon', className = '' }: IconPickerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('Money & Finance');
  const [showAllIcons, setShowAllIcons] = useState(false);

  const displayIcons = showAllIcons ? ALL_ICONS : ICON_CATEGORIES[selectedCategory as keyof typeof ICON_CATEGORIES];
  const categories = Object.keys(ICON_CATEGORIES);

  const scrollCategories = (direction: 'left' | 'right') => {
    const currentIndex = categories.indexOf(selectedCategory);
    if (direction === 'left' && currentIndex > 0) {
      setSelectedCategory(categories[currentIndex - 1]);
    } else if (direction === 'right' && currentIndex < categories.length - 1) {
      setSelectedCategory(categories[currentIndex + 1]);
    }
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>

      {/* Category Navigation */}
      {!showAllIcons && (
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

      {/* Toggle View Button */}
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={() => setShowAllIcons(!showAllIcons)}
          className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
        >
          {showAllIcons ? `Show Categories` : `Show All (${ALL_ICONS.length})`}
        </button>
      </div>

      {/* Icon Grid with Horizontal Scroll */}
      <div className="relative">
        <div
          className="overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent pb-2"
          style={{ scrollbarWidth: 'thin' }}
        >
          <div
            className="inline-grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${Math.min(displayIcons.length, 15)}, minmax(2.5rem, 1fr))`,
              gridTemplateRows: showAllIcons ? 'repeat(auto-fill, 2.5rem)' : 'repeat(2, 2.5rem)',
              maxHeight: showAllIcons ? '300px' : 'auto',
              overflowY: showAllIcons ? 'auto' : 'visible',
              minWidth: '100%'
            }}
          >
            {displayIcons.map((icon, index) => (
              <button
                key={`${icon}-${index}`}
                type="button"
                onClick={() => onChange(icon)}
                className={`w-10 h-10 text-2xl rounded-lg border-2 transition-all hover:scale-110 flex items-center justify-center ${
                  value === icon
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 scale-110 shadow-md'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
                title={icon}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Scroll Indicators */}
        {!showAllIcons && displayIcons.length > 10 && (
          <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-white dark:from-gray-800 to-transparent pointer-events-none" />
        )}
      </div>

      {/* Selected Icon Preview */}
      {value && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 text-3xl rounded-lg border-2 border-primary-500 bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
              {value}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Selected Icon</p>
          </div>
        </div>
      )}
    </div>
  );
}
