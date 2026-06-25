import React, { useState } from 'react';
import { Sparkles, Plus, Loader2 } from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';
import { toast } from 'react-toastify';

const AIIssueGenerator = ({ projectId, onIssueCreated }) => {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setLoading(true);

        try {
            const response = await axiosInstance.post('/ai/create-issue', { prompt, projectId });
            toast.success('AI magic! Issue created successfully.');
            setPrompt('');
            setIsExpanded(false);
            if (onIssueCreated) onIssueCreated(response.data);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to generate issue');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-v-secondary border border-v-border rounded-xl p-4 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-v-main font-semibold text-xs uppercase tracking-wide">
                    <Sparkles size={16} className="text-blue-500" />
                    <span>AI Assistant</span>
                </div>
                {!isExpanded && (
                    <button
                        onClick={() => setIsExpanded(true)}
                        className="text-[10px] font-bold text-blue-500 hover:text-blue-600 transition-colors uppercase"
                    >
                        Use Prompts
                    </button>
                )}
            </div>

            {isExpanded ? (
                <div className="space-y-3">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder='e.g., "Fix login and assign to me"'
                        className="w-full bg-v-primary border border-v-border rounded-lg p-3 text-sm text-v-main placeholder-v-muted focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        rows={2}
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="px-3 py-1.5 text-[10px] text-v-muted hover:bg-v-secondary rounded-lg font-bold uppercase transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleGenerate}
                            disabled={loading || !prompt.trim()}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 disabled:opacity-50 transition"
                        >
                            {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                            {loading ? 'Generating...' : 'Create with AI'}
                        </button>
                    </div>
                </div>
            ) : (
                <p className="text-[10px] text-v-muted italic truncate">
                    Try: "Add a task to update the dashboard icons"
                </p>
            )}
        </div>
    );
};

export default AIIssueGenerator;
