import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import IssueCard from './IssueCard';
import { Plus, CheckCircle2, Clock, CircleDot, AlertCircle } from 'lucide-react';

const COLUMN_CONFIG = {
    todo: {
        dotColor: 'bg-slate-400 dark:bg-slate-500',
        borderColor: 'border-t-slate-400 dark:border-t-slate-500',
        icon: CircleDot,
    },
    'in-progress': {
        dotColor: 'bg-blue-500',
        borderColor: 'border-t-blue-500',
        icon: Clock,
    },
    review: {
        dotColor: 'bg-amber-500',
        borderColor: 'border-t-amber-500',
        icon: AlertCircle,
    },
    done: {
        dotColor: 'bg-emerald-500',
        borderColor: 'border-t-emerald-500',
        icon: CheckCircle2,
    },
};

const Column = ({ column, issues, onIssueClick, onCreateIssue }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: column.status,
        data: {
            type: 'Column',
            column
        }
    });

    const config = COLUMN_CONFIG[column.status] || {
        dotColor: 'bg-blue-400',
        borderColor: 'border-t-blue-400',
        icon: CircleDot,
    };
    const StatusIcon = config.icon;

    return (
        <div className={`flex w-72 sm:w-80 flex-shrink-0 flex-col rounded-2xl bg-v-secondary/90 border border-v-border border-t-[3px] ${config.borderColor} shadow-sm transition-all duration-200`}>
            {/* Column Header */}
            <div className="flex items-center justify-between px-3.5 py-3 border-b border-v-border/60">
                <div className="flex items-center gap-2 min-w-0">
                    <span className={`h-2 w-2 rounded-full flex-shrink-0 ${config.dotColor}`} />
                    <h3 className="text-xs sm:text-sm font-bold text-v-main truncate">
                        {column.name}
                    </h3>
                    <span className="flex h-5 min-w-[20px] px-1.5 items-center justify-center rounded-full bg-v-primary text-[11px] font-bold text-v-muted border border-v-border font-mono">
                        {issues.length}
                    </span>
                </div>

                {onCreateIssue && (
                    <button
                        onClick={() => onCreateIssue(column.status)}
                        className="p-1 rounded-lg text-v-muted hover:text-v-main hover:bg-v-primary transition-colors"
                        title={`Add issue to ${column.name}`}
                        aria-label={`Add issue to ${column.name}`}
                    >
                        <Plus size={16} />
                    </button>
                )}
            </div>

            {/* Droppable Issue Area */}
            <div
                ref={setNodeRef}
                className={`flex-1 overflow-y-auto p-2.5 transition-colors duration-150 rounded-b-2xl ${
                    isOver 
                        ? 'bg-blue-500/10 ring-2 ring-blue-500/30' 
                        : ''
                }`}
                style={{ minHeight: '180px' }}
            >
                {issues.length === 0 ? (
                    <div className="h-full min-h-[140px] flex flex-col items-center justify-center p-4 border border-dashed border-v-border rounded-xl text-center text-v-muted/70">
                        <StatusIcon size={20} className="mb-1.5 opacity-40 text-v-muted" />
                        <p className="text-xs font-medium text-v-muted">No issues</p>
                        <p className="text-[11px] text-v-muted/60 mt-0.5">Drag cards here</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2.5 min-h-full">
                        <SortableContext items={issues.map(i => i._id)} strategy={verticalListSortingStrategy}>
                            {issues.map((issue) => (
                                <IssueCard key={issue._id} issue={issue} onClick={onIssueClick} />
                            ))}
                        </SortableContext>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Column;
