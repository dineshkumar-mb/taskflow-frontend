import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateIssue, deleteIssue } from './boardSlice';
import { getComments, addComment, deleteComment } from '../comment/commentSlice';
import { getIssueActivities } from '../activity/activitySlice';
import {
    X, Loader2, Bug, BookOpen, CheckSquare, Zap, Trash2,
    Send, MessageSquare, User as UserIcon, Clock, Activity as ActivityIcon,
    Wand2, Calculator, GitCommit, Paperclip, File, Link, Link2, Reply, ChevronDown, ChevronRight
} from 'lucide-react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import axiosInstance from '../../utils/axiosInstance';
import AISummaryCard from '../../components/ai/AISummaryCard';



const TYPE_ICONS = {
    bug: <Bug size={14} className="text-red-500" />,
    story: <BookOpen size={14} className="text-green-500" />,
    task: <CheckSquare size={14} className="text-blue-500" />,
    epic: <Zap size={14} className="text-purple-500" />,
    subtask: <CheckSquare size={14} className="text-gray-500" />,
};

const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'critical'];
const TYPE_OPTIONS = ['task', 'bug', 'story', 'epic', 'subtask'];
const STATUS_OPTIONS = ['todo', 'in-progress', 'done'];

const PRIORITY_COLORS = {
    critical: 'bg-red-500/10 text-red-500 border border-red-500/20',
    high: 'bg-orange-500/10 text-orange-500 border border-orange-500/20',
    medium: 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
    low: 'bg-v-muted/10 text-v-muted border border-v-border',
};

const IssueModal = ({ isOpen, onClose, issue }) => {
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const { comments, isLoading: commentsLoading } = useSelector(state => state.comment);
    const { activities, isLoading: activitiesLoading } = useSelector(state => state.activity);

    const [activeTab, setActiveTab] = useState('comments'); // 'comments' | 'history'
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('medium');
    const [type, setType] = useState('task');
    const [status, setStatus] = useState('todo');
    const [storyPoints, setStoryPoints] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [assigneeId, setAssigneeId] = useState('');
    const [labels, setLabels] = useState('');
    const [orgUsers, setOrgUsers] = useState([]);
    const [subTasks, setSubTasks] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showAddSubtask, setShowAddSubtask] = useState(false);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [newSubtaskAssignee, setNewSubtaskAssignee] = useState('');
    const [isCreatingSubtask, setIsCreatingSubtask] = useState(false);
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [isEstimating, setIsEstimating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [showAddLink, setShowAddLink] = useState(false);
    const [newLinkType, setNewLinkType] = useState('relates-to');
    const [newLinkTargetKey, setNewLinkTargetKey] = useState('');
    const [isLinking, setIsLinking] = useState(false);
    const [replyTo, setReplyTo] = useState(null); // { id: string, name: string }

    const loadSubTasks = () => {
        if (!issue || !user) return;
        axiosInstance.get(`/issues?projectId=${issue.project || issue.project?._id}&parentIssue=${issue._id}`)
            .then(res => setSubTasks(res.data))
            .catch(() => { });
    };

    useEffect(() => {
        if (issue) {
            setTitle(issue.title || '');
            setDescription(issue.description || '');
            setPriority(issue.priority || 'medium');
            setType(issue.type || 'task');
            setStatus(issue.status || 'todo');
            setStoryPoints(issue.storyPoints || '');
            setDueDate(issue.dueDate ? format(new Date(issue.dueDate), 'yyyy-MM-dd') : '');
            setAssigneeId(issue.assignee?._id || issue.assignee || '');
            setLabels(issue.labels?.join(', ') || '');
            setActiveTab('comments');
            dispatch(getComments(issue._id));
            dispatch(getIssueActivities(issue._id));
            loadSubTasks();
        }
    }, [issue, dispatch, user]);

    const handleCreateSubtask = async () => {
        if (!newSubtaskTitle.trim()) return;
        setIsCreatingSubtask(true);
        try {
            await axiosInstance.post('/issues', {
                title: newSubtaskTitle.trim(),
                type: 'subtask',
                project: issue.project || issue.project?._id,
                parentIssue: issue._id,
                sprint: issue.sprint || null,
                assignee: newSubtaskAssignee || null,
                status: 'todo',
                priority: 'medium'
            });
            toast.success('Sub-task created');
            setNewSubtaskTitle('');
            setNewSubtaskAssignee('');
            setShowAddSubtask(false);
            loadSubTasks();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create sub-task');
        } finally {
            setIsCreatingSubtask(false);
        }
    };

    const handleGenerateSummary = async () => {
        if (!title.trim()) return toast.error('Please enter a title first to generate a summary');
        setIsGeneratingSummary(true);
        try {
            const res = await axiosInstance.post('/ai/summary', { title, description });
            setDescription(prev => prev ? `${prev}\n\n[AI Summary]\n${res.data.summary}` : res.data.summary);
            toast.success('AI Summary generated!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to generate summary');
        } finally {
            setIsGeneratingSummary(false);
        }
    };

    const handleEstimatePoints = async () => {
        if (!title.trim()) return toast.error('Please enter a title first to estimate points');
        setIsEstimating(true);
        try {
            const res = await axiosInstance.post('/ai/estimate', { title, description, type, priority });
            setStoryPoints(res.data.points);
            toast.success('Story Points calculated!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to estimate points');
        } finally {
            setIsEstimating(false);
        }
    };

    // Fetch org members for assignee
    useEffect(() => {
        if (isOpen && user) {
            axiosInstance.get('/users')
                .then(res => setOrgUsers(res.data))
                .catch(() => { });
        }
    }, [isOpen, user]);

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        const formData = new FormData();
        files.forEach(f => formData.append('files', f));

        setIsUploading(true);
        try {
            const res = await axiosInstance.post(`/issues/${issue._id}/attachments`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Files uploaded');
            dispatch(updateIssue(res.data.issue));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to upload files');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        dispatch(updateIssue({
            id: issue._id,
            title,
            description,
            priority,
            type,
            status,
            storyPoints: storyPoints ? Number(storyPoints) : undefined,
            dueDate: dueDate || undefined,
            assignee: assigneeId || null,
            labels: labels ? labels.split(',').map(l => l.trim()).filter(Boolean) : [],
        })).unwrap().then(() => {
            toast.success('Issue updated');
            setIsSaving(false);
            onClose();
        }).catch(err => {
            toast.error(err || 'Failed to update issue');
            setIsSaving(false);
        });
    };

    const handleDelete = async () => {
        if (!window.confirm('Delete this issue? This cannot be undone.')) return;
        setIsDeleting(true);
        dispatch(deleteIssue(issue._id)).unwrap().then(() => {
            toast.success('Issue deleted');
            setIsDeleting(false);
            onClose();
        }).catch(err => {
            toast.error(err || 'Failed to delete issue');
            setIsDeleting(false);
        });
    };

    const handleAddComment = () => {
        if (!newComment.trim()) return;
        dispatch(addComment({
            issueId: issue._id,
            content: newComment.trim(),
            parentComment: replyTo?.id || null
        }))
            .unwrap()
            .then(() => {
                setNewComment('');
                setReplyTo(null);
            })
            .catch(err => toast.error(err || 'Failed to add comment'));
    };

    const handleAddLink = async () => {
        if (!newLinkTargetKey.trim()) return;
        setIsLinking(true);
        try {
            // First find the issue by key
            const resIssues = await axiosInstance.get(`/issues?key=${newLinkTargetKey.trim()}`);
            const targetIssue = resIssues.data[0];
            if (!targetIssue) throw new Error('Issue not found with that key');
            if (targetIssue._id === issue._id) throw new Error('Cannot link an issue to itself');

            const res = await axiosInstance.post(`/issues/${issue._id}/links`, {
                type: newLinkType,
                targetIssueId: targetIssue._id
            });
            dispatch(updateIssue(res.data));
            setNewLinkTargetKey('');
            setShowAddLink(false);
            toast.success('Issue linked');
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || 'Failed to link issue');
        } finally {
            setIsLinking(false);
        }
    };

    const handleRemoveLink = async (linkId) => {
        try {
            const res = await axiosInstance.delete(`/issues/${issue._id}/links/${linkId}`);
            dispatch(updateIssue(res.data));
            toast.success('Link removed');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to remove link');
        }
    };

    const handleDeleteComment = (commentId) => {
        dispatch(deleteComment(commentId)).catch(err => toast.error(err));
    };

    const renderComment = (comment, isReply = false) => (
        <div key={comment._id} className={`flex gap-3 group ${isReply ? 'ml-10 mt-2' : 'mt-4'}`}>
            <div className={`${isReply ? 'h-6 w-6' : 'h-7 w-7'} flex-shrink-0 rounded-full bg-blue-500 flex items-center justify-center text-[10px] text-white font-bold`}>
                {comment.user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-v-main">{comment.user?.name}</span>
                    <span className="text-[10px] text-v-muted">
                        {comment.createdAt && format(new Date(comment.createdAt), 'MMM d, h:mm a')}
                    </span>
                    <div className="ml-auto flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        {!isReply && (
                            <button
                                onClick={() => setReplyTo({ id: comment._id, name: comment.user?.name })}
                                className="text-v-muted hover:text-blue-500 transition-colors"
                                title="Reply"
                            >
                                <Reply size={12} />
                            </button>
                        )}
                        {comment.user?._id === user?._id && (
                            <button
                                onClick={() => handleDeleteComment(comment._id)}
                                className="text-v-muted hover:text-red-500 transition-colors"
                                title="Delete"
                            >
                                <Trash2 size={12} />
                            </button>
                        )}
                    </div>
                </div>
                <p className="text-sm text-v-muted leading-relaxed">
                    {comment.content.split(/(@\w+)/g).map((part, i) => 
                        part.startsWith('@') ? <span key={i} className="text-blue-500 font-semibold bg-blue-500/10 px-1 rounded">{part}</span> : part
                    )}
                </p>
            </div>
        </div>
    );

    if (!isOpen || !issue) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
            <div
                className="w-full max-w-3xl rounded-xl bg-v-primary shadow-2xl border border-v-border max-h-[92vh] flex flex-col transition-colors"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center gap-3 border-b border-v-border px-6 py-4">
                    <span>{TYPE_ICONS[type] || TYPE_ICONS.task}</span>
                    {issue.key && (
                        <span className="text-sm font-mono text-v-muted bg-v-secondary px-2 py-0.5 rounded border border-v-border">
                            {issue.key}
                        </span>
                    )}
                    <div className="flex-1" />
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="rounded-lg p-2 text-v-muted hover:bg-red-500/10 hover:text-red-500 transition-colors"
                        title="Delete issue"
                    >
                        <Trash2 size={16} />
                    </button>
                    <button onClick={onClose} className="rounded-lg p-2 text-v-muted hover:bg-v-secondary transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Main content */}
                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                        {/* Title */}
                        <input
                            className="w-full text-xl font-bold text-v-main bg-transparent border-none outline-none focus:ring-0 placeholder-v-muted/30"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Issue title"
                        />

                        {/* AI Summary Card */}
                        <AISummaryCard title={title} description={description} />

                        {/* Description */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-semibold text-v-muted uppercase tracking-wider">Description</label>
                                <button
                                    onClick={handleGenerateSummary}
                                    disabled={isGeneratingSummary || !title.trim()}
                                    className="flex items-center gap-1.5 text-[10px] font-medium text-purple-600 hover:text-purple-700 disabled:opacity-50 transition-colors bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20"
                                >
                                    {isGeneratingSummary ? <Loader2 size={10} className="animate-spin" /> : <Wand2 size={10} />}
                                    Auto-Summarize
                                </button>
                            </div>
                            <textarea
                                rows={4}
                                className="w-full rounded-lg border border-v-border bg-v-secondary px-3 py-2 text-sm text-v-main focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-colors"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Add a description..."
                            />
                        </div>

                        {/* Labels */}
                        <div>
                            <label className="text-xs font-semibold text-v-muted uppercase tracking-wider">Labels</label>
                            <input
                                type="text"
                                value={labels}
                                onChange={e => setLabels(e.target.value)}
                                placeholder="bug, frontend, urgent (comma-separated)"
                                className="mt-1 w-full rounded-lg border border-v-border bg-v-secondary px-3 py-2 text-sm text-v-main focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                            />
                            {labels && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {labels.split(',').map(l => l.trim()).filter(Boolean).map((label, i) => (
                                        <span key={i} className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-500 border border-blue-500/20">
                                            {label}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Commits */}
                        {issue.commits && issue.commits.length > 0 && (
                            <div>
                                <label className="text-xs font-semibold text-v-muted uppercase tracking-wider mb-2 block">Linked Commits</label>
                                <div className="space-y-2">
                                    {issue.commits.map(commit => (
                                        <div key={commit.hash} className="flex items-start gap-3 rounded-lg border border-v-border bg-v-secondary px-3 py-2 transition-colors">
                                            <GitCommit size={16} className="text-v-muted mt-0.5" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <a href={commit.url || '#'} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors hover:underline truncate">
                                                        {commit.message.split('\n')[0]}
                                                    </a>
                                                    <span className="text-[10px] font-mono bg-v-primary text-v-muted px-1.5 py-0.5 rounded flex-shrink-0 border border-v-border">
                                                        {commit.hash.substring(0, 7)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-v-muted">
                                                    <span className="font-medium text-v-main">{commit.author}</span>
                                                    <span>•</span>
                                                    <span>{format(new Date(commit.date), 'MMM d, yyyy h:mm a')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Attachments */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-semibold text-v-muted uppercase tracking-wider">Attachments ({issue.attachments?.length || 0})</label>
                                <div>
                                    <input
                                        type="file"
                                        multiple
                                        id="file-upload"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                        disabled={isUploading}
                                    />
                                    <label
                                        htmlFor="file-upload"
                                        className="flex items-center gap-1.5 text-[10px] font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 transition-colors bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20 cursor-pointer"
                                    >
                                        {isUploading ? <Loader2 size={10} className="animate-spin" /> : <Paperclip size={10} />}
                                        Attach files
                                    </label>
                                </div>
                            </div>

                            {issue.attachments?.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {issue.attachments.map((url, i) => {
                                        const isImage = url.match(/\.(jpeg|jpg|gif|png)$/i);
                                        const fileName = url.split('/').pop();
                                        return (
                                            <a
                                                key={i}
                                                href={`${BACKEND_URL}${url}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group relative block aspect-video rounded-lg border border-v-border bg-v-secondary flex flex-col items-center justify-center overflow-hidden hover:border-blue-500/50 transition-colors"
                                            >
                                                {isImage ? (
                                                    <img src={`${BACKEND_URL}${url}`} alt={fileName} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                                ) : (
                                                    <File size={24} className="text-v-muted mb-1" />
                                                )}
                                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 translate-y-full group-hover:translate-y-0 transition-transform">
                                                    <p className="text-[10px] text-white truncate" title={fileName}>{fileName}</p>
                                                </div>
                                            </a>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Sub-tasks */}
                        {(subTasks.length > 0 || type !== 'subtask') && (
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-semibold text-v-muted uppercase tracking-wider">Sub-tasks ({subTasks.length})</label>
                                    {!showAddSubtask && type !== 'subtask' && (
                                        <button
                                            onClick={() => setShowAddSubtask(true)}
                                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                            + Add Sub-task
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    {subTasks.map(st => (
                                        <div key={st._id} className="flex items-center gap-2 rounded-lg border border-v-border bg-v-secondary px-3 py-2 transition-colors">
                                            <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${st.status === 'done' ? 'bg-green-500' : st.status === 'in-progress' ? 'bg-blue-500' : 'bg-v-muted opacity-30'}`} />
                                            <span className="text-xs font-mono text-v-muted">{st.key}</span>
                                            <span className="text-sm text-v-main flex-1 truncate">{st.title}</span>
                                            {st.assignee && (
                                                <div className="h-5 w-5 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[10px] text-blue-500 font-bold" title={st.assignee?.name}>
                                                    {st.assignee?.name?.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <span className="text-xs capitalize text-v-muted ml-2">{st.status}</span>
                                        </div>
                                    ))}
                                </div>

                                {showAddSubtask && (
                                    <div className="mt-2 p-3 rounded-lg border border-v-border bg-v-primary">
                                        <input
                                            type="text"
                                            placeholder="What needs to be done?"
                                            value={newSubtaskTitle}
                                            onChange={e => setNewSubtaskTitle(e.target.value)}
                                            className="w-full rounded-md border border-v-border bg-v-secondary px-3 py-1.5 text-sm text-v-main focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 transition-colors"
                                        />
                                        <div className="flex gap-2">
                                            <select
                                                value={newSubtaskAssignee}
                                                onChange={e => setNewSubtaskAssignee(e.target.value)}
                                                className="flex-1 rounded-md border border-v-border bg-v-secondary px-2 py-1.5 text-sm text-v-main focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                                            >
                                                <option value="">Unassigned</option>
                                                {orgUsers.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                                            </select>
                                            <button
                                                onClick={handleCreateSubtask}
                                                disabled={!newSubtaskTitle.trim() || isCreatingSubtask}
                                                className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-1"
                                            >
                                                {isCreatingSubtask && <Loader2 size={12} className="animate-spin" />}
                                                Add
                                            </button>
                                            <button
                                                onClick={() => setShowAddSubtask(false)}
                                                className="rounded-md px-3 py-1.5 text-xs text-v-muted hover:bg-v-secondary transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Linked Issues */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-semibold text-v-muted uppercase tracking-wider">Linked Issues ({issue.links?.length || 0})</label>
                                <button
                                    onClick={() => setShowAddLink(!showAddLink)}
                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    + Link Issue
                                </button>
                            </div>

                            {showAddLink && (
                                <div className="mb-3 p-3 rounded-lg border border-blue-500/20 bg-blue-500/5 flex gap-2">
                                    <select
                                        value={newLinkType}
                                        onChange={e => setNewLinkType(e.target.value)}
                                        className="rounded border border-v-border bg-v-secondary text-v-main px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 transition-colors"
                                    >
                                        <option value="relates-to">relates to</option>
                                        <option value="blocks">blocks</option>
                                        <option value="is-blocked-by">is blocked by</option>
                                        <option value="duplicates">duplicates</option>
                                        <option value="clones">clones</option>
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="Issue Key (e.g. WEB-1)"
                                        value={newLinkTargetKey}
                                        onChange={e => setNewLinkTargetKey(e.target.value.toUpperCase())}
                                        className="flex-1 rounded border border-v-border bg-v-secondary text-v-main px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 transition-colors"
                                    />
                                    <button
                                        onClick={handleAddLink}
                                        disabled={isLinking || !newLinkTargetKey}
                                        className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {isLinking ? <Loader2 size={12} className="animate-spin" /> : 'Link'}
                                    </button>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                {issue.links?.map(link => (
                                    <div key={link._id} className="flex items-center gap-2 rounded-lg border border-v-border bg-v-primary px-3 py-2 text-sm shadow-sm group transition-colors">
                                        <span className="text-[10px] font-bold uppercase text-v-muted w-20">{link.type.replace(/-/g, ' ')}</span>
                                        <span className="text-xs font-mono text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">{link.issue?.key}</span>
                                        <span className="text-sm text-v-main flex-1 truncate">{link.issue?.title}</span>
                                        <div className={`text-[10px] px-2 py-0.5 rounded-full border ${link.issue?.status === 'done' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                            link.issue?.status === 'in-progress' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-v-muted/10 text-v-muted border-v-border'
                                            }`}>
                                            {link.issue?.status}
                                        </div>
                                        <button
                                            onClick={() => handleRemoveLink(link._id)}
                                            className="opacity-0 group-hover:opacity-100 text-v-muted hover:text-red-500 transition-all"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tabs for Comments / History */}
                        <div className="mt-8 border-t border-v-border pt-6">
                            <div className="flex gap-6 border-b border-v-border mb-4">
                                <button
                                    onClick={() => setActiveTab('comments')}
                                    className={`pb-2 text-sm font-medium transition-colors ${activeTab === 'comments' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-v-muted hover:text-v-main'}`}
                                >
                                    <span className="flex items-center gap-1.5"><MessageSquare size={14} /> Comments</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('history')}
                                    className={`pb-2 text-sm font-medium transition-colors ${activeTab === 'history' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-v-muted hover:text-v-main'}`}
                                >
                                    <span className="flex items-center gap-1.5"><ActivityIcon size={14} /> History</span>
                                </button>
                            </div>

                            {activeTab === 'comments' && (
                                <div>
                                    <div className="space-y-3">
                                        {commentsLoading ? (
                                            <div className="flex items-center gap-2 text-sm text-gray-400"><Loader2 size={14} className="animate-spin" /> Loading...</div>
                                        ) : comments.length === 0 ? (
                                            <p className="text-sm text-gray-400">No comments yet.</p>
                                        ) : (
                                            comments.filter(c => !c.parentComment).map(comment => (
                                                <div key={comment._id}>
                                                    {renderComment(comment)}
                                                    {/* Render Replies */}
                                                    {comments.filter(reply => reply.parentComment === comment._id || reply.parentComment?._id === comment._id).map(reply => (
                                                        renderComment(reply, true)
                                                    ))}
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Reply Preview */}
                                    {replyTo && (
                                        <div className="mt-4 flex items-center justify-between bg-blue-500/10 px-3 py-2 rounded-lg border border-blue-500/20">
                                            <div className="flex items-center gap-2 text-xs text-blue-500">
                                                <Reply size={12} />
                                                Replying to <span className="font-bold">{replyTo.name}</span>
                                            </div>
                                            <button onClick={() => setReplyTo(null)} className="text-blue-400 hover:text-blue-500 transition-colors">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    )}

                                    {/* Add comment */}
                                    <div className="mt-4 flex gap-2">
                                        <div className="h-7 w-7 flex-shrink-0 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white font-bold">
                                            {user?.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Add a comment..."
                                                value={newComment}
                                                onChange={e => setNewComment(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                                                className="flex-1 rounded-lg border border-v-border bg-v-secondary px-3 py-1.5 text-sm text-v-main focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                                            />
                                            <button
                                                onClick={handleAddComment}
                                                disabled={!newComment.trim()}
                                                className="rounded-lg bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                            >
                                                <Send size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'history' && (
                                <div className="space-y-4">
                                    {activitiesLoading ? (
                                        <div className="flex items-center gap-2 text-sm text-gray-400"><Loader2 size={14} className="animate-spin" /> Fetching history...</div>
                                    ) : activities.length === 0 ? (
                                        <p className="text-sm text-gray-400">No activity recorded yet.</p>
                                    ) : (
                                        <div className="relative border-l border-v-border ml-3 pl-5 space-y-5">
                                            {activities.map(act => (
                                                <div key={act._id} className="relative">
                                                    <div className="absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full bg-blue-500 border-[2px] border-v-primary" />
                                                    <div className="text-sm text-v-muted">
                                                        <span className="font-semibold text-v-main">{act.user?.name} </span>
                                                        {act.type === 'create' ? (
                                                            <span>created this issue</span>
                                                        ) : (
                                                            <span>
                                                                changed <span className="font-medium bg-v-secondary px-1 rounded text-v-main border border-v-border">{act.field}</span>
                                                                {act.oldValue && <span className="text-v-muted opacity-60 line-through ml-1">{act.oldValue}</span>}
                                                                <span className="text-blue-500 font-medium ml-1">→ {act.newValue}</span>
                                                            </span>
                                                        )}
                                                        <span className="text-xs text-v-muted opacity-70 ml-2 block sm:inline mt-0.5 sm:mt-0">
                                                            {format(new Date(act.createdAt), 'MMM d, h:mm a')}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar details */}
                    <div className="w-60 flex-shrink-0 border-l border-v-border bg-v-secondary overflow-y-auto px-4 py-4 space-y-4 transition-colors">
                        <Field label="Status">
                            <select
                                value={status}
                                onChange={e => setStatus(e.target.value)}
                                className="form-select w-full rounded-md border border-v-border bg-v-primary px-2 py-1.5 text-sm text-v-main focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                            >
                                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </Field>

                        <Field label="Priority">
                            <select
                                value={priority}
                                onChange={e => setPriority(e.target.value)}
                                className="form-select w-full rounded-md border border-v-border bg-v-primary px-2 py-1.5 text-sm text-v-main focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                            >
                                {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </Field>

                        <Field label="Type">
                            <select
                                value={type}
                                onChange={e => setType(e.target.value)}
                                className="form-select w-full rounded-md border border-v-border bg-v-primary px-2 py-1.5 text-sm text-v-main focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                            >
                                {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </Field>

                        <Field label="Assignee">
                            <select
                                value={assigneeId}
                                onChange={e => setAssigneeId(e.target.value)}
                                className="form-select w-full rounded-md border border-v-border bg-v-primary px-2 py-1.5 text-sm text-v-main focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                            >
                                <option value="">Unassigned</option>
                                {orgUsers.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                            </select>
                        </Field>

                        <Field label="Story Points">
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={storyPoints}
                                    onChange={e => setStoryPoints(e.target.value)}
                                    className="w-full rounded-md border border-v-border bg-v-primary px-2 py-1.5 text-sm text-v-main focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                                    placeholder="0"
                                />
                                <button
                                    onClick={handleEstimatePoints}
                                    disabled={isEstimating || !title.trim()}
                                    title="Auto-estimate points via AI"
                                    className="flex-shrink-0 p-1.5 rounded bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 disabled:opacity-50 transition-colors border border-purple-500/20"
                                >
                                    {isEstimating ? <Loader2 size={14} className="animate-spin" /> : <Calculator size={14} />}
                                </button>
                            </div>
                        </Field>

                        <Field label="Due Date">
                            <input
                                type="date"
                                value={dueDate}
                                onChange={e => setDueDate(e.target.value)}
                                className="w-full rounded-md border border-v-border bg-v-primary px-2 py-1.5 text-sm text-v-main focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                            />
                        </Field>

                        <Field label="Reporter">
                            <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-purple-500 flex items-center justify-center text-[10px] text-white font-bold">
                                    {issue.reporter?.name?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <span className="text-sm text-v-main">
                                    {issue.reporter?.name || 'Unknown'}
                                </span>
                            </div>
                        </Field>

                        {issue.createdAt && (
                            <Field label="Created">
                                <span className="flex items-center gap-1 text-xs text-v-muted">
                                    <Clock size={11} />
                                    {format(new Date(issue.createdAt), 'MMM d, yyyy')}
                                </span>
                            </Field>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 border-t border-v-border px-6 py-3">
                    <button
                        onClick={onClose}
                        className="rounded-lg px-4 py-2 text-sm text-v-muted hover:bg-v-secondary transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
                    >
                        {isSaving && <Loader2 size={14} className="animate-spin" />}
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

const Field = ({ label, children }) => (
    <div>
        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-v-muted">
            {label}
        </label>
        {children}
    </div>
);

export default IssueModal;
