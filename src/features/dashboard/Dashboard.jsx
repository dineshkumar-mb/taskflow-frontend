import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import {
    LayoutDashboard, Users, CheckSquare, Target,
    TrendingUp, AlertCircle, Clock
} from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';
import { motion } from 'framer-motion';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get('/analytics/org');
            setStats(res.data);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const handleExport = () => {
        if (!stats) return;

        const escapeCSV = (str) => {
            if (str === null || str === undefined) return '';
            const val = String(str);
            if (val.includes(',') || val.includes('"') || val.includes('\n')) {
                return `"${val.replace(/"/g, '""')}"`;
            }
            return val;
        };

        const csvRows = [
            ['Metric', 'Value'],
            ['Total Projects', stats.totalProjects],
            ['Total Issues', stats.totalIssues],
            [],
            ['Status Breakdown', 'Count']
        ];
        stats.statusStats.forEach(s => csvRows.push([s._id || 'Unknown', s.count]));
        csvRows.push([]);
        csvRows.push(['Priority Breakdown', 'Count']);
        stats.priorityStats.forEach(s => csvRows.push([s._id || 'Unknown', s.count]));

        // Add UTF-8 BOM for Microsoft Excel compatibility
        const csvContent = "\uFEFF" + csvRows.map(row => row.map(escapeCSV).join(",")).join("\r\n");
        const encodedUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `org_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div className="p-8">Loading Dashboard...</div>;
    if (!stats) return <div className="p-8 text-red-500">Failed to load dashboard data.</div>;

    // ── Transform statusByProject into Recharts grouped bar format ────────────
    // Shape: [{ status: "todo", "IDE Project": 1, "Demo Project": 2 }, ...]
    const rawByProject = stats.statusByProject || [];
    const projectKeys = [...new Set(rawByProject.map(r => r._id.project).filter(Boolean))];
    const allStatuses = [...new Set(rawByProject.map(r => r._id.status).filter(Boolean))];

    const statusData = allStatuses.map(status => {
        const row = { status };
        projectKeys.forEach(proj => {
            const found = rawByProject.find(r => r._id.status === status && r._id.project === proj);
            row[proj] = found ? found.count : 0;
        });
        return row;
    });

    // Fallback: if no statusByProject data (old API), use flat statusStats
    if (statusData.length === 0 && stats.statusStats?.length) {
        stats.statusStats.forEach(s => {
            statusData.push({ status: s._id, 'All Projects': s.count });
        });
        if (!projectKeys.length) projectKeys.push('All Projects');
    }

    const priorityData = stats.priorityStats.map(s => ({ name: s._id, value: s.count }));

    // ── Custom rich tooltip for the status bar chart ──────────────────────────
    const StatusTooltip = ({ active, payload, label }) => {
        if (!active || !payload?.length) return null;
        const statusLabel = label
            ? label.charAt(0).toUpperCase() + label.slice(1).replace(/-/g, ' ')
            : label;
        return (
            <div style={{
                background: 'var(--color-v-primary)',
                border: '1px solid var(--color-v-border)',
                borderRadius: 10,
                padding: '10px 14px',
                minWidth: 160,
                boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            }}>
                <p style={{ color: 'var(--color-v-muted)', fontSize: 11, marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Status: {statusLabel}
                </p>
                {payload.map((entry, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: entry.fill, flexShrink: 0 }} />
                        <span style={{ color: 'var(--color-v-main)', fontSize: 13 }}>
                            <strong>{entry.name}</strong>
                        </span>
                        <span style={{ marginLeft: 'auto', color: 'var(--color-v-muted)', fontSize: 13, fontWeight: 700 }}>
                            {entry.value} {entry.value === 1 ? 'issue' : 'issues'}
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="w-full">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-v-main">Organization Overview</h1>
                    <p className="text-v-muted text-sm">Real-time insights across all projects</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleExport} className="px-4 py-2 bg-v-primary border border-v-border rounded-lg text-sm font-medium text-v-main hover:bg-v-secondary transition-colors">
                        Export Report
                    </button>
                    <button onClick={fetchStats} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                        Refresh
                    </button>
                </div>
            </header>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                    { label: 'Total Projects', value: stats.totalProjects, icon: Target, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Total Issues', value: stats.totalIssues, icon: CheckSquare, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                    { label: 'Team Members', value: stats.totalMembers ?? 0, icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'Active Sprints', value: 3, icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10' } // Hardcoded for now
                ].map((stat, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={stat.label}
                        className="bg-v-primary p-6 rounded-xl border border-v-border shadow-sm transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg flex items-center justify-center ${stat.bg} ${stat.color}`}>
                                <stat.icon size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-v-muted font-medium">{stat.label}</p>
                                <p className="text-2xl font-bold text-v-main">{stat.value}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* === Issue Status Distribution — per project === */}
                <div className="bg-v-primary p-6 rounded-xl border border-v-border shadow-sm transition-colors">
                    <h2 className="text-lg font-semibold text-v-main mb-6 flex items-center gap-2">
                        <Clock className="text-v-muted" size={20} />
                        Issue Status Distribution
                    </h2>

                    {statusData.length === 0 ? (
                        <div className="h-[300px] flex items-center justify-center text-v-muted text-sm">
                            No issues found in this organisation yet.
                        </div>
                    ) : (
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={statusData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-v-border)" />
                                    <XAxis
                                        dataKey="status"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'var(--color-v-muted)', fontSize: 12 }}
                                        tickFormatter={v => v ? v.charAt(0).toUpperCase() + v.slice(1).replace(/-/g, ' ') : v}
                                    />
                                    <YAxis
                                        allowDecimals={false}
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'var(--color-v-muted)', fontSize: 12 }}
                                    />
                                    <Tooltip content={<StatusTooltip />} cursor={{ fill: 'var(--color-v-secondary)', opacity: 0.4 }} />
                                    <Legend
                                        verticalAlign="top"
                                        wrapperStyle={{ color: 'var(--color-v-main)', fontSize: 12, paddingBottom: 12 }}
                                    />
                                    {projectKeys.map((proj, i) => (
                                        <Bar
                                            key={proj}
                                            dataKey={proj}
                                            name={proj}
                                            fill={COLORS[i % COLORS.length]}
                                            radius={[4, 4, 0, 0]}
                                            maxBarSize={40}
                                        />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>


                {/* Priority Pie Chart */}
                <div className="bg-v-primary p-6 rounded-xl border border-v-border shadow-sm transition-colors">
                    <h2 className="text-lg font-semibold text-v-main mb-6 flex items-center gap-2">
                        <AlertCircle className="text-v-muted" size={20} />
                        Priority Breakdown
                    </h2>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={priorityData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {priorityData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-v-border)', backgroundColor: 'var(--color-v-primary)', color: 'var(--color-v-main)' }}
                                    itemStyle={{ color: 'var(--color-v-main)' }}
                                />
                                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: 'var(--color-v-main)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
