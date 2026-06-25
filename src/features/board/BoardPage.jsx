import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors, DragOverlay, defaultDropAnimationSideEffects } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { getBoards, getIssues, updateIssueStatus, moveIssueOptimistic, createIssue, reorderIssues } from './boardSlice';
import { getSprints } from '../sprint/sprintSlice';
import Column from './Column';
import IssueCard from './IssueCard';
import IssueModal from './IssueModal';
import CreateIssueModal from './CreateIssueModal';
import { MeetingScheduler } from '../meeting/MeetingScheduler';
import { Loader2, Plus, Filter, Search } from 'lucide-react';
import { socket } from '../../utils/socket';
import { toast } from 'react-toastify';
import { filterIssuesJQL } from '../../utils/jql';
import { useHotkeys } from '../../hooks/useHotkeys';

const BoardPage = () => {
    const { projectId } = useParams();
    const dispatch = useDispatch();
    const { boards, currentBoard, issues, isLoading } = useSelector((state) => state.board);
    const { sprints, activeSprint } = useSelector((state) => state.sprint);
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [sprintFilter, setSprintFilter] = useState('active');
    const [typeFilter, setTypeFilter] = useState('all');
    const [assigneeFilter, setAssigneeFilter] = useState('all');
    const [jqlQuery, setJqlQuery] = useState('');
    const [orgUsers, setOrgUsers] = useState([]);
    const [activeDragIssue, setActiveDragIssue] = useState(null);
    const { user } = useSelector((state) => state.auth);

    // Global Hotkeys
    useHotkeys({
        'c': () => setIsCreateModalOpen(true),
        '/': () => {
            const searchInput = document.getElementById('board-search-input');
            if (searchInput) searchInput.focus();
        },
    });

    useEffect(() => {
        if (projectId) {
            dispatch(getBoards(projectId));
            dispatch(getIssues(projectId));
            dispatch(getSprints(projectId));

            socket.connect();
            socket.emit('join:project', projectId);

            socket.on('issue:updated', (updatedIssue) => {
                toast.info(`Issue was updated by another user`);
                dispatch(getIssues(projectId)); // Refresh for safety on simple update
            });

            socket.on('issue:reordered', (data) => {
                // If it was moved in our current view, we should refresh issues to see correct ordering
                dispatch(getIssues(projectId));
            });

            return () => {
                socket.off('issue:updated');
                socket.off('issue:reordered');
                socket.emit('leave:project', projectId);
                socket.disconnect();
            };
        }
    }, [projectId, dispatch]);

    // Load org users for assignee filter
    useEffect(() => {
        if (user) {
            import('../../utils/axiosInstance').then(({ default: axiosInstance }) => {
                axiosInstance.get('/users')
                    .then(res => setOrgUsers(res.data))
                    .catch(() => { });
            });
        }
    }, [user]);

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
        const overId = over.id;
        const overData = over.data.current;

        const activeStatus = activeIssue?.status;
        const overStatus = overData?.type === 'Column' ? overData.column.status : overData?.issue?.status;

        if (!activeStatus || !overStatus || activeStatus === overStatus) {
            return;
        }

        // Optimistic move across columns
        dispatch(moveIssueOptimistic({ issueId: active.id, status: overStatus, position: 0 }));
    };

    const handleDragEnd = (event) => {
        setActiveDragIssue(null);
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        const activeIssue = issues.find(i => i._id === activeId);
        const overData = over.data.current;

        const newStatus = overData?.type === 'Column' ? overData.column.status : overData?.issue?.status;
        if (!newStatus) return;

        // In a real robust system, calculate exact rank/position. 
        // For simplicity, we stick to status update and basic order.
        let position = 0;
        if (overData?.type === 'Issue') {
            const columnIssues = getFilteredIssues().filter(i => i.status === newStatus).sort((a, b) => a.position - b.position);
            const overIndex = columnIssues.findIndex(i => i._id === overId);
            position = overIndex;
        }

        dispatch(moveIssueOptimistic({ issueId: activeId, status: newStatus, position }));

        // Only send API request if it actually changed
        if (activeIssue.status !== newStatus || position !== activeIssue.position) {
            dispatch(reorderIssues({
                issueId: activeId,
                status: newStatus,
                position,
                projectId,
                sprintId: activeIssue.sprint?._id || activeIssue.sprint
            }));
            // No need for separate socket.emit; the backend reorderIssues service handles it
        }
    };

    // Filter issues by sprint + type + assignee
    const getFilteredIssues = () => {
        let filtered = issues;

        // Sprint filter
        if (sprintFilter === 'active' && activeSprint) {
            filtered = filtered.filter(i => i.sprint === activeSprint._id || i.sprint?._id === activeSprint._id);
        } else if (sprintFilter !== 'all') {
            const sprint = sprints.find(s => s._id === sprintFilter);
            if (sprint) filtered = filtered.filter(i => i.sprint === sprint._id || i.sprint?._id === sprint._id);
        }

        // Type filter
        if (typeFilter !== 'all') filtered = filtered.filter(i => i.type === typeFilter);

        // Assignee filter
        if (assigneeFilter === 'unassigned') filtered = filtered.filter(i => !i.assignee);
        else if (assigneeFilter !== 'all') filtered = filtered.filter(i => (i.assignee?._id || i.assignee) === assigneeFilter);

        // Apply JQL advanced filtering
        filtered = filterIssuesJQL(filtered, jqlQuery);

        return [...filtered].sort((a, b) => a.position - b.position);
    };

    const filteredIssues = getFilteredIssues();

    if (isLoading && !currentBoard) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }

    if (!currentBoard) return (
        <div className="flex h-full items-center justify-center text-v-muted">
            <p>No board found for this project.</p>
        </div>
    );

    return (
        <div className="flex h-full flex-col -m-4 sm:-m-6">
            {/* Board Header */}
            <div className="flex flex-col gap-3 border-b border-v-border bg-v-primary px-4 py-3 sm:px-6 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3 min-w-0">
                    <h1 className="text-base sm:text-lg font-bold text-v-main truncate">{currentBoard.name}</h1>
                    {activeSprint && (
                        <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 flex-shrink-0">
                            {activeSprint.name} · Active
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:ml-auto">
                    {/* JQL Search Bar */}
                    <div className="relative flex items-center">
                        <Search className="absolute left-2.5 h-3.5 w-3.5 text-v-muted" />
                        <input
                            id="board-search-input"
                            type="text"
                            placeholder="Press / to search..."
                            value={jqlQuery}
                            onChange={(e) => setJqlQuery(e.target.value)}
                            className="w-full sm:w-48 rounded-md border border-v-border bg-v-primary py-1.5 pl-8 pr-3 text-xs sm:text-sm text-v-main placeholder:text-v-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Sprint filter */}
                    <select
                        value={sprintFilter}
                        onChange={e => setSprintFilter(e.target.value)}
                        className="rounded-md border border-v-border bg-v-primary px-2 py-1.5 text-xs sm:text-sm text-v-main focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Issues</option>
                        <option value="active">Active Sprint</option>
                        {sprints.map(s => (
                            <option key={s._id} value={s._id}>{s.name}</option>
                        ))}
                    </select>

                    {/* Type filter */}
                    <select
                        value={typeFilter}
                        onChange={e => setTypeFilter(e.target.value)}
                        className="rounded-md border border-v-border bg-v-primary px-2 py-1.5 text-xs sm:text-sm text-v-main focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Types</option>
                        <option value="task">Task</option>
                        <option value="bug">Bug</option>
                        <option value="story">Story</option>
                        <option value="epic">Epic</option>
                        <option value="subtask">Subtask</option>
                    </select>

                    {/* Assignee filter */}
                    {orgUsers.length > 0 && (
                        <select
                            value={assigneeFilter}
                            onChange={e => setAssigneeFilter(e.target.value)}
                            className="rounded-md border border-v-border bg-v-primary px-2 py-1.5 text-xs sm:text-sm text-v-main focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Assignees</option>
                            <option value="unassigned">Unassigned</option>
                            {orgUsers.map(u => (
                                <option key={u._id} value={u._id}>{u.name}</option>
                            ))}
                        </select>
                    )}

                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-xs sm:text-sm font-medium text-white hover:bg-blue-700 transition-colors flex-shrink-0"
                    >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Create Issue</span>
                    </button>
                    <MeetingScheduler projectId={projectId} onSuccess={(meeting) => toast.success(`Meeting '${meeting.title}' scheduled!`)} />
                </div>
            </div>

            {/* Board Columns - horizontal scroll on mobile */}
            <div className="flex-1 overflow-x-auto bg-v-secondary p-3 sm:p-6 transition-colors duration-300">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                >
                    <div className="flex h-full gap-3 sm:gap-4" style={{ minWidth: 'max-content', minHeight: 500 }}>
                        {currentBoard.columns.map((column) => (
                            <div key={column.status} className="w-64 sm:w-72 flex-shrink-0">
                                <Column
                                    column={column}
                                    issues={filteredIssues.filter((i) => i.status === column.status)}
                                    onIssueClick={setSelectedIssue}
                                />
                            </div>
                        ))}
                    </div>
                    <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }) }}>
                        {activeDragIssue ? <IssueCard issue={activeDragIssue} onClick={() => { }} /> : null}
                    </DragOverlay>
                </DndContext>
            </div>

            <IssueModal
                isOpen={!!selectedIssue}
                onClose={() => setSelectedIssue(null)}
                issue={selectedIssue}
            />

            <CreateIssueModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </div>
    );
};

export default BoardPage;
