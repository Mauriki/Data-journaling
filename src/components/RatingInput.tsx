import React from 'react';
import { RatingValue } from '../types';

interface RatingInputProps {
  value: RatingValue | null;
  onChange: (val: RatingValue) => void;
}

const RatingInput: React.FC<RatingInputProps> = ({ value, onChange }) => {
  const options: { val: RatingValue; label: string }[] = [
    { val: -2, label: "Terrible" },
    { val: -1, label: "Bad" },
    { val: 0, label: "Neutral" },
    { val: 1, label: "Good" },
    { val: 2, label: "Excellent" },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
      <div className="flex items-center gap-1 sm:gap-2 bg-white rounded-xl border border-ui-border p-1.5 shadow-sm">
        {options.map((opt) => {
          const isSelected = value === opt.val;

          // Color logic
          let bgClass = 'hover:bg-gray-50 text-gray-500';
          if (isSelected) {
            if (opt.val > 0) bgClass = 'bg-green-100 text-green-700 shadow-sm';
            else if (opt.val < 0) bgClass = 'bg-red-100 text-red-700 shadow-sm';
            else bgClass = 'bg-gray-200 text-gray-800 shadow-sm';
          }

          return (
            <button
              key={opt.val}
              type="button"
              onClick={() => onChange(opt.val)}
              className={`
                relative flex flex-col items-center justify-center
                w-10 h-10 sm:w-12 sm:h-12 rounded-lg transition-all duration-200
                font-medium text-sm
                ${bgClass}
              `}
            >
              {opt.val > 0 ? `+${opt.val}` : opt.val}
            </button>
          );
        })}
      </div>

      <div className="h-6 text-sm font-medium text-ink-secondary animate-in fade-in">
        {value !== null ? options.find(o => o.val === value)?.label : <span className="opacity-50">Select a rating</span>}
      </div>
    </div>
  );
};

export default RatingInput;