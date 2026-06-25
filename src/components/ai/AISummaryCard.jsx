import React, { useState } from 'react';
import { FileText, ListChecks, ChevronDown, ChevronUp, Loader2, Wand2 } from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';

const AISummaryCard = ({ title, description }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(true);

    const generateSummary = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.post('/ai/summary', { title, description });
            setData(response.data);
        } catch (error) {
            console.error('Failed to summarize', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-v-secondary/50 rounded-xl border border-v-border overflow-hidden mb-4 transition-all">
            <div
                className="px-4 py-2 border-b border-v-border flex items-center justify-between cursor-pointer hover:bg-v-secondary/80"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-2 text-[10px] font-bold text-v-muted uppercase tracking-wider">
                    <Wand2 size={14} className="text-v-muted" />
                    <span>AI Insight</span>
                </div>
                <div className="flex items-center gap-2">
                    {loading && <Loader2 size={12} className="animate-spin text-v-muted" />}
                    {expanded ? <ChevronUp size={16} className="text-v-muted" /> : <ChevronDown size={16} className="text-v-muted" />}
                </div>
            </div>

            {expanded && (
                <div className="p-4">
                    {data ? (
                        <div className="space-y-4 animate-in fade-in duration-300">
                            <div>
                                <div className="flex items-center gap-2 text-[10px] font-semibold text-v-main mb-1">
                                    <FileText size={12} className="text-blue-500" />
                                    TL;DR Summary
                                </div>
                                <p className="text-xs text-v-muted leading-relaxed italic border-l-2 border-blue-500/30 pl-3">
                                    "{data.summary}"
                                </p>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 text-[10px] font-semibold text-v-main mb-2">
                                    <ListChecks size={12} className="text-emerald-500" />
                                    Key Action Items
                                </div>
                                <ul className="space-y-1.5">
                                    {data.actionItems.map((item, idx) => (
                                        <li key={idx} className="text-[10px] text-v-muted flex items-start gap-2">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <p className="text-[10px] text-v-muted mb-3 italic">Generate key insights and tasks from this issue.</p>
                            <button
                                onClick={(e) => { e.stopPropagation(); generateSummary(); }}
                                disabled={loading}
                                className="bg-v-primary border border-v-border text-v-main px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-v-secondary transition flex items-center gap-2 mx-auto"
                            >
                                <Sparkles size={12} />
                                Generate AI Summary
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const Sparkles = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        <path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" />
    </svg>
);

export default AISummaryCard;
