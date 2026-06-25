import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getSprints, createSprint, startSprint, completeSprint } from './sprintSlice';
import { getIssues } from '../board/boardSlice';
import { Plus, Loader2, Play, CheckCircle, Clock, ListTodo, ChevronDown, ChevronRight, Bug, BookOpen, CheckSquare, Zap, User, BarChart2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import IssueModal from '../board/IssueModal';
import AISprintPlanner from '../../components/ai/AISprintPlanner';



const STATUS_STYLES = {
    future: { label: 'Future', cls: 'bg-v-muted/10 text-v-muted border border-v-border' },
    active: { label: 'Active', cls: 'bg-green-500/10 text-green-500 border border-green-500/20' },
    completed: { label: 'Completed', cls: 'bg-blue-500/10 text-blue-500 border border-blue-500/20' },
};

const TYPE_ICONS = {
    bug: <Bug size={14} className="text-red-500" />,
    story: <BookOpen size={14} className="text-green-500" />,
    task: <CheckSquare size={14} className="text-blue-500" />,
    epic: <Zap size={14} className="text-purple-500" />,
    subtask: <CheckSquare size={14} className="text-gray-400" />,
};

const PRIORITY_COLORS = {
    critical: 'bg-red-500/10 text-red-500 border border-red-500/20',
    high: 'bg-orange-500/10 text-orange-500 border border-orange-500/20',
    medium: 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
    low: 'bg-v-muted/10 text-v-muted border border-v-border',
};

const SprintPage = () => {
    const { projectId } = useParams();
    const dispatch = useDispatch();
    const { sprints, isLoading } = useSelector(state => state.sprint);
    const { issues } = useSelector(state => state.board);
    const [showForm, setShowForm] = useState(false);
    const [newName, setNewName] = useState('');
    const [newGoal, setNewGoal] = useState('');
    const [selectedIssue, setSelectedIssue] = useState(null);

    useEffect(() => {
        if (projectId) {
            dispatch(getSprints(projectId));
            dispatch(getIssues(projectId));
        }
    }, [projectId, dispatch]);

    const handleCreate = () => {
        dispatch(createSprint({ project: projectId, name: newName || undefined, goal: newGoal }))
            .unwrap()
            .then(() => {
                toast.success('Sprint created!');
                setNewName('');
                setNewGoal('');
                setShowForm(false);
            })
            .catch(err => toast.error(err));
    };

    const handleStart = (sprintId) => {
        dispatch(startSprint(sprintId))
            .unwrap()
            .then(() => toast.success('Sprint started!'))
            .catch(err => toast.error(err));
    };

    const handleComplete = (sprintId) => {
        if (!window.confirm('Complete this sprint? Unfinished issues will be moved to the backlog.')) return;
        dispatch(completeSprint(sprintId))
            .unwrap()
            .then(() => {
                dispatch(getIssues(projectId));
                toast.success('Sprint completed!');
            })
            .catch(err => toast.error(err));
    };

    const getSprintIssueCount = (sprintId) =>
        issues.filter(i => (i.sprint?._id || i.sprint) === sprintId).length;

    const getDoneCount = (sprintId) =>
        issues.filter(i => (i.sprint?._id || i.sprint) === sprintId && i.status === 'done').length;

    if (isLoading) {
        return <div className="flex h-64 items-center justify-center"><Loader2 size={32} className="animate-spin text-blue-500" /></div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-v-main">Sprints</h1>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                    <Plus size={14} />
                    Create Sprint
                </button>
            </div>

            {/* Create sprint form */}
            {showForm && (
                <div className="rounded-xl bg-v-primary border border-v-border shadow-sm p-5 space-y-3 transition-colors">
                    <h3 className="text-sm font-semibold text-v-main">New Sprint</h3>
                    <div>
                        <label className="text-xs text-v-muted font-medium uppercase tracking-wide">Name</label>
                        <input
                            type="text"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            placeholder="Sprint 1 (auto-generated if blank)"
                            className="mt-1 w-full rounded-lg border border-v-border bg-v-primary px-3 py-2 text-sm text-v-main focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-v-muted font-medium uppercase tracking-wide">Sprint Goal</label>
                        <input
                            type="text"
                            value={newGoal}
                            onChange={e => setNewGoal(e.target.value)}
                            placeholder="What do you want to achieve?"
                            className="mt-1 w-full rounded-lg border border-v-border bg-v-primary px-3 py-2 text-sm text-v-main focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleCreate}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 transition-colors"
                        >
                            Create
                        </button>
                        <button
                            onClick={() => setShowForm(false)}
                            className="rounded-lg text-sm text-v-muted px-4 py-2 hover:bg-v-secondary transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* AI Sprint Planner */}
            <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-1">
                <AISprintPlanner projectId={projectId} onApplyPlan={() => dispatch(getSprints(projectId))} />
            </div>

            {sprints.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl bg-v-primary border border-dashed border-v-border py-16 text-center transition-colors">
                    <ListTodo size={40} className="text-v-muted opacity-30 mb-3" />
                    <p className="text-v-main font-medium">No sprints yet</p>
                    <p className="text-sm text-v-muted mt-1">Create a sprint to get started with agile planning</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {sprints.map(sprint => (
                        <SprintCard
                            key={sprint._id}
                            sprint={sprint}
                            issues={issues}
                            onStart={handleStart}
                            onComplete={handleComplete}
                            onIssueClick={setSelectedIssue}
                        />
                    ))}
                </div>
            )}
            {/* Modal for viewing/editing tasks */}
            <IssueModal
                isOpen={!!selectedIssue}
                onClose={() => setSelectedIssue(null)}
                issue={selectedIssue}
            />
        </div>
    );
};

const SprintCard = ({ sprint, issues, onStart, onComplete, onIssueClick }) => {
    const [expanded, setExpanded] = useState(true);
    const sprintIssues = issues.filter(i => (i.sprint?._id || i.sprint) === sprint._id);
    const total = sprintIssues.length;
    const done = sprintIssues.filter(i => i.status === 'done').length;
    const progress = total > 0 ? (done / total) * 100 : 0;
    const s = STATUS_STYLES[sprint.status];

    // Prepare chart data
    const statusCounts = sprintIssues.reduce((acc, issue) => {
        acc[issue.status] = (acc[issue.status] || 0) + 1;
        return acc;
    }, {});

    // Sort to ensure 'done' is at the end, 'todo' at the start
    const chartData = Object.keys(statusCounts).map(status => ({
        name: status.toUpperCase().replace('-', ' '),
        count: statusCounts[status],
        fill: status === 'done' ? '#22c55e' : status === 'in-progress' ? '#3b82f6' : '#94a3b8'
    }));

    return (
        <div className={`rounded-xl bg-v-primary border shadow-sm overflow-hidden transition-colors ${sprint.status === 'active' ? 'border-green-500/50' : 'border-v-border'}`}>
            <div className="flex items-start gap-4 p-5">
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <button onClick={() => setExpanded(!expanded)} className="text-v-muted hover:text-v-main transition-colors">
                            {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </button>
                        <h3 className="text-base font-semibold text-v-main">{sprint.name}</h3>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>
                    </div>
                    {sprint.goal && (
                        <p className="text-sm text-v-muted mb-2 ml-7 leading-relaxed">{sprint.goal}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-v-muted ml-7">
                        <span className="flex items-center gap-1"><ListTodo size={12} />{total} issues</span>
                        <span className="flex items-center gap-1"><CheckCircle size={12} className="text-green-500" />{done} done</span>
                        {sprint.startDate && (
                            <span className="flex items-center gap-1"><Clock size={12} />
                                {format(new Date(sprint.startDate), 'MMM d')} –{' '}
                                {sprint.endDate ? format(new Date(sprint.endDate), 'MMM d') : '?'}
                            </span>
                        )}
                    </div>

                    {/* Progress bar */}
                    {total > 0 && sprint.status !== 'future' && (
                        <div className="mt-3 ml-7">
                            <div className="h-1.5 w-full rounded-full bg-v-secondary overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-green-500 transition-all"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="mt-1 text-xs text-v-muted">{Math.round(progress)}% complete</p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                    {sprint.status === 'future' && (
                        <button
                            onClick={() => onStart(sprint._id)}
                            className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors"
                        >
                            <Play size={12} />
                            Start Sprint
                        </button>
                    )}
                    {sprint.status === 'active' && (
                        <button
                            onClick={() => onComplete(sprint._id)}
                            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
                        >
                            <CheckCircle size={12} />
                            Complete Sprint
                        </button>
                    )}
                </div>
            </div>

            {expanded && (
                <div className="border-t border-v-border bg-v-secondary/30 flex flex-col md:flex-row transition-colors">
                    <div className="flex-1 divide-y divide-v-border max-h-96 overflow-y-auto w-full">
                        {sprintIssues.length === 0 ? (
                            <p className="py-4 text-center text-xs text-v-muted">No issues in this sprint.</p>
                        ) : (
                            sprintIssues.map(issue => (
                                <div
                                    key={issue._id}
                                    onClick={() => onIssueClick(issue)}
                                    className="flex items-center gap-3 px-5 py-2.5 hover:bg-v-secondary transition-colors cursor-pointer group"
                                >
                                    <span className="flex-shrink-0">{TYPE_ICONS[issue.type] || TYPE_ICONS.task}</span>
                                    <span className="text-xs text-v-muted font-mono w-16 flex-shrink-0">{issue.key}</span>
                                    <span className="flex-1 text-sm text-v-main truncate">{issue.title}</span>
                                    <span className={`hidden sm:inline-flex rounded border px-2 py-0.5 text-[10px] font-semibold uppercase flex-shrink-0 ${PRIORITY_COLORS[issue.priority]}`}>
                                        {issue.priority}
                                    </span>
                                    {issue.assignee && (
                                        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2" title={`Assigned to ${issue.assignee.name}`}>
                                            <div className="h-5 w-5 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[10px] text-blue-500 font-bold">
                                                {issue.assignee.name.charAt(0).toUpperCase()}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Sprint Analytics Chart */}
                    {sprintIssues.length > 0 && (
                        <div className="w-full md:w-64 p-4 border-t md:border-t-0 md:border-l border-v-border bg-v-primary/50 flex flex-col shrink-0">
                            <h4 className="text-xs font-semibold text-v-muted uppercase tracking-widest mb-4 flex items-center gap-1.5">
                                <BarChart2 size={13} /> Analytics
                            </h4>
                            <div className="flex-1 min-h-[160px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -25 }}>
                                        <XAxis dataKey="name" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                                        <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                        <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SprintPage;
