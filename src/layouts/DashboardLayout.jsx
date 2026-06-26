import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import { getProjects } from '../features/project/projectSlice';
import { getNotifications, markAsRead, markAllAsRead, addNotification } from '../features/notification/notificationSlice';
import { useTheme } from '../context/ThemeContext';
import { socket } from '../utils/socket';
import {
    LogOut, User as UserIcon, LayoutDashboard, Layers, BookOpen,
    Zap, ChevronDown, ChevronRight, Menu, X, Users, Settings, Bell, BarChart2,
    Sun, Moon, MessageSquare, Rocket, Video, Calendar, Shield, Activity
} from 'lucide-react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import ChatSidebar from '../features/chat/ChatSidebar';
import ChatWindow from '../features/chat/ChatWindow';
import { clearActiveConversation } from '../features/chat/chatSlice';
import AIChatAssistant from '../components/ai/AIChatAssistant';
import { CommandPalette } from '../components/CommandPalette';
import { KeyboardShortcuts } from '../components/KeyboardShortcuts';


const NavLink = ({ to, active, icon, label, collapsed }) => (
    <Link
        to={to}
        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${active ? 'bg-blue-600 text-white' : 'text-v-main/70 hover:bg-v-secondary hover:text-v-main'
            }`}
    >
        <span className="flex-shrink-0">{icon}</span>
        {!collapsed && <span className="truncate">{label}</span>}
    </Link>
);

const SubLink = ({ to, active, icon, label }) => (
    <Link
        to={to}
        className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${active ? 'bg-blue-600 text-white' : 'text-v-muted hover:bg-v-secondary hover:text-v-main'
            }`}
    >
        {icon}
        {label}
    </Link>
);

const DashboardLayout = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();
    const { projectId } = useParams();

    const { user } = useSelector((state) => state.auth);
    const { projects } = useSelector((state) => state.project);
    const { notifications, unreadCount } = useSelector((state) => state.notification);
    const { isDarkMode, toggleTheme } = useTheme();

    const isAdminOrPM = ['OrgOwner', 'Admin', 'SuperAdmin'].includes(user?.role);

    // Desktop: collapsed/expanded. Mobile: drawer open/closed.
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [expandedProjects, setExpandedProjects] = useState({});
    const [showNotifications, setShowNotifications] = useState(false);
    const [showChatSidebar, setShowChatSidebar] = useState(false);
    const { activeConversation } = useSelector((state) => state.chat);

    useEffect(() => { if (!user) navigate('/login', { state: { from: location.pathname + location.search } }); }, [user, navigate, location]);

    useEffect(() => {
        if (user) {
            dispatch(getProjects());
            dispatch(getNotifications());

            // Initialize socket connection
            socket.on('connect', () => {
                console.log('Socket connected');
                socket.emit('join:user', user._id);
            });

            socket.on('notification:new', (notification) => {
                dispatch(addNotification(notification));
                toast.info(`New Notification: ${notification.message}`);
            });

            socket.connect();

            return () => {
                socket.off('connect');
                socket.off('notification:new');
                socket.disconnect();
            };
        }
    }, [user, dispatch]);
    useEffect(() => {
        if (projectId) setExpandedProjects(prev => ({ ...prev, [projectId]: true }));
    }, [projectId]);

    // Close mobile drawer on navigation
    useEffect(() => { setMobileOpen(false); }, [location.pathname]);

    const handleLogout = () => { dispatch(logout()); navigate('/login'); };
    const toggleProject = (id) => setExpandedProjects(prev => ({ ...prev, [id]: !prev[id] }));

    if (!user) return null;

    const isActive = (path) => location.pathname === path;
    const isPathActive = (path) => location.pathname.startsWith(path);

    const getPageTitle = () => {
        if (location.pathname === '/dashboard') return 'Overview';
        if (location.pathname === '/projects') return 'Projects';
        if (location.pathname === '/meetings') return 'Meetings';
        if (location.pathname === '/pricing') return 'Pricing';
        if (location.pathname === '/billing') return 'Billing';
        if (location.pathname.includes('/board')) return 'Board';
        if (location.pathname.includes('/backlog')) return 'Backlog';
        if (location.pathname.includes('/sprints')) return 'Sprints';
        if (location.pathname.includes('/settings')) return 'Settings';
        if (location.pathname.includes('/members')) return 'Members';
        if (location.pathname.includes('/roles')) return 'Roles';
        if (location.pathname.includes('/audit-logs')) return 'Audit Logs';
        if (location.pathname === '/settings') return 'Settings';
        return 'TaskFlow';
    };

    const currentProject = projects.find(p => p._id === projectId);

    /* ─── Sidebar content (shared by desktop + mobile drawer) ─── */
    const SidebarContent = ({ collapsed }) => (
        <>
            {/* Logo */}
            <div className={`flex h-14 items-center ${collapsed ? 'gap-2 px-2' : 'gap-3 px-4'} border-b border-v-border flex-shrink-0`}>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 text-white font-bold text-sm flex-shrink-0">
                    <Zap size={16} />
                </div>
                {!collapsed && <span className="font-bold text-lg tracking-tight text-v-main flex-1 min-w-0 truncate">TaskFlow</span>}
                {/* Collapse toggle (desktop only) */}
                <button
                    className={`hidden lg:flex text-v-muted hover:text-v-main ${!collapsed ? 'ml-auto' : ''}`}
                    onClick={() => setCollapsed(c => !c)}
                >
                    {collapsed ? <Menu size={20} /> : <X size={18} />}
                </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
                <NavLink to="/dashboard" active={isActive('/dashboard')} icon={<LayoutDashboard size={18} />} label="Overview" collapsed={collapsed} />
                <NavLink to="/projects" active={isActive('/projects')} icon={<Layers size={18} />} label="Projects" collapsed={collapsed} />
                <NavLink to="/meetings" active={isActive('/meetings')} icon={<Video size={18} />} label="Meetings" collapsed={collapsed} />
                <NavLink to="/members" active={isPathActive('/members')} icon={<Users size={18} />} label="Members" collapsed={collapsed} />
                <NavLink to="/roles" active={isActive('/roles')} icon={<Shield size={18} />} label="Roles" collapsed={collapsed} />
                <NavLink to="/audit-logs" active={isActive('/audit-logs')} icon={<Activity size={18} />} label="Audit Logs" collapsed={collapsed} />
                <NavLink to="/billing" active={isActive('/billing')} icon={<Zap size={18} />} label="Billing" collapsed={collapsed} />
                <NavLink to="/pricing" active={isActive('/pricing')} icon={<Rocket size={18} />} label="Upgrade" collapsed={collapsed} />
                <NavLink to="/settings" active={isActive('/settings')} icon={<Settings size={18} />} label="Settings" collapsed={collapsed} />

                {!collapsed && (
                    <div className="pt-3 pb-1">
                        <p className="px-3 text-[11px] font-semibold text-v-muted/40 uppercase tracking-widest">Projects</p>
                    </div>
                )}

                {projects.map((project) => (
                    <div key={project._id}>
                        <button
                            onClick={() => toggleProject(project._id)}
                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${isPathActive(`/project/${project._id}`)
                                ? 'bg-v-secondary text-v-main'
                                : 'text-v-muted hover:bg-v-secondary hover:text-v-main'
                                }`}
                        >
                            <div className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded bg-blue-500 text-[10px] font-bold text-white">
                                {project.key ? project.key.substring(0, 2) : project.name.substring(0, 2).toUpperCase()}
                            </div>
                            {!collapsed && (
                                <>
                                    <span className="flex-1 text-left truncate">{project.name}</span>
                                    {expandedProjects[project._id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </>
                            )}
                        </button>

                        {!collapsed && expandedProjects[project._id] && (
                            <div className="ml-8 mt-1 space-y-1">
                                <SubLink to={`/project/${project._id}/board`} active={isActive(`/project/${project._id}/board`)} icon={<Layers size={14} />} label="Board" />
                                <SubLink to={`/project/${project._id}/timeline`} active={isActive(`/project/${project._id}/timeline`)} icon={<Calendar size={14} />} label="Timeline" />
                                <SubLink to={`/project/${project._id}/backlog`} active={isActive(`/project/${project._id}/backlog`)} icon={<BookOpen size={14} />} label="Backlog" />
                                <SubLink to={`/project/${project._id}/sprints`} active={isActive(`/project/${project._id}/sprints`)} icon={<Zap size={14} />} label="Sprints" />
                                <SubLink to={`/project/${project._id}/workload`} active={isActive(`/project/${project._id}/workload`)} icon={<Users size={14} />} label="Workload" />
                                <SubLink to={`/project/${project._id}/reports`} active={isActive(`/project/${project._id}/reports`)} icon={<BarChart2 size={14} />} label="Reports" />
                                {isAdminOrPM && (
                                    <SubLink to={`/project/${project._id}/settings`} active={isActive(`/project/${project._id}/settings`)} icon={<Settings size={14} />} label="Settings" />
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </nav>

            {/* User footer */}
            <div className="border-t border-v-border p-3 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-white text-sm font-bold">
                        {user.name?.charAt(0).toUpperCase()}
                    </div>
                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-v-main truncate">{user.name}</p>
                            <p className="text-xs text-v-muted shrink-0">{user?.role?.name || user?.roleName || 'Member'}</p>
                        </div>
                    )}
                    {!collapsed && (
                        <button onClick={handleLogout} className="text-v-muted hover:text-red-400 transition-colors" title="Logout">
                            <LogOut size={16} />
                        </button>
                    )}
                    {collapsed && (
                        <button onClick={handleLogout} className="text-v-muted hover:text-red-400 transition-colors ml-auto" title="Logout">
                            <LogOut size={16} />
                        </button>
                    )}
                </div>
            </div>
        </>
    );

    return (
        <div className="flex h-screen overflow-hidden bg-v-primary text-v-main transition-colors duration-300">

            {/* ── Mobile overlay backdrop ── */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-30 bg-slate-900/60 backdrop-blur-sm lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* ── Mobile drawer sidebar ── */}
            <div className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-v-secondary text-v-main border-r border-v-border transition-transform duration-300 lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex h-14 items-center justify-between px-4 border-b border-v-border">
                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500 text-white">
                            <Zap size={14} />
                        </div>
                        <span className="font-bold text-base text-v-main">TaskFlow</span>
                    </div>
                    <button onClick={() => setMobileOpen(false)} className="text-v-muted hover:text-v-main">
                        <X size={20} />
                    </button>
                </div>
                {/* Reuse nav */}
                <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
                    <NavLink to="/dashboard" active={isActive('/dashboard')} icon={<LayoutDashboard size={18} />} label="Overview" collapsed={false} />
                    <NavLink to="/projects" active={isActive('/projects')} icon={<Layers size={18} />} label="Projects" collapsed={false} />
                    <NavLink to="/meetings" active={isActive('/meetings')} icon={<Video size={18} />} label="Meetings" collapsed={false} />
                    <NavLink to="/members" active={isPathActive('/members')} icon={<Users size={18} />} label="Members" collapsed={false} />
                    <NavLink to="/roles" active={isActive('/roles')} icon={<Shield size={18} />} label="Roles" collapsed={false} />
                    <NavLink to="/audit-logs" active={isActive('/audit-logs')} icon={<Activity size={18} />} label="Audit Logs" collapsed={false} />
                    <NavLink to="/billing" active={isActive('/billing')} icon={<Zap size={18} />} label="Billing" collapsed={false} />
                    <NavLink to="/pricing" active={isActive('/pricing')} icon={<Rocket size={18} />} label="Upgrade" collapsed={false} />
                    <NavLink to="/settings" active={isActive('/settings')} icon={<Settings size={18} />} label="Settings" collapsed={false} />

                    <div className="pt-3 pb-1">
                        <p className="px-3 text-[11px] font-semibold text-v-muted/40 uppercase tracking-widest">Projects</p>
                    </div>

                    {projects.map((project) => (
                        <div key={project._id}>
                            <button
                                onClick={() => toggleProject(project._id)}
                                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${isPathActive(`/project/${project._id}`) ? 'bg-v-secondary text-v-main' : 'text-v-muted hover:bg-v-secondary hover:text-v-main'}`}
                            >
                                <div className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded bg-blue-500 text-[10px] font-bold text-white">
                                    {project.key?.substring(0, 2)}
                                </div>
                                <span className="flex-1 text-left truncate">{project.name}</span>
                                {expandedProjects[project._id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                            {expandedProjects[project._id] && (
                                <div className="ml-8 mt-1 space-y-1">
                                    <SubLink to={`/project/${project._id}/board`} active={isActive(`/project/${project._id}/board`)} icon={<Layers size={14} />} label="Board" />
                                    <SubLink to={`/project/${project._id}/timeline`} active={isActive(`/project/${project._id}/timeline`)} icon={<Calendar size={14} />} label="Timeline" />
                                    <SubLink to={`/project/${project._id}/backlog`} active={isActive(`/project/${project._id}/backlog`)} icon={<BookOpen size={14} />} label="Backlog" />
                                    <SubLink to={`/project/${project._id}/sprints`} active={isActive(`/project/${project._id}/sprints`)} icon={<Zap size={14} />} label="Sprints" />
                                    <SubLink to={`/project/${project._id}/workload`} active={isActive(`/project/${project._id}/workload`)} icon={<Users size={14} />} label="Workload" />
                                    <SubLink to={`/project/${project._id}/reports`} active={isActive(`/project/${project._id}/reports`)} icon={<BarChart2 size={14} />} label="Reports" />
                                    {isAdminOrPM && (
                                        <SubLink to={`/project/${project._id}/settings`} active={isActive(`/project/${project._id}/settings`)} icon={<Settings size={14} />} label="Settings" />
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>
                <div className="border-t border-v-border p-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-white text-sm font-bold">
                            {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-v-main truncate">{user.name}</p>
                            <p className="text-xs text-v-muted">{user.role}</p>
                        </div>
                        <button onClick={handleLogout} className="text-v-muted hover:text-red-400" title="Logout">
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Desktop sidebar (always visible, collapsible) ── */}
            <div className={`hidden lg:flex flex-col bg-v-secondary text-v-main border-r border-v-border transition-all duration-300 flex-shrink-0 ${collapsed ? 'w-20' : 'w-64'}`}>
                <SidebarContent collapsed={collapsed} />
            </div>

            {/* ── Main content ── */}
            <div className="flex flex-1 flex-col overflow-hidden min-w-0 bg-v-primary transition-colors">
                {/* Topbar */}
                <header className="flex h-14 items-center gap-3 border-b border-v-border bg-v-primary px-4 shadow-sm flex-shrink-0 transition-colors">
                    {/* Mobile hamburger */}
                    <button
                        className="lg:hidden text-v-muted hover:text-v-main p-1 rounded-lg hover:bg-v-secondary transition-colors"
                        onClick={() => setMobileOpen(true)}
                    >
                        <Menu size={22} />
                    </button>

                    <div className="flex-1 min-w-0">
                        <h1 className="text-sm sm:text-base font-semibold text-v-main truncate">
                            {currentProject ? (
                                <><span className="text-v-muted font-normal hidden sm:inline">{currentProject.name} › </span>{getPageTitle()}</>
                            ) : getPageTitle()}
                        </h1>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-v-muted flex-shrink-0 relative">
                        {/* Meetings Quick Link */}
                        <Link to="/meetings" className="p-2 text-v-muted hover:text-v-main rounded-full hover:bg-v-secondary transition-colors" title="Meetings">
                            <Video size={18} />
                        </Link>
                        
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 text-v-muted hover:text-v-main rounded-full hover:bg-v-secondary transition-colors"
                        >
                            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>

                        {/* Notification Bell */}
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="relative p-2 text-v-muted hover:text-v-main rounded-full hover:bg-v-secondary transition-colors"
                            >
                                <Bell size={18} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Notification Dropdown */}
                            {showNotifications && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                                    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl bg-white shadow-xl ring-1 ring-black/5 z-50 overflow-hidden transform opacity-100 scale-100">
                                        <div className="flex items-center justify-between border-b px-4 py-3 bg-gray-50/50">
                                            <h3 className="font-semibold text-gray-800">Notifications</h3>
                                            {unreadCount > 0 && (
                                                <button
                                                    onClick={() => {
                                                        dispatch(markAllAsRead());
                                                        setShowNotifications(false);
                                                    }}
                                                    className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                                >
                                                    Mark all as read
                                                </button>
                                            )}
                                        </div>
                                        <div className="max-h-96 overflow-y-auto w-full divide-y divide-gray-50">
                                            {notifications.length === 0 ? (
                                                <div className="p-8 text-center text-sm text-gray-500 flex flex-col items-center">
                                                    <Bell size={24} className="text-gray-300 mb-2" />
                                                    All caught up!
                                                </div>
                                            ) : (
                                                notifications.map(n => (
                                                    <div
                                                        key={n._id}
                                                        onClick={() => {
                                                            if (!n.read) dispatch(markAsRead(n._id));
                                                            setShowNotifications(false);
                                                            if (n.issue && currentProject) {
                                                                navigate(`/project/${currentProject._id}/board`);
                                                            }
                                                        }}
                                                        className={`flex gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors ${!n.read ? 'bg-blue-50/30' : ''}`}
                                                    >
                                                        <div className="mt-1 flex-shrink-0 relative">
                                                            {n.initiator?.name ? (
                                                                <div className="h-8 w-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-xs font-bold text-indigo-700">
                                                                    {n.initiator.name.charAt(0).toUpperCase()}
                                                                </div>
                                                            ) : (
                                                                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                                                    <Zap size={14} />
                                                                </div>
                                                            )}
                                                            {!n.read && <div className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full border-2 border-white" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0 w-full overflow-hidden">
                                                            <p className="text-sm text-gray-800 leading-snug break-words">
                                                                {n.initiator && <span className="font-semibold">{n.initiator.name} </span>}
                                                                <span className="text-gray-600">{n.message}</span>
                                                            </p>
                                                            <p className="mt-1 text-xs text-gray-400 font-medium">
                                                                {format(new Date(n.createdAt), 'MMM d, h:mm a')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* User Profile */}
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 text-white text-xs font-bold">
                            {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="hidden sm:inline text-sm text-v-main font-medium max-w-[120px] truncate">{user.name}</span>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto bg-v-secondary p-4 sm:p-6 transition-colors duration-300">
                    <Outlet />
                </main>
            </div>

            {/* ── Chat System ── */}
            <div className="fixed bottom-0 right-6 z-50 flex items-end gap-4 pointer-events-none">
                {/* Chat Windows (Active Conversation) */}
                {activeConversation && (
                    <div className="w-80 h-96 pointer-events-auto">
                        <ChatWindow
                            conversation={activeConversation}
                            onClose={() => dispatch(clearActiveConversation())}
                        />
                    </div>
                )}

                {/* ── Chat System ── */}
                <div className="fixed bottom-0 right-6 z-50 flex items-end gap-4 pointer-events-none">
                    {/* AI Chat Assistant */}
                    <div className="flex flex-col items-end pointer-events-auto">
                        <AIChatAssistant projectId={projectId} />
                    </div>

                    {/* Chat Sidebar Toggle & List */}
                    <div className="flex flex-col items-end gap-3 pointer-events-auto">
                        {showChatSidebar && (
                            <div className="w-72 h-[500px] mb-2">
                                <ChatSidebar onClose={() => setShowChatSidebar(false)} />
                            </div>
                        )}

                        <button
                            onClick={() => setShowChatSidebar(!showChatSidebar)}
                            className={`mb-6 h-14 w-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${showChatSidebar ? 'bg-gray-100 text-gray-600 rotate-90' : 'bg-blue-600 text-white hover:scale-110'
                                }`}
                        >
                            {showChatSidebar ? <X size={24} /> : <MessageSquare size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            <CommandPalette />
            <KeyboardShortcuts />
        </div>
    );
};

export default DashboardLayout;
