import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Sparkles, Loader2, X } from 'lucide-react';
import axios from 'axios';
import { createSprint } from '../sprint/sprintSlice';
import { reorderIssues, getIssues } from '../board/boardSlice';

const AISprintPlannerModal = ({ isOpen, onClose, backlogIssues }) => {
    const { projectId } = useParams();
    const dispatch = useDispatch();
    const { sprints } = useSelector(state => state.sprint);
    const [isLoading, setIsLoading] = useState(false);
    const [plan, setPlan] = useState(null);
    const [isApplying, setIsApplying] = useState(false);

    if (!isOpen) return null;

    const handleGeneratePlan = async () => {
        if (backlogIssues.length === 0) {
            toast.error("Backlog is empty. Add issues to the backlog first.");
            return;
        }

        setIsLoading(true);
        try {
            const { data } = await axios.post(`/api/ai/sprint-plan`, {
                projectId,
                backlogIssues
            });
            setPlan(data);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to generate sprint plan');
        } finally {
            setIsLoading(false);
        }
    };

    const handleApplyPlan = async () => {
        if (!plan || !plan.suggestedIssues || plan.suggestedIssues.length === 0) return;
        setIsApplying(true);
        try {
            // Create a new sprint
            const sprintName = `Sprint ${sprints.length + 1} (AI Planned)`;
            const sprintResult = await dispatch(createSprint({ project: projectId, name: sprintName })).unwrap();
            const newSprintId = sprintResult._id;

            // Move suggested issues into the new sprint
            for (let i = 0; i < plan.suggestedIssues.length; i++) {
                const issueId = plan.suggestedIssues[i];
                const issue = backlogIssues.find(b => b._id === issueId);
                if (issue) {
                    await dispatch(reorderIssues({
                        issueId,
                        status: issue.status || 'todo',
                        position: i,
                        projectId,
                        sprintId: newSprintId
                    })).unwrap();
                }
            }

            toast.success("Sprint planned and issues assigned successfully!");
            dispatch(getIssues(projectId));
            onClose();
        } catch (error) {
            toast.error(error.message || "Failed to apply the sprint plan");
        } finally {
            setIsApplying(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-v-primary border border-v-border shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-v-border px-6 py-4">
                    <h2 className="text-xl font-bold text-v-main flex items-center gap-2">
                        <Sparkles className="text-purple-500" size={24} />
                        AI Sprint Planner
                    </h2>
                    <button onClick={onClose} className="text-v-muted hover:text-v-main transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {!plan && !isLoading && (
                        <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
                            <Sparkles className="text-v-muted opacity-50" size={48} />
                            <h3 className="text-lg font-semibold text-v-main">Let AI plan your next sprint</h3>
                            <p className="text-v-muted text-sm max-w-md">
                                The AI will analyze your backlog, consider issue priorities, story points, and recommend the best set of issues to tackle next.
                            </p>
                            <button
                                onClick={handleGeneratePlan}
                                className="mt-4 flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/20"
                            >
                                <Sparkles size={16} /> Generate Plan
                            </button>
                        </div>
                    )}

                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <Loader2 className="animate-spin text-purple-500" size={40} />
                            <p className="text-v-muted text-sm animate-pulse">Analyzing your backlog...</p>
                        </div>
                    )}

                    {plan && !isLoading && (
                        <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                            <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-lg">
                                <h4 className="font-semibold text-purple-400 mb-2 flex items-center gap-2">
                                    <Sparkles size={16} /> Suggested Sprint Goal
                                </h4>
                                <p className="text-sm text-v-main">{plan.goal}</p>
                            </div>

                            <div>
                                <h4 className="font-semibold text-v-main mb-3 flex items-center gap-2">
                                    <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded">
                                        {plan.suggestedIssues?.length || 0} Issues
                                    </span>
                                    Recommended Backlog Items
                                </h4>
                                <div className="space-y-2 border border-v-border rounded-lg p-2 bg-v-secondary">
                                    {plan.suggestedIssues?.map(issueId => {
                                        const issue = backlogIssues.find(b => b._id === issueId);
                                        if (!issue) return null;
                                        return (
                                            <div key={issueId} className="flex items-center gap-3 p-3 bg-v-primary border border-v-border rounded-md text-sm">
                                                <span className="text-v-muted font-mono text-xs w-16">{issue.key}</span>
                                                <span className="flex-1 text-v-main truncate">{issue.title}</span>
                                                {issue.storyPoints && (
                                                    <span className="flex-center h-6 min-w-[24px] rounded-full bg-blue-500/10 px-2 text-xs font-bold text-blue-500">
                                                        {issue.storyPoints}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {(!plan.suggestedIssues || plan.suggestedIssues.length === 0) && (
                                        <div className="text-center text-v-muted py-4 text-sm">No issues suggested.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {plan && !isLoading && (
                    <div className="border-t border-v-border px-6 py-4 flex justify-end gap-3 bg-v-secondary/50">
                        <button
                            onClick={handleGeneratePlan}
                            disabled={isApplying}
                            className="rounded-lg px-4 py-2 text-sm text-v-muted hover:text-v-main transition-colors disabled:opacity-50"
                        >
                            Regenerate
                        </button>
                        <button
                            onClick={handleApplyPlan}
                            disabled={isApplying}
                            className="flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-2 text-sm font-medium text-white hover:bg-purple-700 transition-colors disabled:opacity-50"
                        >
                            {isApplying ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                            {isApplying ? 'Creating Sprint...' : 'Create Sprint & Apply'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AISprintPlannerModal;
