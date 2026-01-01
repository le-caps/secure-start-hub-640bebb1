import React from 'react';

interface SliderControlProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  otherValues: number[];
}

export const SliderControl: React.FC<SliderControlProps> = ({
  label,
  value,
  onChange,
  otherValues,
}) => {
  const percentage = Math.round(value * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-sm font-semibold text-gray-900 dark:text-white">{percentage}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={percentage}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="w-full h-2 bg-gray-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
    </div>
  );
};

export default SliderControl;
