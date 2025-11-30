import React from 'react';
import { RatingValue } from '../types';

interface RatingInputProps {
  value: RatingValue | null;
  onChange: (val: RatingValue) => void;
}

const RatingInput: React.FC<RatingInputProps> = ({ value, onChange }) => {
  const ratings: { value: RatingValue; label: string }[] = [
    { value: -2, label: "-2" },
    { value: -1, label: "-1" },
    { value: 0, label: "0" },
    { value: 1, label: "+1" },
    { value: 2, label: "+2" },
  ];

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1 bg-gray-100/50 dark:bg-white/5 p-1 rounded-lg">
        {ratings.map((r) => (
          <button
            key={r.value}
            onClick={() => onChange(r.value)}
            className={`
              w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-all duration-200
              ${value === r.value
                ? 'bg-white dark:bg-zinc-700 text-black dark:text-white shadow-sm scale-105'
                : 'text-gray-400 dark:text-gray-500 hover:bg-white/50 dark:hover:bg-white/10 hover:text-gray-600 dark:hover:text-gray-300'}
            `}
            title={`Rate as ${r.value}`}
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default React.memo(RatingInput);