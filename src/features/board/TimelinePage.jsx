import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getIssues } from './boardSlice';
import { Loader2, Calendar } from 'lucide-react';
import { format, differenceInDays, addDays, startOfWeek, endOfWeek } from 'date-fns';

const TimelinePage = () => {
    const { projectId } = useParams();
    const dispatch = useDispatch();
    const { issues, isLoading } = useSelector((state) => state.board);
    const [viewRange, setViewRange] = useState(30); // days to show

    useEffect(() => {
        if (projectId) {
            dispatch(getIssues(projectId));
        }
    }, [projectId, dispatch]);

    const timelineData = useMemo(() => {
        if (!issues) return [];
        return issues
            .filter(i => i.dueDate) // Only issues with due dates
            .map(issue => {
                const start = new Date(issue.createdAt);
                const end = new Date(issue.dueDate);
                return { ...issue, start, end };
            })
            .sort((a, b) => a.start - b.start);
    }, [issues]);

    if (isLoading) {
        return <div className="flex h-64 items-center justify-center"><Loader2 size={32} className="animate-spin text-blue-500" /></div>;
    }

    if (timelineData.length === 0) {
        return (
            <div className="flex h-64 flex-col items-center justify-center text-v-muted gap-2">
                <Calendar size={48} className="opacity-20" />
                <p>No issues with due dates found.</p>
                <p className="text-sm">Set due dates on issues to see them on the timeline.</p>
            </div>
        );
    }

    const minDate = new Date(Math.min(...timelineData.map(d => d.start)));
    const maxDate = new Date(Math.max(...timelineData.map(d => d.end)));
    
    // Create an array of days to render the grid
    const totalDays = Math.max(30, differenceInDays(maxDate, minDate) + 5);
    const startDate = addDays(minDate, -2);
    
    const days = Array.from({ length: totalDays }).map((_, i) => addDays(startDate, i));

    return (
        <div className="flex flex-col h-full bg-v-primary rounded-xl border border-v-border overflow-hidden">
            <div className="px-5 py-4 border-b border-v-border flex items-center justify-between">
                <h2 className="text-base font-bold text-v-main flex items-center gap-2">
                    <Calendar size={20} className="text-blue-500" />
                    Project Timeline
                </h2>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
                <div className="relative min-w-max">
                    {/* Header: Months/Days */}
                    <div className="flex border-b border-v-border pb-2 mb-4">
                        <div className="w-48 flex-shrink-0 sticky left-0 bg-v-primary z-10 font-semibold text-sm text-v-muted pl-2">
                            Issue
                        </div>
                        <div className="flex flex-1">
                            {days.map((day, i) => (
                                <div key={i} className="w-10 flex-shrink-0 flex flex-col items-center text-xs text-v-muted">
                                    <span className="opacity-50">{format(day, 'MMM')}</span>
                                    <span className={format(day, 'E') === 'Sat' || format(day, 'E') === 'Sun' ? 'text-red-400 opacity-50' : 'text-v-main'}>
                                        {format(day, 'dd')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Timeline Rows */}
                    <div className="flex flex-col gap-3">
                        {timelineData.map(issue => {
                            const offsetDays = differenceInDays(issue.start, startDate);
                            const durationDays = Math.max(1, differenceInDays(issue.end, issue.start));
                            
                            // Color based on status
                            let bgColor = 'bg-blue-500';
                            if (issue.status === 'done') bgColor = 'bg-green-500';
                            if (issue.status === 'in_progress') bgColor = 'bg-yellow-500';

                            return (
                                <div key={issue._id} className="flex items-center group">
                                    {/* Issue Title (Sticky) */}
                                    <div className="w-48 flex-shrink-0 sticky left-0 bg-v-primary z-10 pr-4 truncate text-sm text-v-main">
                                        <span className="text-v-muted text-xs mr-2">{issue.key}</span>
                                        {issue.title}
                                    </div>
                                    
                                    {/* Timeline Track */}
                                    <div className="flex flex-1 relative h-8 items-center border-l border-v-border/30">
                                        {/* Grid lines */}
                                        <div className="absolute inset-0 flex pointer-events-none">
                                            {days.map((_, i) => (
                                                <div key={i} className="w-10 flex-shrink-0 border-r border-v-border/10 h-full" />
                                            ))}
                                        </div>
                                        
                                        {/* The Bar */}
                                        <div 
                                            className={`absolute h-6 rounded-md ${bgColor} text-white text-xs flex items-center px-2 truncate shadow-sm transition-transform hover:scale-y-110 cursor-pointer`}
                                            style={{
                                                left: `${offsetDays * 40}px`,
                                                width: `${durationDays * 40}px`
                                            }}
                                            title={`${issue.title} (${format(issue.start, 'MMM dd')} - ${format(issue.end, 'MMM dd')})`}
                                        >
                                            {durationDays > 2 && <span className="truncate">{issue.title}</span>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimelinePage;
