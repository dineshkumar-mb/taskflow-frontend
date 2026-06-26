import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getIssues } from '../board/boardSlice';
import { Loader2, Users } from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';

const WorkloadPage = () => {
    const { projectId } = useParams();
    const dispatch = useDispatch();
    const { issues, isLoading: issuesLoading } = useSelector((state) => state.board);
    const [orgUsers, setOrgUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(true);

    useEffect(() => {
        if (projectId) {
            dispatch(getIssues(projectId));
        }
    }, [projectId, dispatch]);

    useEffect(() => {
        axiosInstance.get('/users')
            .then(res => setOrgUsers(res.data))
            .catch(console.error)
            .finally(() => setUsersLoading(false));
    }, []);

    const workloadData = useMemo(() => {
        if (!issues || orgUsers.length === 0) return [];

        // Capacity threshold per sprint
        const CAPACITY = 20;

        const usersMap = {};
        orgUsers.forEach(u => {
            usersMap[u._id] = {
                user: u,
                assignedIssues: 0,
                storyPoints: 0,
                completedPoints: 0
            };
        });

        issues.forEach(issue => {
            const assigneeId = issue.assignee?._id || issue.assignee;
            if (assigneeId && usersMap[assigneeId]) {
                usersMap[assigneeId].assignedIssues++;
                if (issue.storyPoints) {
                    usersMap[assigneeId].storyPoints += issue.storyPoints;
                    if (issue.status === 'done') {
                        usersMap[assigneeId].completedPoints += issue.storyPoints;
                    }
                }
            }
        });

        // Convert map to array and filter out users with 0 points AND 0 issues (optional)
        return Object.values(usersMap)
            .filter(d => d.assignedIssues > 0 || d.storyPoints > 0)
            .map(d => {
                const percentage = Math.min(100, Math.round((d.storyPoints / CAPACITY) * 100));
                let status = 'Under Capacity';
                let colorClass = 'bg-blue-500';
                
                if (d.storyPoints > CAPACITY) {
                    status = 'Over Capacity';
                    colorClass = 'bg-red-500';
                } else if (d.storyPoints >= CAPACITY * 0.8) {
                    status = 'At Capacity';
                    colorClass = 'bg-yellow-500';
                }

                return { ...d, percentage, status, colorClass, capacity: CAPACITY };
            })
            .sort((a, b) => b.storyPoints - a.storyPoints);
    }, [issues, orgUsers]);

    if (issuesLoading || usersLoading) {
        return <div className="flex h-64 items-center justify-center"><Loader2 size={32} className="animate-spin text-blue-500" /></div>;
    }

    if (workloadData.length === 0) {
        return (
            <div className="flex h-64 flex-col items-center justify-center text-v-muted gap-2">
                <Users size={48} className="opacity-20" />
                <p>No workload data available.</p>
                <p className="text-sm">Assign story points and users to issues to see workload.</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                    <Users size={20} />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-v-main">Team Workload</h1>
                    <p className="text-sm text-v-muted">Visualize capacity and prevent burnout (Capacity: 20 pts)</p>
                </div>
            </div>

            <div className="bg-v-primary rounded-xl border border-v-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-v-secondary text-v-muted">
                            <tr>
                                <th className="px-6 py-4 font-medium">Team Member</th>
                                <th className="px-6 py-4 font-medium">Issues</th>
                                <th className="px-6 py-4 font-medium">Story Points</th>
                                <th className="px-6 py-4 font-medium min-w-[200px]">Capacity Utilization</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-v-border">
                            {workloadData.map(data => (
                                <tr key={data.user._id} className="hover:bg-v-secondary/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white font-bold text-xs">
                                                {data.user.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-v-main">{data.user.name}</p>
                                                <p className="text-xs text-v-muted">{data.user.role || 'Member'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-v-main font-medium">
                                        {data.assignedIssues}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-v-main">{data.storyPoints}</span>
                                            <span className="text-xs text-v-muted">({data.completedPoints} done)</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="w-full h-2.5 bg-v-secondary rounded-full overflow-hidden flex">
                                            {/* Completed bar */}
                                            <div 
                                                className="h-full bg-green-500 transition-all duration-500" 
                                                style={{ width: `${Math.min(100, (data.completedPoints / data.capacity) * 100)}%` }} 
                                                title={`${data.completedPoints} completed points`}
                                            />
                                            {/* Remaining bar */}
                                            <div 
                                                className={`h-full ${data.colorClass} transition-all duration-500 opacity-70`} 
                                                style={{ width: `${Math.min(100, ((data.storyPoints - data.completedPoints) / data.capacity) * 100)}%` }}
                                                title={`${data.storyPoints - data.completedPoints} remaining points`}
                                            />
                                        </div>
                                        <p className="text-xs text-v-muted mt-1.5">{data.percentage}% of capacity</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                            data.status === 'Over Capacity' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                            data.status === 'At Capacity' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                                            'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                        }`}>
                                            {data.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default WorkloadPage;
