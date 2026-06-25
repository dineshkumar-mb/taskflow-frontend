import React, { useState } from 'react';
import { Calendar, CheckCircle2, TrendingUp, Loader2, Sparkles } from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';

const AISprintPlanner = ({ projectId, onApplyPlan }) => {
    const [loading, setLoading] = useState(false);
    const [plan, setPlan] = useState(null);

    const fetchPlan = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.post('/ai/sprint-plan', { projectId });
            setPlan(response.data);
        } catch (error) {
            console.error('Failed to get plan', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-v-primary border border-v-border rounded-xl shadow-sm overflow-hidden mb-4 transition-colors">
            <div className="bg-blue-600/10 p-4 border-b border-v-border flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm text-v-main uppercase tracking-wider">
                    <Sparkles size={18} className="text-blue-500" />
                    <span>AI Sprint Planner</span>
                </div>
                <button
                    onClick={fetchPlan}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition hover:bg-blue-700 active:scale-95 disabled:opacity-50"
                    disabled={loading}
                >
                    {loading ? 'Analyzing...' : 'Generate Plan'}
                </button>
            </div>

            <div className="p-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                        <Loader2 size={32} className="text-blue-500 animate-spin" />
                        <p className="text-v-muted text-sm font-medium italic">Analyzing backlog velocity...</p>
                    </div>
                ) : plan ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-v-secondary p-4 rounded-xl border border-v-border">
                                <p className="text-[10px] text-v-muted font-bold uppercase mb-1">Recommended</p>
                                <p className="text-2xl font-black text-v-main">{plan.recommendations.length}</p>
                            </div>
                            <div className="bg-v-secondary p-4 rounded-xl border border-v-border">
                                <p className="text-[10px] text-v-muted font-bold uppercase mb-1">Total Points</p>
                                <p className="text-2xl font-black text-v-main">{plan.totalPoints}</p>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-v-main mb-3 flex items-center gap-2 uppercase tracking-wide">
                                <CheckCircle2 size={16} className="text-emerald-500" />
                                AI Priority Selection
                            </h4>
                            <div className="space-y-2">
                                {plan.recommendations.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 bg-v-secondary/50 rounded-lg border border-v-border">
                                        <div className="h-6 w-6 rounded-full bg-blue-600/10 text-blue-600 text-[10px] flex items-center justify-center font-bold border border-blue-600/20">
                                            {idx + 1}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold text-v-main truncate">{item.title}</p>
                                            <p className="text-[10px] text-v-muted italic truncate">{item.reason}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={() => onApplyPlan(plan)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-blue-500/10 transition active:scale-[0.98]"
                        >
                            Apply AI Recommendations
                        </button>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <Calendar size={48} className="mx-auto text-v-muted opacity-20 mb-4" />
                        <p className="text-xs text-v-muted">Analyze project backlog and generate an agile sprint plan.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AISprintPlanner;
