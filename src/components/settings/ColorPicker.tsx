import React, { FC } from 'react';

const COLORS = [
  "#4f46e5", // Indigo
  "#ef4444", // Red
  "#22c55e", // Green
  "#3b82f6", // Blue
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#06b6d4", // Cyan
  "#1f2937", // Gray
];

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
}

const ColorPicker: FC<ColorPickerProps> = ({ color, onChange, label }) => {
  return (
    <div className="space-y-3">
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <div className="flex items-center gap-3 flex-wrap">
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className={`w-10 h-10 rounded-lg transition-all transform hover:scale-110 active:scale-95 shadow-sm hover:shadow-md ${
              color === c
                ? "ring-2 ring-offset-2 dark:ring-offset-gray-800 ring-gray-800 dark:ring-white scale-110"
                : "ring-1 ring-gray-300 dark:ring-gray-600"
            }`}
            style={{ backgroundColor: c }}
            aria-label={`Select color ${c}`}
            title={c}
          />
        ))}
        <div className="flex items-center gap-2 ml-2">
          <label
            htmlFor="custom-color"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Custom:
          </label>
          <input
            id="custom-color"
            type="color"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="w-10 h-10 p-1 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer transition-all hover:border-brand-primary dark:hover:border-brand-primary"
          />
        </div>
      </div>
    </div>
  );
};

export { ColorPicker };
export default ColorPicker;
