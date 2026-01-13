import { useState } from 'react';
import { X, Smile, Search } from 'lucide-react';

interface IconPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  onChange: (icon: string) => void;
  title?: string;
}

// All available icons shown upfront - organized but displayed together
const ALL_ICONS = [
  // Money & Finance
  '💰', '💵', '💴', '💶', '💷', '💳', '💸', '🪙', '💲', '🏦', '📈', '📉', '💹', '🤑',
  // Home & Living
  '🏠', '🏡', '🏘️', '🏚️', '🏗️', '🏢', '🏬', '🏭', '🏛️', '⛪', '🕌', '🛋️', '🛏️', '🚪',
  // Transportation
  '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '✈️', '🚁', '🚂', '🚝', '🚄', '🚅', '🚆', '🚇', '🚊', '🚉', '⛴️', '🛳️', '⛵', '🚤',
  // Food & Dining
  '🍔', '🍕', '🍗', '🍖', '🌭', '🍟', '🥪', '🌮', '🌯', '🥙', '🍝', '🍜', '🍲', '🍱', '🍛', '🍣', '🍤', '🥘', '🍰', '🎂', '🧁', '🍩', '🍪', '☕', '🍺', '🍻', '🥂', '🍷', '🥤',
  // Shopping & Retail
  '🛒', '🛍️', '💍', '👗', '👔', '👕', '👚', '👖', '🧥', '👘', '👠', '👟', '👞', '🥾', '👜', '👝', '🎒', '💼', '🧳',
  // Education
  '🎓', '📚', '📖', '📝', '✏️', '📐', '📏', '🖊️', '🖍️', '📌', '📍', '🖇️', '📎', '📋', '📁', '📂', '🗂️', '🏫', '🎨',
  // Health & Fitness
  '🏥', '💊', '💉', '🩺', '🩹', '🏋️', '🤸', '🧘', '🚴', '🏃', '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏓', '🏸', '🥊', '🥋', '⛳', '🏹',
  // Entertainment
  '🎮', '🎯', '🎲', '🎰', '🎪', '🎭', '🎬', '🎤', '🎧', '🎼', '🎹', '🎸', '🎺', '🎷', '🥁', '🎻', '📺', '📻', '📱', '💻', '🎟️', '🎫',
  // Travel & Vacation
  '🏖️', '🏝️', '🗺️', '🏕️', '⛺', '🗿', '🗽', '🗼', '🏰', '🏯', '🎡', '🎢', '🎠', '⛲', '⛩️', '🛕',
  // Tech & Devices
  '⌨️', '🖥️', '🖨️', '🖱️', '💾', '💿', '📀', '🕹️', '📷', '📹', '🎥', '📞', '☎️', '📟', '📠', '📡', '🔋', '🔌', '💡',
  // Goals & Targets
  '🎯', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '⭐', '🌟', '✨', '💫', '🔥', '⚡', '💪', '👍', '✅', '☑️', '✔️',
  // Gifts & Special
  '🎁', '🎀', '🎈', '🎉', '🎊', '💝', '💐', '🌹', '🌺', '🌸', '🌼', '🌻', '💮', '🏵️', '🎗️',
  // Nature & Weather
  '☀️', '🌤️', '⛅', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '🌬️', '💨', '🌪️', '🌫️', '🌈', '☂️', '⛱️', '🌳', '🌲', '🌴', '🌵', '🍀', '🌿',
  // Animals & Pets
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦗', '🕷️',
  // Symbols & Misc
  '❤️', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💖', '💗', '💓', '💞', '💘', '⚠️', '🔒', '🔓', '🔑', '🗝️', '⏰', '⏱️', '⏲️', '⏳', '⌛', '📅', '📆', '🗓️', '🚩', '🎌'
];

export default function IconPickerModal({
  isOpen,
  onClose,
  value,
  onChange,
  title = 'Choose Icon'
}: IconPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const handleIconSelect = (icon: string) => {
    onChange(icon);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Simple search filter - searches the icon itself
  const displayIcons = searchQuery
    ? ALL_ICONS.filter(() => {
        // You could add more sophisticated searching here if needed
        // For now, just show all icons if searching (could filter by keywords)
        return true;
      })
    : ALL_ICONS;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
              <Smile className="w-5 h-5 text-primary-600 dark:text-primary-400" />
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

        {/* Search Bar */}
        <div className="p-5 pb-3 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search icons..."
              className="input pl-10 text-sm"
            />
          </div>
        </div>

        {/* Icon Grid */}
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-8 sm:grid-cols-10 gap-2">
            {displayIcons.map((icon, index) => (
              <button
                key={`${icon}-${index}`}
                type="button"
                onClick={() => handleIconSelect(icon)}
                className={`aspect-square text-3xl rounded-xl border-2 transition-all hover:scale-110 active:scale-95 flex items-center justify-center ${
                  value === icon
                    ? 'border-primary-600 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-300 dark:ring-primary-600 scale-105'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                title={icon}
              >
                {icon}
              </button>
            ))}
          </div>

          {displayIcons.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-12">
              No icons found
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
