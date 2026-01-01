import React from "react";

interface WeightSliderProps {
  label: string;
  value: number; // between 0 and 1
  onChange: (val: number) => void;
}

export const WeightSlider: React.FC<WeightSliderProps> = ({
  label,
  value,
  onChange,
}) => {
  // Convert internal value (0–1) to displayed percentage
  const percent = Math.round(value * 100);

  const updateFromPercent = (p: number) => {
    const clamped = Math.min(Math.max(p, 0), 100);
    onChange(clamped / 100);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <div className="flex items-center gap-3">
        {/* Slider track */}
        <div
          className="relative h-2 w-full rounded-full bg-gray-200 dark:bg-zinc-800 cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const pct = Math.min(Math.max(x / rect.width, 0), 1);
            onChange(Number(pct.toFixed(2)));
          }}
        >
          <div
            className="absolute h-2 rounded-full bg-blue-600 transition-all"
            style={{ width: `${value * 100}%` }}
          />
        </div>

        {/* Percent input */}
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={percent}
            min={0}
            max={100}
            onChange={(e) => updateFromPercent(Number(e.target.value))}
            className="w-16 px-2 py-1 text-sm rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">%</span>
        </div>
      </div>
    </div>
  );
};

export default WeightSlider;
