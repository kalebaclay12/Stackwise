import { useState } from 'react';
import { X, Smile, Search } from 'lucide-react';

interface IconPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  onChange: (icon: string) => void;
  title?: string;
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

export default function IconPickerModal({
  isOpen,
  onClose,
  value,
  onChange,
  title = 'Choose Icon'
}: IconPickerModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('Money & Finance');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllIcons, setShowAllIcons] = useState(false);

  if (!isOpen) return null;

  const categories = Object.keys(ICON_CATEGORIES);

  const handleIconSelect = (icon: string) => {
    onChange(icon);
    onClose();
  };

  // Filter icons based on search
  const getDisplayIcons = () => {
    if (searchQuery) {
      return ALL_ICONS.filter((icon) => {
        const categoryEntry = Object.entries(ICON_CATEGORIES).find(([_, icons]) =>
          icons.includes(icon)
        );
        return categoryEntry && categoryEntry[0].toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    if (showAllIcons) {
      return ALL_ICONS;
    }

    return ICON_CATEGORIES[selectedCategory as keyof typeof ICON_CATEGORIES];
  };

  const displayIcons = getDisplayIcons();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smile className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search categories..."
              className="input pl-10 text-sm"
            />
          </div>
        </div>

        {/* Category Tabs */}
        {!searchQuery && (
          <div className="flex gap-2 overflow-x-auto px-4 py-3 border-b border-gray-200 dark:border-gray-700 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
            <button
              onClick={() => setShowAllIcons(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                showAllIcons
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              All ({ALL_ICONS.length})
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category);
                  setShowAllIcons(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCategory === category && !showAllIcons
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {/* Icon Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {displayIcons.length > 0 ? (
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
              {displayIcons.map((icon, index) => (
                <button
                  key={`${icon}-${index}`}
                  onClick={() => handleIconSelect(icon)}
                  className={`aspect-square text-2xl sm:text-3xl rounded-lg border-2 transition-all hover:scale-110 flex items-center justify-center ${
                    value === icon
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 scale-110 shadow-md'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  title={icon}
                >
                  {icon}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-12">
              No icons found for "{searchQuery}"
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{displayIcons.length} icons available</span>
            {value && (
              <div className="flex items-center gap-2">
                <span>Selected:</span>
                <span className="text-2xl">{value}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
