import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getIssues, updateIssue, moveIssueOptimistic, reorderIssues, moveIssueBetweenSprintsOptimistic } from '../board/boardSlice';
import { getSprints, createSprint, startSprint, completeSprint } from '../sprint/sprintSlice';
import { toast } from 'react-toastify';
import { ListTodo, Plus, Loader2, ChevronRight, Bug, BookOpen, CheckSquare, Zap, Search } from 'lucide-react';
import { filterIssuesJQL } from '../../utils/jql';
import { useHotkeys } from '../../hooks/useHotkeys';
import CreateIssueModal from '../board/CreateIssueModal';
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors, DragOverlay, defaultDropAnimationSideEffects, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const TYPE_ICONS = {
    bug: <Bug size={13} className="text-red-500" />,
    story: <BookOpen size={13} className="text-green-500" />,
    task: <CheckSquare size={13} className="text-blue-500" />,
    epic: <Zap size={13} className="text-purple-500" />,
    subtask: <CheckSquare size={13} className="text-gray-400" />,
};

const PRIORITY_COLORS = {
    critical: 'bg-red-500/10 text-red-500 border-red-500/20',
    high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    medium: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    low: 'bg-v-muted/10 text-v-muted border-v-border',
};

const BacklogPage = () => {
    const { projectId } = useParams();
    const dispatch = useDispatch();
    const { issues, isLoading: issuesLoading } = useSelector(state => state.board);
    const { sprints, isLoading: sprintsLoading } = useSelector(state => state.sprint);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newSprintName, setNewSprintName] = useState('');
    const [showCreateSprint, setShowCreateSprint] = useState(false);
    const [activeDragIssue, setActiveDragIssue] = useState(null);
    const [jqlQuery, setJqlQuery] = useState('');

    useHotkeys({
        'c': () => setIsCreateOpen(true),
        '/': () => {
            const searchInput = document.getElementById('backlog-search-input');
            if (searchInput) searchInput.focus();
        },
    });

    useEffect(() => {
        if (projectId) {
            dispatch(getIssues(projectId));
            dispatch(getSprints(projectId));
        }
    }, [projectId, dispatch]);

    const filteredTotalIssues = filterIssuesJQL(issues, jqlQuery);
    const backlogIssues = filteredTotalIssues.filter(i => !i.sprint);
    const isLoading = issuesLoading || sprintsLoading;

    const handleCreateSprint = async () => {
        if (!newSprintName.trim()) return;
        dispatch(createSprint({ project: projectId, name: newSprintName }))
            .unwrap()
            .then(() => {
                toast.success('Sprint created!');
                setNewSprintName('');
                setShowCreateSprint(false);
            })
            .catch(err => toast.error(err || 'Failed to create sprint'));
    };

    const handleStartSprint = (sprintId) => {
        dispatch(startSprint(sprintId))
            .unwrap()
            .then(() => toast.success('Sprint started!'))
            .catch(err => toast.error(err));
    };

    const handleCompleteSprint = (sprintId) => {
        if (!window.confirm('Complete this sprint? Unfinished issues will move back to the backlog.')) return;
        dispatch(completeSprint(sprintId))
            .unwrap()
            .then(() => {
                toast.success('Sprint completed!');
                dispatch(getIssues(projectId)); // Refresh issues to see them in backlog
            })
            .catch(err => toast.error(err));
    };

    const assignToSprint = (issueId, sprintId, position = 0) => {
        const issue = issues.find(i => i._id === issueId);
        dispatch(reorderIssues({
            issueId,
            status: issue?.status || 'todo',
            position,
            projectId,
            sprintId
        }))
            .unwrap()
            .then(() => {
                toast.success(sprintId ? 'Issue added to sprint' : 'Issue moved to backlog');
            })
            .catch(err => {
                toast.error(err);
                dispatch(getIssues(projectId)); // Rollback on error
            });
    };

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    const handleDragStart = (event) => {
        const { active } = event;
        setActiveDragIssue(active.data.current?.issue || null);
    };

    const handleDragOver = (event) => {
        const { active, over } = event;
        if (!over) return;

        const activeIssue = active.data.current?.issue;
        const overData = over.data.current;

        // Find destination sprint
        const activeSprintId = activeIssue?.sprint?._id || activeIssue?.sprint || 'backlog';
        let overSprintId = 'backlog';
        if (overData?.type === 'SprintPanel') overSprintId = overData.sprintId;
        else if (overData?.type === 'Issue') overSprintId = overData.issue?.sprint?._id || overData.issue?.sprint || 'backlog';

        if (activeSprintId === overSprintId) return;

        // Optimistically move between sprints/backlog zones
        dispatch(moveIssueBetweenSprintsOptimistic({
            issueId: active.id,
            sprintId: overSprintId === 'backlog' ? null : overSprintId
        }));
    };

    const handleDragEnd = (event) => {
        setActiveDragIssue(null);
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overData = over.data.current;

        let overSprintId = 'backlog';
        if (overData?.type === 'SprintPanel') overSprintId = overData.sprintId;
        else if (overData?.type === 'Issue') overSprintId = overData.issue?.sprint?._id || overData.issue?.sprint || 'backlog';

        const sprintValue = overSprintId === 'backlog' ? null : overSprintId;

        const issue = issues.find(i => i._id === activeId);
        const currentSprintId = issue?.sprint?._id || issue?.sprint || 'backlog';

        // Calculate position based on nearby issues in the destination
        let position = 0;
        if (overData?.type === 'Issue') {
            const destIssues = filteredTotalIssues.filter(i => {
                const sid = i.sprint?._id || i.sprint || 'backlog';
                return sid === overSprintId;
            });
            position = destIssues.findIndex(i => i._id === over.id);
        }

        if (currentSprintId !== overSprintId || overData?.type === 'Issue') {
            assignToSprint(activeId, sprintValue, position);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    const futureSprints = sprints.filter(s => s.status === 'future');
    const activeSprints = sprints.filter(s => s.status === 'active');

    return (
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h1 className="text-lg sm:text-xl font-bold text-v-main flex-shrink-0">Backlog</h1>
                <div className="flex-1 w-full max-w-sm sm:mx-4">
                    <div className="relative flex items-center">
                        <Search className="absolute left-2.5 h-4 w-4 text-v-muted" />
                        <input
                            id="backlog-search-input"
                            type="text"
                            placeholder="Press / to search..."
                            value={jqlQuery}
                            onChange={(e) => setJqlQuery(e.target.value)}
                            className="w-full rounded-md border border-v-border bg-v-primary py-1.5 pl-9 pr-3 text-sm text-v-main focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        />
                    </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                    <button
                        onClick={() => setShowCreateSprint(!showCreateSprint)}
                        className="flex items-center gap-1.5 rounded-lg border border-v-border bg-v-primary px-2.5 sm:px-3 py-2 text-sm text-v-muted hover:bg-v-secondary transition-colors"
                    >
                        <Plus size={14} />
                        <span className="hidden sm:inline">Create Sprint</span>
                    </button>
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-2.5 sm:px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={14} />
                        <span className="hidden sm:inline">Create Issue</span>
                    </button>
                </div>
            </div>

            {/* Create sprint form */}
            {showCreateSprint && (
                <div className="flex items-center gap-3 rounded-xl bg-v-primary border border-v-border p-4 shadow-sm transition-colors">
                    <input
                        type="text"
                        placeholder="Sprint name (e.g. Sprint 1)"
                        value={newSprintName}
                        onChange={e => setNewSprintName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleCreateSprint()}
                        className="flex-1 rounded-lg border border-v-border bg-v-primary px-3 py-2 text-sm text-v-main focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={handleCreateSprint}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 transition-colors"
                    >
                        Create
                    </button>
                    <button
                        onClick={() => setShowCreateSprint(false)}
                        className="text-sm text-v-muted hover:text-v-main"
                    >
                        Cancel
                    </button>
                </div>
            )}

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                {/* Active Sprints */}
                {activeSprints.map(sprint => (
                    <SprintPanel
                        key={sprint._id}
                        sprint={sprint}
                        issues={filteredTotalIssues.filter(i => {
                            const sid = i.sprint?._id || i.sprint;
                            return sid === sprint._id;
                        })}
                        onAssignToSprint={assignToSprint}
                        allSprints={sprints}
                        badge={<span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Active</span>}
                        onComplete={() => handleCompleteSprint(sprint._id)}
                    />
                ))}

                {/* Future Sprints */}
                {futureSprints.map(sprint => (
                    <SprintPanel
                        key={sprint._id}
                        sprint={sprint}
                        issues={filteredTotalIssues.filter(i => {
                            const sid = i.sprint?._id || i.sprint;
                            return sid === sprint._id;
                        })}
                        onAssignToSprint={assignToSprint}
                        allSprints={sprints}
                        onStart={() => handleStartSprint(sprint._id)}
                    />
                ))}

                {/* Backlog panel */}
                <SprintPanel
                    sprint={{ _id: 'backlog', name: 'Backlog', isBacklog: true }}
                    issues={backlogIssues}
                    onAssignToSprint={assignToSprint}
                    allSprints={sprints}
                    icon={<ListTodo size={16} className="text-gray-400" />}
                />

                <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }) }}>
                    {activeDragIssue ? <IssueRow issue={activeDragIssue} sprints={[]} onAssignToSprint={() => { }} isOverlay /> : null}
                </DragOverlay>
            </DndContext>

            <CreateIssueModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
        </div>
    );
};

const SprintPanel = ({ sprint, issues, onAssignToSprint, allSprints, badge, onStart, icon, onComplete }) => {
    const [collapsed, setCollapsed] = useState(false);

    // Correct hook usage:
    const { setNodeRef: dropRef, isOver: isZoneOver } = useDroppable({
        id: sprint._id,
        data: { type: 'SprintPanel', sprintId: sprint._id }
    });

    return (
        <div ref={dropRef} className={`rounded-xl bg-v-primary border shadow-sm overflow-hidden transition-colors ${isZoneOver ? 'border-blue-500 bg-blue-500/5' : 'border-v-border'}`}>
            <div className="flex items-center justify-between bg-v-secondary px-4 py-3 border-b border-v-border">
                <div className="flex items-center gap-2">
                    {!sprint.isBacklog && (
                        <button onClick={() => setCollapsed(!collapsed)} className="text-v-muted hover:text-v-main">
                            <ChevronRight size={16} className={`transition-transform ${collapsed ? '' : 'rotate-90'}`} />
                        </button>
                    )}
                    {icon}
                    <h2 className="text-sm font-semibold text-v-main">{sprint.name}</h2>
                    {badge}
                    <span className="text-xs text-v-muted">({issues.length} issues)</span>
                </div>
                {onStart && (
                    <button
                        onClick={onStart}
                        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors"
                    >
                        Start Sprint
                    </button>
                )}
                {onComplete && (
                    <button
                        onClick={onComplete}
                        className="rounded-lg bg-gray-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700 transition-colors"
                    >
                        Complete Sprint
                    </button>
                )}
            </div>
            {!collapsed && (
                <div className="divide-y divide-v-border min-h-[40px]">
                    {issues.length === 0 ? (
                        <p className="py-4 text-center text-xs text-v-muted">No issues here. Drop some!</p>
                    ) : (
                        <SortableContext items={issues.map(i => i._id)} strategy={verticalListSortingStrategy}>
                            {issues.map(issue => (
                                <IssueRow
                                    key={issue._id}
                                    issue={issue}
                                    sprints={allSprints.filter(s => s.status !== 'completed')}
                                    onAssignToSprint={onAssignToSprint}
                                    showMoveBacklog={!sprint.isBacklog}
                                />
                            ))}
                        </SortableContext>
                    )}
                </div>
            )}
        </div>
    );
};

const IssueRow = ({ issue, sprints, onAssignToSprint, showMoveBacklog, isOverlay }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: issue._id,
        data: { type: 'Issue', issue }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 bg-v-primary hover:bg-v-secondary border-b border-v-border last:border-0 transition-colors group cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50 relative z-50 ring-1 ring-blue-500 shadow-md' : ''} ${isOverlay ? 'shadow-xl ring-2 ring-blue-500 scale-[1.02] cursor-grabbing' : ''}`}
        >
            <span className="flex-shrink-0">{TYPE_ICONS[issue.type] || TYPE_ICONS.task}</span>
            <span className="text-xs text-v-muted font-mono w-12 sm:w-16 flex-shrink-0 truncate">{issue.key}</span>
            <span className="flex-1 text-sm text-v-main truncate min-w-0">{issue.title}</span>
            <span className={`hidden sm:inline-flex rounded border px-2 py-0.5 text-[10px] font-semibold uppercase flex-shrink-0 ${PRIORITY_COLORS[issue.priority]}`}>
                {issue.priority}
            </span>
            <div className="flex gap-1 flex-shrink-0 pointer-events-auto" onPointerDown={e => e.stopPropagation()}>
                {sprints.length > 0 && (
                    <select
                        defaultValue=""
                        onChange={e => { if (e.target.value) onAssignToSprint(issue._id, e.target.value); }}
                        className="rounded border border-v-border bg-v-secondary text-xs px-1 py-1 text-v-muted focus:outline-none max-w-[90px] sm:max-w-none transition-colors"
                    >
                        <option value="" disabled className="bg-v-primary">Sprint</option>
                        {sprints.map(s => <option key={s._id} value={s._id} className="bg-v-primary">{s.name}</option>)}
                    </select>
                )}
                {showMoveBacklog && (
                    <button
                        onClick={() => onAssignToSprint(issue._id, null)}
                        className="rounded border border-v-border bg-v-secondary text-xs px-1.5 sm:px-2 py-1 text-v-muted hover:bg-v-primary transition-colors whitespace-nowrap"
                    >
                        ↩
                    </button>
                )}
            </div>
        </div>
    );
};

export default BacklogPage;
