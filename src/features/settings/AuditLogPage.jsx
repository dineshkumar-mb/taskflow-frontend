import { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { toast } from 'react-toastify';
import { Activity, Search, Filter, Loader2, ChevronLeft, ChevronRight, ShieldAlert } from 'lucide-react';
import { useSelector } from 'react-redux';
import { format } from 'date-fns';

const AuditLogPage = () => {
    const { user } = useSelector(state => state.auth);
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({ entityType: '', user: '' });

    // Only Admins / those with '*' permission should access
    const userRole = typeof user?.role === 'object' ? user?.role?.name : (user?.role || user?.roleName);
    const rolePermissions = typeof user?.role === 'object' ? user?.role?.permissions : [];
    const canViewAudit = ['OrgOwner', 'Admin', 'SuperAdmin'].includes(userRole) || rolePermissions?.includes('*');

    const fetchLogs = async (currentPage = 1) => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams({ page: currentPage, limit: 15 });
            if (filters.entityType) params.append('entityType', filters.entityType);
            if (filters.user) params.append('user', filters.user);

            const res = await axiosInstance.get(`/audit?${params.toString()}`);
            setLogs(res.data.logs);
            setTotalPages(res.data.pagination.pages);
            setPage(res.data.pagination.page);
        } catch (error) {
            toast.error('Failed to load audit logs');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (canViewAudit) {
            fetchLogs(page);
        }
    }, [page, filters, canViewAudit]);

    if (!canViewAudit) {
        return (
            <div className="flex h-full items-center justify-center text-v-muted">
                <div className="text-center">
                    <ShieldAlert size={48} className="mx-auto mb-4 text-v-muted/50" />
                    <h2 className="text-lg font-medium text-v-main">Access Denied</h2>
                    <p className="text-sm mt-1">You must be an administrator to view audit logs.</p>
                </div>
            </div>
        );
    }

    const renderActionBadge = (action) => {
        const styles = {
            CREATE: 'bg-green-500/10 text-green-500',
            UPDATE: 'bg-blue-500/10 text-blue-500',
            DELETE: 'bg-red-500/10 text-red-500',
            LOGIN: 'bg-purple-500/10 text-purple-500',
            STATUS_CHANGE: 'bg-yellow-500/10 text-yellow-500'
        };
        const style = styles[action] || 'bg-slate-500/10 text-slate-500';
        return <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider ${style}`}>{action}</span>;
    };

    return (
        <div className="h-full flex flex-col bg-v-bg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-v-border shrink-0">
                <div>
                    <h1 className="text-xl font-bold text-v-main flex items-center gap-2">
                        <Activity size={20} className="text-indigo-500" />
                        Audit Log
                    </h1>
                    <p className="text-sm text-v-muted mt-1">Track actions and security events across your organization.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-v-muted" />
                        <select
                            value={filters.entityType}
                            onChange={(e) => { setFilters(prev => ({ ...prev, entityType: e.target.value })); setPage(1); }}
                            className="pl-8 pr-4 py-2 bg-v-component border border-v-border rounded-lg text-sm text-v-main focus:outline-none appearance-none cursor-pointer"
                        >
                            <option value="">All Entities</option>
                            <option value="Issue">Issues</option>
                            <option value="Project">Projects</option>
                            <option value="User">Users</option>
                            <option value="Role">Roles</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
                <div className="bg-v-component border border-v-border rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-v-bg border-b border-v-border text-v-muted font-medium">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Action</th>
                                    <th className="px-4 py-3 font-medium">User</th>
                                    <th className="px-4 py-3 font-medium">Entity</th>
                                    <th className="px-4 py-3 font-medium hidden md:table-cell">Details</th>
                                    <th className="px-4 py-3 font-medium text-right">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-v-border">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="5" className="px-4 py-8 text-center">
                                            <Loader2 size={24} className="animate-spin text-indigo-500 mx-auto" />
                                        </td>
                                    </tr>
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-4 py-8 text-center text-v-muted">
                                            No audit logs found for the selected criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map(log => (
                                        <tr key={log._id} className="hover:bg-v-bg/50 transition-colors">
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {renderActionBadge(log.action)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    {log.user ? (
                                                        <>
                                                            <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-medium">
                                                                {log.user.name.charAt(0)}
                                                            </div>
                                                            <span className="text-v-main truncate max-w-[120px]">{log.user.name}</span>
                                                        </>
                                                    ) : (
                                                        <span className="text-v-muted italic">System</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-v-main font-medium">{log.entityType}</span>
                                                {log.entityId && (
                                                    <span className="text-xs text-v-muted ml-2 font-mono" title={log.entityId._id || log.entityId}>
                                                        {(log.entityId.name || log.entityId.title || log.entityId).substring(0, 8)}...
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 hidden md:table-cell max-w-[200px] truncate text-v-muted text-xs font-mono">
                                                {log.details ? JSON.stringify(log.details) : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right text-v-muted whitespace-nowrap">
                                                {format(new Date(log.createdAt), 'MMM d, HH:mm')}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 bg-v-bg border-t border-v-border">
                            <span className="text-sm text-v-muted">
                                Page <span className="font-medium text-v-main">{page}</span> of <span className="font-medium text-v-main">{totalPages}</span>
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-1 rounded bg-v-component border border-v-border text-v-main disabled:opacity-50 disabled:cursor-not-allowed hover:bg-v-border transition-colors"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="p-1 rounded bg-v-component border border-v-border text-v-main disabled:opacity-50 disabled:cursor-not-allowed hover:bg-v-border transition-colors"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuditLogPage;
