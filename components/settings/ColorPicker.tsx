import React, { FC } from 'react';

const COLORS = [
  '#4f46e5', // Indigo
  '#ef4444', // Red
  '#22c55e', // Green
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
];

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

const ColorPicker: FC<ColorPickerProps> = ({ color, onChange }) => {
  return (
    <div className="flex items-center gap-2 mt-1">
      {COLORS.map(c => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`w-8 h-8 rounded-full transition-transform transform hover:scale-110 ${color === c ? 'ring-2 ring-offset-2 dark:ring-offset-dark-brand-surface ring-gray-800 dark:ring-white' : ''}`}
          style={{ backgroundColor: c }}
          aria-label={`Select color ${c}`}
        />
      ))}
      <input
        type="color"
        value={color}
        onChange={e => onChange(e.target.value)}
        className="w-8 h-8 p-0 border-none rounded-full cursor-pointer bg-transparent"
        style={{'--color': color} as any}
      />
    </div>
  );
};

export default ColorPicker;
