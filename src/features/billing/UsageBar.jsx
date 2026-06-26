import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

const UsageBar = ({ used, limit, label, unit = '' }) => {
    const isUnlimited = limit === 'Unlimited';
    const percentage = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);
    const isWarning = !isUnlimited && percentage >= 80;
    const isError = !isUnlimited && percentage >= 100;

    return (
        <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-v-main">{label}</span>
                <span className="text-v-muted">
                    {used} {isUnlimited ? '' : `/ ${limit}`} {unit}
                </span>
            </div>
            <div className="h-2 w-full bg-v-border rounded-full overflow-hidden">
                <div 
                    className={`h-full rounded-full transition-all duration-500 ${isError ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-blue-500'}`}
                    style={{ width: `${isUnlimited ? 100 : percentage}%` }}
                />
            </div>
            {isWarning && !isError && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-yellow-500">
                    <AlertCircle size={14} />
                    <span>Approaching limit. <Link to="/pricing" className="underline hover:text-yellow-600">Upgrade for more</Link></span>
                </div>
            )}
            {isError && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-red-500">
                    <AlertCircle size={14} />
                    <span>Limit reached. <Link to="/pricing" className="underline hover:text-red-600">Upgrade to unlock</Link></span>
                </div>
            )}
            {isUnlimited && (
                <div className="mt-2 text-xs text-v-muted">Unlimited access</div>
            )}
        </div>
    );
};

export default UsageBar;
