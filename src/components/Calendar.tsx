import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface CalendarProps {
    selectedDate: string;
    onSelectDate: (date: string) => void;
    entryDates: string[];
    onClose: () => void;
}

const Calendar: React.FC<CalendarProps> = ({ selectedDate, onSelectDate, entryDates, onClose }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));

    const daysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const firstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const renderDays = () => {
        const days = [];
        const totalDays = daysInMonth(currentMonth);
        const startDay = firstDayOfMonth(currentMonth);

        // Empty cells for previous month
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-10 w-10" />);
        }

        // Days of the month
        for (let i = 1; i <= totalDays; i++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
            const dateString = date.toISOString().split('T')[0];
            const isSelected = dateString === selectedDate;
            const hasEntry = entryDates.includes(dateString);
            const isToday = new Date().toDateString() === date.toDateString();

            days.push(
                <button
                    key={i}
                    onClick={() => onSelectDate(dateString)}
                    className={`
            h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium transition-all relative
            ${isSelected
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300'
                        }
            ${isToday && !isSelected ? 'border border-blue-500 text-blue-500' : ''}
          `}
                >
                    {i}
                    {hasEntry && !isSelected && (
                        <div className="absolute bottom-1 w-1 h-1 bg-green-500 rounded-full" />
                    )}
                </button>
            );
        }

        return days;
    };

    return (
        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl border border-gray-200 dark:border-zinc-700 p-4 w-[320px] animate-fade-in">
            <div className="flex items-center justify-between mb-4">
                <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-full">
                    <ChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />
                </button>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-full">
                    <ChevronRight size={20} className="text-gray-600 dark:text-gray-400" />
                </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                    <div key={day} className="h-8 w-10 flex items-center justify-center text-xs font-medium text-gray-400">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {renderDays()}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-700 flex justify-end">
                <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    Close
                </button>
            </div>
        </div>
    );
};

export default Calendar;
