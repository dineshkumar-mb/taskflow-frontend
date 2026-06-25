import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import IssueCard from './IssueCard';
import { Plus } from 'lucide-react';

const COLUMN_COLORS = {
    todo: 'border-gray-300',
    'in-progress': 'border-blue-400',
    done: 'border-green-400',
    review: 'border-yellow-400',
};

const Column = ({ column, issues, onIssueClick, onCreateIssue }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: column.status,
        data: {
            type: 'Column',
            column
        }
    });

    return (
        <div className={`flex w-72 flex-shrink-0 flex-col rounded-xl bg-v-secondary border-t-2 ${COLUMN_COLORS[column.status] || 'border-v-border'}`}>
            {/* Column Header */}
            <div className="flex items-center justify-between px-3 py-3">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-v-main">
                        {column.name}
                    </h3>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-v-primary text-xs font-medium text-v-muted border border-v-border">
                        {issues.length}
                    </span>
                </div>
            </div>

            <div
                ref={setNodeRef}
                className={`flex-1 overflow-y-auto px-2 pb-2 transition-colors ${isOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                style={{ minHeight: '100px' }}
            >
                <div className="flex flex-col gap-2 min-h-full">
                    <SortableContext items={issues.map(i => i._id)} strategy={verticalListSortingStrategy}>
                        {issues.map((issue) => (
                            <IssueCard key={issue._id} issue={issue} onClick={onIssueClick} />
                        ))}
                    </SortableContext>
                </div>
            </div>
        </div>
    );
};

export default Column;
