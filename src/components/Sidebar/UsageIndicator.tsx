import React, { useState, useEffect } from 'react';
import { Clock, Zap } from 'lucide-react';
import { getUsageData, formatSecondsToMinutes } from '../../services/usageService';

const UsageIndicator: React.FC = () => {
    const [usedSeconds, setUsedSeconds] = useState(0);
    const [percentage, setPercentage] = useState(0);
    const TRIAL_LIMIT = 15 * 60; // 15 minutes

    useEffect(() => {
        loadUsage();
    }, []);

    const loadUsage = async () => {
        const usage = await getUsageData();
        setUsedSeconds(usage.transcriptionSeconds);
        const pct = Math.min(100, (usage.transcriptionSeconds / TRIAL_LIMIT) * 100);
        setPercentage(pct);
    };

    const remainingSeconds = Math.max(0, TRIAL_LIMIT - usedSeconds);
    const isLowOnTime = remainingSeconds < 180; // Less than 3 minutes

    return (
        <div className="px-4 py-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Zap className={`w-4 h-4 ${isLowOnTime ? 'text-amber-500' : 'text-blue-500'}`} />
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        AI Transcription
                    </span>
                </div>
                <Clock className="w-3 h-3 text-gray-400" />
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                <div
                    className={`h-full transition-all duration-500 ${percentage > 80
                            ? 'bg-gradient-to-r from-amber-500 to-red-500'
                            : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                        }`}
                    style={{ width: `${percentage}%` }}
                />
            </div>

            {/* Usage Text */}
            <div className="flex items-center justify-between text-xs">
                <span className={`font-medium ${isLowOnTime ? 'text-amber-600 dark:text-amber-400' : 'text-gray-600 dark:text-gray-400'}`}>
                    {formatSecondsToMinutes(remainingSeconds)} remaining
                </span>
                <span className="text-gray-500 dark:text-gray-500">
                    {formatSecondsToMinutes(usedSeconds)} / 15:00
                </span>
            </div>

            {/* Warning if low */}
            {isLowOnTime && remainingSeconds > 0 && (
                <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
                    ⚠️ Running low - Upgrade soon
                </div>
            )}

            {/* Trial ended */}
            {remainingSeconds === 0 && (
                <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">
                    Trial ended - Upgrade to continue
                </div>
            )}
        </div>
    );
};

export default UsageIndicator;
