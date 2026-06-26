import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createIssue } from './boardSlice';
import { Loader2, X } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import axiosInstance from '../../utils/axiosInstance';
import AIIssueGenerator from '../../components/ai/AIIssueGenerator';



const issueSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    type: z.enum(['task', 'bug', 'story', 'epic', 'subtask']),
    storyPoints: z.string().optional(),
    dueDate: z.string().optional(),
});

const CreateIssueModal = ({ isOpen, onClose }) => {
    const { projectId } = useParams();
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const { sprints } = useSelector(state => state.sprint);
    const [isLoading, setIsLoading] = useState(false);
    const [assigneeId, setAssigneeId] = useState('');
    const [sprintId, setSprintId] = useState('');
    const [orgUsers, setOrgUsers] = useState([]);

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: zodResolver(issueSchema),
        defaultValues: { priority: 'medium', type: 'task' },
    });

    useEffect(() => {
        if (isOpen && user) {
            axiosInstance.get('/users')
                .then(res => setOrgUsers(res.data))
                .catch(() => { });
        }
    }, [isOpen, user]);

    // Pre-select active sprint
    useEffect(() => {
        const active = sprints.find(s => s.status === 'active');
        if (active) setSprintId(active._id);
    }, [sprints]);

    const onSubmit = async (data) => {
        setIsLoading(true);
        const issueData = {
            title: data.title,
            description: data.description,
            priority: data.priority,
            type: data.type,
            project: projectId,
            status: 'todo',
            ...(assigneeId && { assignee: assigneeId }),
            ...(sprintId && { sprint: sprintId }),
            ...(data.storyPoints && { storyPoints: Number(data.storyPoints) }),
            ...(data.dueDate && { dueDate: data.dueDate }),
            ...(data.labels && { labels: data.labels.split(',').map(l => l.trim()).filter(Boolean) }),
        };

        dispatch(createIssue(issueData))
            .unwrap()
            .then(() => {
                toast.success('Issue created!');
                setIsLoading(false);
                reset();
                setAssigneeId('');
                onClose();
            })
            .catch(err => {
                toast.error(err || 'Failed to create issue');
                setIsLoading(false);
            });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-xl bg-v-primary shadow-2xl border border-v-border">
                <div className="flex items-center justify-between border-b border-v-border px-5 py-4">
                    <h3 className="text-base font-bold text-v-main">Create Issue</h3>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-v-muted hover:bg-v-secondary transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="px-5 py-2 border-b border-v-border bg-v-secondary/30 flex justify-between items-center">
                    <AIIssueGenerator projectId={projectId} onIssueCreated={() => { onClose(); dispatch(getIssues(projectId)); }} />
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-v-muted">Templates:</span>
                        <select
                            onChange={(e) => {
                                const template = e.target.value;
                                if (template === 'bug') {
                                    reset({ type: 'bug', priority: 'high', title: '[BUG] ', description: '**Steps to reproduce:**\n1.\n2.\n3.\n\n**Expected Behavior:**\n\n**Actual Behavior:**\n' });
                                } else if (template === 'feature') {
                                    reset({ type: 'story', priority: 'medium', title: '[FEATURE] ', description: '**As a** [role]\n**I want** [feature]\n**So that** [benefit]\n\n**Acceptance Criteria:**\n- [ ]\n' });
                                }
                            }}
                            className="rounded border border-v-border bg-v-secondary px-2 py-1 text-xs text-v-main focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">Select...</option>
                            <option value="bug">Bug Report</option>
                            <option value="feature">Feature Request</option>
                        </select>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-4 space-y-4">
                    {/* Type + Priority row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-semibold text-v-muted uppercase tracking-wider">Type</label>
                            <select
                                {...register('type')}
                                className="mt-1 w-full rounded-lg border border-v-border bg-v-secondary px-3 py-2 text-sm text-v-main focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                            >
                                <option value="task">Task</option>
                                <option value="bug">Bug</option>
                                <option value="story">Story</option>
                                <option value="epic">Epic</option>
                                <option value="subtask">Subtask</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-v-muted uppercase tracking-wider">Priority</label>
                            <select
                                {...register('priority')}
                                className="mt-1 w-full rounded-lg border border-v-border bg-v-secondary px-3 py-2 text-sm text-v-main focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="text-xs font-semibold text-v-muted uppercase tracking-wider">Title *</label>
                        <input
                            {...register('title')}
                            placeholder="What needs to be done?"
                            className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-v-secondary text-v-main transition-colors ${errors.title ? 'border-red-400' : 'border-v-border'}`}
                        />
                        {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-xs font-semibold text-v-muted uppercase tracking-wider">Description</label>
                        <textarea
                            rows={3}
                            {...register('description')}
                            placeholder="Add more details..."
                            className="mt-1 w-full rounded-lg border border-v-border bg-v-secondary text-v-main px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-colors"
                        />
                    </div>

                    {/* Assignee + Sprint + Story Points */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-semibold text-v-muted uppercase tracking-wider">Assignee</label>
                            <select
                                value={assigneeId}
                                onChange={e => setAssigneeId(e.target.value)}
                                className="mt-1 w-full rounded-lg border border-v-border bg-v-secondary px-3 py-2 text-sm text-v-main focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                            >
                                <option value="">Unassigned</option>
                                {orgUsers.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-v-muted uppercase tracking-wider">Sprint</label>
                            <select
                                value={sprintId}
                                onChange={e => setSprintId(e.target.value)}
                                className="mt-1 w-full rounded-lg border border-v-border bg-v-secondary px-3 py-2 text-sm text-v-main focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                            >
                                <option value="">Backlog (no sprint)</option>
                                {sprints.map(s => (
                                    <option key={s._id} value={s._id}>
                                        {s.name} {s.status === 'active' ? '(Active)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="text-xs font-semibold text-v-muted uppercase tracking-wider">Story Points</label>
                            <input
                                type="number"
                                min="0"
                                {...register('storyPoints')}
                                placeholder="0"
                                className="mt-1 w-full rounded-lg border border-v-border bg-v-secondary text-v-main px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-semibold text-v-muted uppercase tracking-wider">Due Date</label>
                            <input
                                type="date"
                                {...register('dueDate')}
                                className="mt-1 w-full rounded-lg border border-v-border bg-v-secondary text-v-main px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-v-muted uppercase tracking-wider">Labels</label>
                        <input
                            {...register('labels')}
                            placeholder="bug, frontend, urgent (comma-separated)"
                            className="mt-1 w-full rounded-lg border border-v-border bg-v-secondary text-v-main px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg px-4 py-2 text-sm text-v-muted hover:bg-v-secondary transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
                        >
                            {isLoading && <Loader2 size={14} className="animate-spin" />}
                            Create Issue
                        </button>
                    </div>
                </form>
            </div >
        </div >
    );
};

export default CreateIssueModal;
