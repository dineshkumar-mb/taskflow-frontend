import React, { useState } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { Bot, AlertTriangle, ShieldCheck, Activity, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

const AIRiskPanel = ({ projectId, projectName }) => {
    const [loading, setLoading] = useState(false);
    const [riskData, setRiskData] = useState(null);
    const [expanded, setExpanded] = useState(false);

    const runAnalysis = async () => {
        setLoading(true);
        setExpanded(true);
        try {
            const res = await axiosInstance.post('/ai/analyze-risk', { projectId });
            setRiskData(res.data);
        } catch (error) {
            console.error('Failed to run AI risk analysis', error);
        } finally {
            setLoading(false);
        }
    };

    const getHealthColor = (health) => {
        switch (health?.toLowerCase()) {
            case 'healthy': return 'text-green-500 bg-green-500/10 border-green-500/20';
            case 'at risk': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
            case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/20';
            default: return 'text-v-muted bg-v-component border-v-border';
        }
    };

    const getSeverityIcon = (severity) => {
        switch (severity?.toLowerCase()) {
            case 'high': return <AlertTriangle size={16} className="text-red-500" />;
            case 'medium': return <Activity size={16} className="text-yellow-500" />;
            case 'low': return <ShieldCheck size={16} className="text-blue-500" />;
            default: return <Activity size={16} className="text-v-muted" />;
        }
    };

    return (
        <div className="bg-v-primary border border-v-border rounded-xl shadow-sm overflow-hidden transition-all duration-300">
            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-v-secondary/50 transition-colors" onClick={() => setExpanded(!expanded)}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                        <Bot size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-v-main">AI Risk Analysis</h3>
                        <p className="text-xs text-v-muted truncate max-w-[200px]">Identify bottlenecks for {projectName}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {riskData && !loading && (
                        <div className={`px-2 py-1 rounded text-xs font-bold border ${getHealthColor(riskData.overallHealth)}`}>
                            {riskData.overallHealth}
                        </div>
                    )}
                    {expanded ? <ChevronUp size={16} className="text-v-muted" /> : <ChevronDown size={16} className="text-v-muted" />}
                </div>
            </div>

            {expanded && (
                <div className="border-t border-v-border p-4 bg-v-secondary/30">
                    {!riskData && !loading ? (
                        <div className="text-center py-6">
                            <Bot size={32} className="mx-auto text-indigo-500/50 mb-3" />
                            <p className="text-sm text-v-main mb-4">Run an AI analysis on your project's current state to identify hidden risks and bottlenecks.</p>
                            <button
                                onClick={(e) => { e.stopPropagation(); runAnalysis(); }}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                Run Analysis
                            </button>
                        </div>
                    ) : loading ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <Loader2 size={28} className="animate-spin text-indigo-500 mb-3" />
                            <p className="text-sm text-v-muted">Gemini is analyzing project data...</p>
                        </div>
                    ) : riskData ? (
                        <div className="space-y-4">
                            <div className="p-3 bg-v-primary rounded-lg border border-v-border text-sm text-v-main leading-relaxed">
                                {riskData.summary}
                            </div>
                            
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-v-muted uppercase tracking-wider">Identified Risks</h4>
                                {riskData.keyRisks?.length > 0 ? (
                                    riskData.keyRisks.map((risk, idx) => (
                                        <div key={idx} className="bg-v-primary rounded-lg border border-v-border p-3 flex gap-3">
                                            <div className="mt-0.5 shrink-0">
                                                {getSeverityIcon(risk.severity)}
                                            </div>
                                            <div>
                                                <h5 className="text-sm font-bold text-v-main mb-1">{risk.title}</h5>
                                                <p className="text-xs text-v-muted mb-2">{risk.description}</p>
                                                <div className="inline-block px-2 py-1 bg-blue-500/10 text-blue-500 text-xs rounded font-medium">
                                                    Action: {risk.suggestedAction}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-4 text-sm text-v-muted bg-v-primary rounded border border-dashed border-v-border">
                                        No significant risks detected!
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); runAnalysis(); }}
                                    className="text-xs font-medium text-indigo-500 hover:text-indigo-400"
                                >
                                    Rerun Analysis
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
};

export default AIRiskPanel;
