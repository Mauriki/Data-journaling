import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CalendarProps {
    selectedDate: string;
    onSelectDate: (date: string) => void;
    entryDates: string[];
    onClose: () => void;
}

const Calendar: React.FC<CalendarProps> = ({ selectedDate, onSelectDate, entryDates, onClose }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));
    const [direction, setDirection] = useState(0);

    const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const handlePrevMonth = () => {
        setDirection(-1);
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setDirection(1);
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const handleDateClick = (day: number) => {
        const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        // Adjust for timezone offset to ensure correct YYYY-MM-DD string
        const offset = newDate.getTimezoneOffset();
        const adjustedDate = new Date(newDate.getTime() - (offset * 60 * 1000));
        onSelectDate(adjustedDate.toISOString().split('T')[0]);
        onClose();
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
            const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i).toLocaleDateString('en-CA'); // YYYY-MM-DD
            const isSelected = dateStr === selectedDate;
            const hasEntry = entryDates.includes(dateStr);
            const isToday = dateStr === new Date().toLocaleDateString('en-CA');

            days.push(
                <button
                    key={i}
                    onClick={() => handleDateClick(i)}
                    className={`
            relative h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200
            ${isSelected ? 'bg-black text-white dark:bg-white dark:text-black shadow-lg scale-105' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'}
            ${isToday && !isSelected ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}
          `}
                >
                    {i}
                    {hasEntry && !isSelected && (
                        <div className="absolute bottom-1.5 w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500" />
                    )}
                    {hasEntry && isSelected && (
                        <div className="absolute bottom-1.5 w-1 h-1 rounded-full bg-white/50 dark:bg-black/50" />
                    )}
                </button>
            );
        }
        return days;
    };

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 20 : -20,
            opacity: 0
        }),
        center: {
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            x: direction > 0 ? -20 : 20,
            opacity: 0
        })
    };

    return (
        <div className="p-4 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-white/10 w-[280px] sm:w-[300px] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6 px-2">
                <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
                    <ChevronLeft className="w-5 h-5 text-gray-500" />
                </button>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            <div className="grid grid-cols-7 mb-2 text-center">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                    <div key={day} className="text-xs font-bold text-gray-400 uppercase tracking-wider h-10 flex items-center justify-center">
                        {day}
                    </div>
                ))}
            </div>

            <div className="relative h-[280px] overflow-hidden">
                <AnimatePresence initial={false} custom={direction} mode="wait">
                    <motion.div
                        key={currentMonth.toISOString()}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="grid grid-cols-7 place-items-center absolute w-full"
                    >
                        {renderDays()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Calendar;
