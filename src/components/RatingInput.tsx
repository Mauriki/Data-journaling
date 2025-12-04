import React from 'react';
import { RatingValue } from '../types';

interface RatingInputProps {
    value: RatingValue | null;
    onChange: (value: RatingValue) => void;
}

const RatingInput: React.FC<RatingInputProps> = ({ value, onChange }) => {
    const ratings: { value: RatingValue; label: string; color: string }[] = [
        { value: -2, label: '-2', color: 'bg-red-100 text-red-600 border-red-200 hover:bg-red-200' },
        { value: -1, label: '-1', color: 'bg-orange-100 text-orange-600 border-orange-200 hover:bg-orange-200' },
        { value: 0, label: '0', color: 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200' },
        { value: 1, label: '+1', color: 'bg-green-100 text-green-600 border-green-200 hover:bg-green-200' },
        { value: 2, label: '+2', color: 'bg-emerald-100 text-emerald-600 border-emerald-200 hover:bg-emerald-200' },
    ];

    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-apple-gray dark:text-gray-400 uppercase tracking-wider text-[0.7rem]">
                How was your day?
            </label>
            <div className="flex items-center justify-between gap-2">
                {ratings.map((rating) => {
                    const isSelected = value === rating.value;
                    return (
                        <button
                            key={rating.value}
                            onClick={() => onChange(rating.value)}
                            className={`
                                flex-1 flex items-center justify-center py-2 px-3 rounded-xl border transition-all duration-200
                                ${isSelected
                                    ? `${rating.color} ring-2 ring-offset-1 ring-offset-white dark:ring-offset-zinc-900 ring-stone-200 dark:ring-zinc-700 scale-105 shadow-sm`
                                    : 'bg-white dark:bg-zinc-800 border-stone-100 dark:border-zinc-700 text-stone-400 hover:bg-stone-50 dark:hover:bg-zinc-700/50 hover:scale-105'
                                }
                            `}
                            type="button"
                        >
                            <span className="text-base font-bold">{rating.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default RatingInput;
