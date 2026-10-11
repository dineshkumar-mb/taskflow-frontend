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

    const userRole = typeof user?.role === 'object' ? user?.role?.name : (user?.role || user?.roleName);
    const isAdminOrPM = ['OrgOwner', 'Admin', 'SuperAdmin', 'Project Manager'].includes(userRole);
    const isSuperAdmin = userRole === 'SuperAdmin';

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
                {isSuperAdmin && (
                    <NavLink to="/admin-billing" active={isActive('/admin-billing')} icon={<Shield size={18} />} label="Admin Billing" collapsed={collapsed} />
                )}

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
                    {isSuperAdmin && (
                        <NavLink to="/admin-billing" active={isActive('/admin-billing')} icon={<Shield size={18} />} label="Admin Billing" collapsed={false} />
                    )}

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
                            <p className="text-xs text-v-muted">{user?.role?.name || user?.roleName || 'Member'}</p>
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

                    <div className="flex items-center gap-2 sm:gap-3 text-sm text-v-muted flex-shrink-0 relative">
                        {/* Command Palette Trigger */}
                        <button
                            onClick={() => {
                                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
                            }}
                            className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-v-border bg-v-secondary text-xs text-v-muted hover:text-v-main hover:border-blue-500/40 transition-colors"
                            aria-label="Search and quick actions (Ctrl+K)"
                            title="Command Palette (Ctrl+K)"
                        >
                            <span className="text-v-muted">Search…</span>
                            <kbd className="font-mono text-[10px] bg-v-primary px-1.5 py-0.5 rounded border border-v-border">⌘K</kbd>
                        </button>

                        {/* Meetings Quick Link */}
                        <Link
                            to="/meetings"
                            className="p-2 text-v-muted hover:text-v-main rounded-full hover:bg-v-secondary transition-colors"
                            title="Meetings"
                            aria-label="Meetings"
                        >
                            <Video size={18} />
                        </Link>
                        
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 text-v-muted hover:text-v-main rounded-full hover:bg-v-secondary transition-colors"
                            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                            {isDarkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
                        </button>

                        {/* Notification Bell */}
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="relative p-2 text-v-muted hover:text-v-main rounded-full hover:bg-v-secondary transition-colors"
                                aria-label="Notifications"
                                title="Notifications"
                            >
                                <Bell size={18} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-v-primary">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Notification Dropdown */}
                            {showNotifications && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                                    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-v-primary border border-v-border shadow-2xl z-50 overflow-hidden transform opacity-100 scale-100 animate-in fade-in">
                                        <div className="flex items-center justify-between border-b border-v-border px-4 py-3 bg-v-secondary/80">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-sm text-v-main">Notifications</h3>
                                                {unreadCount > 0 && (
                                                    <span className="text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-0.5 rounded-full">
                                                        {unreadCount} new
                                                    </span>
                                                )}
                                            </div>
                                            {unreadCount > 0 && (
                                                <button
                                                    onClick={() => {
                                                        dispatch(markAllAsRead());
                                                        setShowNotifications(false);
                                                    }}
                                                    className="text-xs font-medium text-blue-500 hover:text-blue-600 hover:underline"
                                                >
                                                    Mark all as read
                                                </button>
                                            )}
                                        </div>
                                        <div className="max-h-96 overflow-y-auto w-full divide-y divide-v-border">
                                            {notifications.length === 0 ? (
                                                <div className="p-8 text-center text-sm text-v-muted flex flex-col items-center">
                                                    <div className="h-10 w-10 rounded-full bg-v-secondary flex items-center justify-center mb-2">
                                                        <Bell size={18} className="text-v-muted" />
                                                    </div>
                                                    <p className="font-medium text-v-main">All caught up!</p>
                                                    <p className="text-xs text-v-muted mt-0.5">No new notifications right now</p>
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
                                                        className={`flex gap-3 p-3.5 hover:bg-v-secondary/80 cursor-pointer transition-colors ${!n.read ? 'bg-blue-500/5' : ''}`}
                                                    >
                                                        <div className="mt-0.5 flex-shrink-0 relative">
                                                            {n.initiator?.name ? (
                                                                <div className="h-8 w-8 rounded-full bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-500">
                                                                    {n.initiator.name.charAt(0).toUpperCase()}
                                                                </div>
                                                            ) : (
                                                                <div className="h-8 w-8 rounded-full bg-v-secondary border border-v-border flex items-center justify-center text-v-muted">
                                                                    <Zap size={14} />
                                                                </div>
                                                            )}
                                                            {!n.read && <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-blue-500 rounded-full border-2 border-v-primary" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0 w-full overflow-hidden">
                                                            <p className="text-xs sm:text-sm text-v-main leading-snug break-words">
                                                                {n.initiator && <span className="font-semibold text-v-main">{n.initiator.name} </span>}
                                                                <span className="text-v-muted">{n.message}</span>
                                                            </p>
                                                            <p className="mt-1 text-[11px] text-v-muted/70 font-medium">
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
                        <div className="flex items-center gap-2 pl-1 border-l border-v-border">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-sm">
                                {user.name?.charAt(0).toUpperCase()}
                            </div>
                            <span className="hidden sm:inline text-xs sm:text-sm text-v-main font-semibold max-w-[120px] truncate">{user.name}</span>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto bg-v-secondary p-4 sm:p-6 transition-colors duration-300">
                    <Outlet />
                </main>
            </div>

            {/* ── Coordinated Floating Chat & Copilot Dock ── */}
            <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex items-end gap-3 pointer-events-none">
                {/* Active Direct Conversation Window */}
                {activeConversation && (
                    <div className="w-80 sm:w-88 h-96 pointer-events-auto rounded-2xl shadow-2xl border border-v-border bg-v-primary overflow-hidden">
                        <ChatWindow
                            conversation={activeConversation}
                            onClose={() => dispatch(clearActiveConversation())}
                        />
                    </div>
                )}

                {/* Team Chat Sidebar Drawer */}
                {showChatSidebar && (
                    <div className="w-80 sm:w-88 h-[480px] pointer-events-auto rounded-2xl shadow-2xl border border-v-border bg-v-primary overflow-hidden">
                        <ChatSidebar onClose={() => setShowChatSidebar(false)} />
                    </div>
                )}

                {/* AI Copilot Assistant */}
                <div className="pointer-events-auto">
                    <AIChatAssistant projectId={projectId} />
                </div>

                {/* Chat Floating Trigger */}
                <div className="pointer-events-auto">
                    <button
                        onClick={() => setShowChatSidebar(prev => !prev)}
                        aria-label={showChatSidebar ? 'Close chat messages' : 'Open chat messages'}
                        className={`h-12 w-12 sm:h-13 sm:w-13 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${
                            showChatSidebar 
                                ? 'bg-v-secondary text-v-main border border-v-border rotate-90 hover:bg-v-secondary/80' 
                                : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 shadow-blue-600/30'
                        }`}
                        title="Team Chat"
                    >
                        {showChatSidebar ? <X size={20} /> : <MessageSquare size={20} />}
                    </button>
                </div>
            </div>

            <CommandPalette />
            <KeyboardShortcuts />
        </div>
    );
};

export default DashboardLayout;
