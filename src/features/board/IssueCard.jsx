import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Bug, BookOpen, CheckSquare, Zap, AlertCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const PRIORITY_COLORS = {
    critical: 'bg-red-500/10 text-red-500 border-red-500/20',
    high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    medium: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    low: 'bg-v-muted/10 text-v-muted border-v-border',
};

const PRIORITY_DOTS = {
    critical: 'bg-red-500',
    high: 'bg-orange-400',
    medium: 'bg-blue-400',
    low: 'bg-gray-300',
};

const TYPE_ICONS = {
    bug: <Bug size={12} className="text-red-500" />,
    story: <BookOpen size={12} className="text-green-500" />,
    task: <CheckSquare size={12} className="text-blue-500" />,
    epic: <Zap size={12} className="text-purple-500" />,
    subtask: <AlertCircle size={12} className="text-gray-400" />,
};

const LABEL_COLORS = [
    'bg-blue-500/10 text-blue-500 border-blue-500/20',
    'bg-purple-500/10 text-purple-500 border-purple-500/20',
    'bg-green-500/10 text-green-500 border-green-500/20',
    'bg-orange-500/10 text-orange-500 border-orange-500/20',
    'bg-rose-500/10 text-rose-500 border-rose-500/20',
];

const IssueCard = ({ issue, onClick }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: issue._id,
        data: {
            type: 'Issue',
            issue,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onClick={() => onClick(issue)}
            className={`group cursor-grab active:cursor-grabbing rounded-xl bg-v-primary p-3.5 shadow-sm border border-v-border hover:border-blue-500/50 hover:shadow-md transition-all select-none ${isDragging ? 'opacity-50 shadow-xl ring-2 ring-blue-500 rotate-1 z-50 relative' : ''}`}
        >
            {/* Issue key + type */}
            <div className="flex items-center gap-1.5 mb-2.5">
                <span className="flex-shrink-0">{TYPE_ICONS[issue.type] || TYPE_ICONS.task}</span>
                {issue.key && (
                    <span className="text-xs text-v-muted font-mono">{issue.key}</span>
                )}
                <div className={`ml-auto h-2 w-2 rounded-full flex-shrink-0 ${PRIORITY_DOTS[issue.priority] || PRIORITY_DOTS.medium}`} title={`Priority: ${issue.priority}`} />
            </div>

            {/* Title */}
            <p className="text-sm font-medium text-v-main leading-snug mb-2.5 group-hover:text-blue-500 transition-colors">
                {issue.title}
            </p>

            {/* Labels */}
            {issue.labels?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2.5">
                    {issue.labels.slice(0, 3).map((label, i) => (
                        <span
                            key={i}
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${LABEL_COLORS[i % LABEL_COLORS.length]}`}
                        >
                            {label}
                        </span>
                    ))}
                    {issue.labels.length > 3 && (
                        <span className="text-[10px] text-v-muted">+{issue.labels.length - 3}</span>
                    )}
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${PRIORITY_COLORS[issue.priority] || PRIORITY_COLORS.medium}`}>
                    {issue.priority}
                </span>

                <div className="flex items-center gap-2">
                    {issue.dueDate && (
                        <span className={`flex items-center gap-1 text-[10px] font-medium border rounded px-1.5 py-0.5 ${new Date(issue.dueDate) < new Date() && issue.status !== 'done' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-v-secondary text-v-muted border-v-border'}`}>
                            <Calendar size={10} />
                            {format(new Date(issue.dueDate), 'MMM d')}
                        </span>
                    )}
                    {issue.storyPoints && (
                        <span className="text-[10px] text-v-muted bg-v-secondary border border-v-border rounded px-1.5 py-0.5 font-medium">{issue.storyPoints}sp</span>
                    )}
                    {issue.assignee ? (
                        <div
                            className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] text-white font-bold flex-shrink-0 ring-1 ring-border-main"
                            title={issue.assignee.name}
                        >
                            {issue.assignee.name?.charAt(0).toUpperCase()}
                        </div>
                    ) : (
                        <div className="h-6 w-6 rounded-full border-2 border-dashed border-v-border flex-shrink-0" title="Unassigned" />
                    )}
                </div>
            </div>
        </div>
    );
};

export default IssueCard;
