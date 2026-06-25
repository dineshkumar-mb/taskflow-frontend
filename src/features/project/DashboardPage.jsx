import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { getProjects } from './projectSlice';
import CreateProjectModal from './CreateProjectModal';
import { Loader2, Plus, Layers, BookOpen, Calendar, Zap, Settings, BarChart2 } from 'lucide-react';
import { CardSkeleton } from '../../components/ui/Skeleton';

const DashboardPage = () => {
    const dispatch = useDispatch();
    const { projects, isLoading, isError, message } = useSelector((state) => state.project);
    const { user } = useSelector((state) => state.auth);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const isAdminOrPM = ['OrgOwner', 'Admin', 'Project Manager'].includes(user?.role);

    useEffect(() => {
        // Projects are fetched by DashboardLayout
    }, [dispatch]);

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-v-main">Projects</h1>
                    <p className="text-sm text-v-muted mt-0.5">Welcome back, {user?.name?.split(' ')[0]}!</p>
                </div>
                {isAdminOrPM && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Create Project
                    </button>
                )}
            </div>

            {isLoading && projects.length === 0 ? (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
                </div>
            ) : isError ? (
                <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-600 text-sm">
                    Error: {message}
                </div>
            ) : projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center rounded-xl bg-v-primary border border-dashed border-v-border">
                    <div className="h-16 w-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                        <Layers size={28} className="text-blue-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-v-main mb-1">No projects yet</h3>
                    <p className="text-sm text-v-muted mb-4">Create your first project to start managing issues</p>
                    {isAdminOrPM && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                        >
                            <Plus size={14} />
                            Create Project
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project) => (
                        <div
                            key={project._id}
                            className="group relative flex flex-col rounded-xl border border-v-border bg-v-primary shadow-sm hover:shadow-md hover:border-blue-500/50 transition-all duration-300"
                        >
                            {/* Card top accent */}
                            <div className="h-1 rounded-t-xl bg-gradient-to-r from-blue-500 to-indigo-500" />

                            <div className="p-5 flex-1 flex flex-col gap-4">
                                {/* Project header */}
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-500 text-white font-bold text-sm shadow-sm ring-1 ring-white/10">
                                        {project.key.substring(0, 2)}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-semibold text-v-main truncate">{project.name}</h3>
                                        <p className="text-xs text-v-muted font-mono">{project.key}</p>
                                    </div>
                                </div>

                                {project.description && (
                                    <p className="text-sm text-v-muted line-clamp-2 leading-relaxed">{project.description}</p>
                                )}

                                {/* Lead info */}
                                <div className="flex items-center gap-2 text-xs text-v-muted">
                                    <div className="h-5 w-5 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-[10px] ring-1 ring-white/20">
                                        {project.lead?.name?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    {project.lead?.name || 'Unknown'}
                                    <span className="ml-auto opacity-60">Lead</span>
                                </div>

                                {/* Actions */}
                                <div className="grid grid-cols-4 gap-2 mt-auto">
                                    <Link
                                        to={`/project/${project._id}/board`}
                                        className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/10 px-2 py-2 text-xs font-medium text-blue-500 transition-colors"
                                    >
                                        <Layers size={12} />
                                        Board
                                    </Link>
                                    <Link
                                        to={`/project/${project._id}/backlog`}
                                        className="flex items-center justify-center gap-1.5 rounded-lg bg-gray-500/10 hover:bg-gray-500/20 border border-gray-500/10 px-2 py-2 text-xs font-medium text-v-muted transition-colors"
                                    >
                                        <BookOpen size={12} />
                                        Backlog
                                    </Link>
                                    <Link
                                        to={`/project/${project._id}/sprints`}
                                        className="flex items-center justify-center gap-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/10 px-2 py-2 text-xs font-medium text-purple-400 transition-colors"
                                    >
                                        <Zap size={12} />
                                        Sprints
                                    </Link>
                                    <Link
                                        to={`/project/${project._id}/reports`}
                                        className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/10 px-2 py-2 text-xs font-medium text-emerald-500 transition-colors"
                                    >
                                        <BarChart2 size={12} />
                                        Reports
                                    </Link>
                                </div>

                                {/* Settings link */}
                                {isAdminOrPM && (
                                    <Link
                                        to={`/project/${project._id}/settings`}
                                        className="mt-1 flex items-center gap-1 text-xs text-v-muted hover:text-v-main transition-colors"
                                    >
                                        <Settings size={11} /> Settings
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <CreateProjectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
};

export default DashboardPage;
