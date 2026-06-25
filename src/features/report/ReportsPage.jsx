import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getIssues } from '../board/boardSlice';
import { getSprints } from '../sprint/sprintSlice';
import { Loader2, BarChart2, PieChart as PieChartIcon, Activity, TrendingUp } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
    PieChart, Pie, Legend, LineChart, Line, CartesianGrid,
    Tooltip as RechartsTooltip
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

const ReportsPage = () => {
    const { projectId } = useParams();
    const dispatch = useDispatch();
    const { isDarkMode } = useTheme();
    const { issues, isLoading: issuesLoading } = useSelector((state) => state.board);
    const { sprints, isLoading: sprintsLoading } = useSelector((state) => state.sprint);
    const isLoading = issuesLoading || sprintsLoading;

    // Theme-aware colors for Recharts
    const textColor = isDarkMode ? '#f1f5f9' : '#1e293b'; // text-main
    const mutedColor = isDarkMode ? '#94a3b8' : '#64748b'; // text-muted
    const gridColor = isDarkMode ? '#1e293b' : '#f1f5f9'; // border-main
    const tooltipBg = isDarkMode ? '#1e293b' : '#ffffff';
    const tooltipBorder = isDarkMode ? '#334155' : '#e2e8f0';

    useEffect(() => {
        if (projectId) {
            dispatch(getIssues(projectId));
            dispatch(getSprints(projectId));
        }
    }, [projectId, dispatch]);

    if (isLoading) {
        return <div className="flex h-64 items-center justify-center"><Loader2 size={32} className="animate-spin text-blue-500" /></div>;
    }

    // 1. Status Distribution
    const statusCounts = issues.reduce((acc, issue) => {
        acc[issue.status] = (acc[issue.status] || 0) + 1;
        return acc;
    }, {});
    const statusData = Object.keys(statusCounts).map((status, index) => ({
        name: status.toUpperCase(),
        value: statusCounts[status],
        fill: COLORS[index % COLORS.length]
    }));

    // 2. Priority Breakdown
    const priorityCounts = issues.reduce((acc, issue) => {
        acc[issue.priority] = (acc[issue.priority] || 0) + 1;
        return acc;
    }, {});
    const priorityData = Object.keys(priorityCounts).map((priority, index) => ({
        name: priority.toUpperCase(),
        value: priorityCounts[priority],
        fill: COLORS[(index + 2) % COLORS.length]
    }));

    // 3. Assignee Workload
    const assigneeCounts = issues.reduce((acc, issue) => {
        const name = issue.assignee?.name || 'Unassigned';
        acc[name] = (acc[name] || 0) + 1;
        return acc;
    }, {});
    const assigneeData = Object.keys(assigneeCounts).map((name) => ({
        name: name.split(' ')[0], // First name only for space
        count: assigneeCounts[name]
    })).sort((a, b) => b.count - a.count);

    // 4. Sprint Velocity
    const velocityData = sprints
        .filter(s => s.status !== 'planned') // Only show active or completed
        .map(sprint => {
            const sprintIssues = issues.filter(i => {
                const sId = i.sprint?._id || i.sprint;
                return sId === sprint._id;
            });

            const planned = sprintIssues.reduce((sum, i) => sum + (Number(i.storyPoints) || 0), 0);
            const actual = sprintIssues
                .filter(i => i.status === 'done')
                .reduce((sum, i) => sum + (Number(i.storyPoints) || 0), 0);

            return {
                name: sprint.name,
                planned,
                actual
            };
        });

    // Burndown data for active sprint
    const activeSprintData = sprints.find(s => s.status === 'active');
    let burndownData = [];
    if (activeSprintData) {
        const start = new Date(activeSprintData.startDate);
        const end = new Date(activeSprintData.endDate);
        const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

        const sprintIssues = issues.filter(i => {
            const sId = i.sprint?._id || i.sprint;
            return sId === activeSprintData._id;
        });

        const totalPoints = sprintIssues.reduce((sum, i) => sum + (Number(i.storyPoints) || 0), 0);

        for (let i = 0; i <= diffDays; i++) {
            const currentDate = new Date(start);
            currentDate.setDate(start.getDate() + i);

            const pointsDoneByNow = sprintIssues
                .filter(issue => issue.status === 'done' && issue.updatedAt && new Date(issue.updatedAt) <= currentDate)
                .reduce((sum, issue) => sum + (Number(issue.storyPoints) || 0), 0);

            burndownData.push({
                day: `Day ${i}`,
                remaining: totalPoints - pointsDoneByNow,
                ideal: totalPoints - (totalPoints / diffDays) * i
            });
        }
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 transition-colors">
            <h1 className="text-xl font-bold text-v-main flex items-center gap-2">
                <BarChart2 size={24} className="text-blue-500" />
                Project Reports
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Status Distribution */}
                <div className="bg-v-primary p-5 rounded-xl border border-v-border shadow-sm transition-colors">
                    <h3 className="text-sm font-semibold text-v-muted uppercase tracking-widest mb-6 flex items-center gap-2">
                        <PieChartIcon size={16} /> Status Distribution
                    </h3>
                    <div className="h-64 min-h-[256px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <RechartsTooltip
                                    contentStyle={{
                                        backgroundColor: tooltipBg,
                                        borderColor: tooltipBorder,
                                        color: textColor,
                                        borderRadius: '8px',
                                        border: '1px solid',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                    }}
                                    itemStyle={{ color: textColor }}
                                />
                                <Legend wrapperStyle={{ color: textColor, paddingTop: '10px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Priority Breakdown */}
                <div className="bg-v-primary p-5 rounded-xl border border-v-border shadow-sm transition-colors">
                    <h3 className="text-sm font-semibold text-v-muted uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Activity size={16} /> Priority Breakdown
                    </h3>
                    <div className="h-64 min-h-[256px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={priorityData} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: mutedColor }} />
                                <RechartsTooltip
                                    cursor={{ fill: gridColor, opacity: 0.1 }}
                                    contentStyle={{
                                        backgroundColor: tooltipBg,
                                        borderColor: tooltipBorder,
                                        color: textColor,
                                        borderRadius: '8px',
                                        border: '1px solid',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                    }}
                                    itemStyle={{ color: textColor }}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                                    {priorityData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Assignee Workload */}
                <div className="bg-v-primary p-5 rounded-xl border border-v-border shadow-sm md:col-span-2 transition-colors">
                    <h3 className="text-sm font-semibold text-v-muted uppercase tracking-widest mb-6 flex items-center gap-2">
                        <BarChart2 size={16} /> Assignee Workload
                    </h3>
                    <div className="h-72 min-h-[288px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={assigneeData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: mutedColor }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: mutedColor }} />
                                <RechartsTooltip
                                    cursor={{ fill: gridColor, opacity: 0.2 }}
                                    contentStyle={{
                                        backgroundColor: tooltipBg,
                                        borderColor: tooltipBorder,
                                        color: textColor,
                                        borderRadius: '8px',
                                        border: '1px solid',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                    }}
                                    itemStyle={{ color: textColor }}
                                />
                                <Bar dataKey="count" fill="#818cf8" radius={[4, 4, 0, 0]} maxBarSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Sprint Velocity */}
                <div className="bg-v-primary p-5 rounded-xl border border-v-border shadow-sm md:col-span-2 transition-colors">
                    <h3 className="text-sm font-semibold text-v-muted uppercase tracking-widest mb-6 flex items-center gap-2">
                        <TrendingUp size={16} /> Sprint Velocity
                    </h3>
                    <div className="h-72 min-h-[288px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={velocityData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: mutedColor }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: mutedColor }} label={{ value: 'Story Points', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 12, fill: mutedColor } }} />
                                <RechartsTooltip
                                    cursor={{ fill: gridColor, opacity: 0.2 }}
                                    contentStyle={{
                                        backgroundColor: tooltipBg,
                                        borderColor: tooltipBorder,
                                        color: textColor,
                                        borderRadius: '8px',
                                        border: '1px solid',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                    }}
                                    itemStyle={{ color: textColor }}
                                />
                                <Legend verticalAlign="top" height={36} wrapperStyle={{ color: textColor }} />
                                <Bar dataKey="planned" name="Planned" fill="#cbd5e1" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                <Bar dataKey="actual" name="Actual" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Burndown Chart */}
                <div className="bg-v-primary p-5 rounded-xl border border-v-border shadow-sm md:col-span-2 transition-colors">
                    <h3 className="text-sm font-semibold text-v-muted uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Activity size={16} /> Sprint Burndown
                    </h3>
                    <div className="h-72 min-h-[288px]">
                        {activeSprintData ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={burndownData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: mutedColor }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: mutedColor }} label={{ value: 'Story Points', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 12, fill: mutedColor } }} />
                                    <RechartsTooltip
                                        contentStyle={{
                                            backgroundColor: tooltipBg,
                                            borderColor: tooltipBorder,
                                            color: textColor,
                                            borderRadius: '8px',
                                            border: '1px solid',
                                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                                        }}
                                        itemStyle={{ color: textColor }}
                                    />
                                    <Legend verticalAlign="top" height={36} wrapperStyle={{ color: textColor }} />
                                    <Line type="monotone" dataKey="ideal" name="Ideal Burn" stroke={isDarkMode ? '#475569' : '#94a3b8'} strokeDasharray="5 5" dot={false} strokeWidth={2} />
                                    <Line type="stepAfter" dataKey="remaining" name="Remaining Work" stroke="#f97316" strokeWidth={3} dot={{ r: 4, fill: '#f97316' }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-v-muted text-sm italic">
                                No active sprint data found for burndown calculation.
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ReportsPage;
