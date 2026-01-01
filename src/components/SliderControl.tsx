import React from "react";

interface SliderControlProps {
  label: string;
  value: number; // 0–1
  onChange: (v: number) => void;
  otherValues: number[]; // used to ensure total stays <= 1
}

export const SliderControl: React.FC<SliderControlProps> = ({
  label,
  value,
  onChange,
  otherValues,
}) => {
  const totalOthers = otherValues.reduce((a, b) => a + b, 0);
  // Maximum allowed so total never exceeds 1
  const max = Math.max(0, 1 - totalOthers);

  const handleSlider = (v: number) => {
    onChange(Math.min(v, max));
  };

  const handleInput = (v: number) => {
    onChange(Math.min(v / 100, max));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      {/* Slider */}
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={max}
          step={0.01}
          value={value}
          onChange={(e) => handleSlider(Number(e.target.value))}
          className="flex-1 appearance-none h-2 rounded-full bg-gray-200 dark:bg-zinc-700 cursor-pointer accent-blue-600"
        />
        {/* Editable percentage */}
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={0}
            max={max * 100}
            value={Math.round(value * 100)}
            onChange={(e) => handleInput(Number(e.target.value))}
            className="w-14 px-2 py-1 text-sm rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white"
          />
          <span className="text-xs text-gray-500">%</span>
        </div>
      </div>
    </div>
  );
};

export default SliderControl;
