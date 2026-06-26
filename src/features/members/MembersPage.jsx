import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axiosInstance from '../../utils/axiosInstance';
import { toast } from 'react-toastify';
import { UserPlus, Trash2, Loader2, Users, Shield, User as UserIcon } from 'lucide-react';

const ROLE_STYLES = {
    Owner: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    Admin: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    'Project Manager': 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
    Developer: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    Tester: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    Viewer: 'bg-slate-500/10 text-v-muted',
    Member: 'bg-slate-500/10 text-v-muted',
};

const MembersPage = () => {
    const { user } = useSelector(state => state.auth);
    const [members, setMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('Member');
    const [isInviting, setIsInviting] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const userRole = typeof user?.role === 'object' ? user?.role?.name : (user?.role || user?.roleName);
    const isAdmin = ['OrgOwner', 'Admin'].includes(userRole);

    const fetchMembers = async () => {
        try {
            setIsLoading(true);
            const res = await axiosInstance.get(`/users`);
            setMembers(res.data);
        } catch {
            toast.error('Failed to load members');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user?._id) fetchMembers();
    }, [user]);

    const handleSearch = async (val) => {
        setSearchQuery(val);
        if (val.length < 2) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const res = await axiosInstance.get(`/users/search?query=${val}`);
            setSearchResults(res.data);
        } catch {
            // silent fail for search
        } finally {
            setIsSearching(false);
        }
    };

    const selectUser = (u) => {
        setInviteEmail(u.email);
        setSearchResults([]);
        setSearchQuery('');
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        if (!inviteEmail.trim()) return;
        setIsInviting(true);
        try {
            const res = await axiosInstance.post(`/users/invite`, { email: inviteEmail, role: inviteRole });
            toast.success(res.data.message);
            setInviteEmail('');
            fetchMembers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to invite member');
        } finally {
            setIsInviting(false);
        }
    };

    const handleRemove = async (memberId, memberName) => {
        if (!window.confirm(`Remove ${memberName} from the organization?`)) return;
        try {
            await axiosInstance.delete(`/users/${memberId}`);
            toast.success(`${memberName} has been removed.`);
            fetchMembers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to remove member');
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 transition-colors">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Users size={22} className="text-blue-500" />
                <h1 className="text-xl font-bold text-v-main">Team Members</h1>
                <span className="ml-auto text-sm text-v-muted">{members.length} member{members.length !== 1 ? 's' : ''}</span>
            </div>

            {isAdmin && (
                <div className="rounded-xl bg-v-primary border border-v-main shadow-sm p-4 sm:p-5 transition-colors">
                    <h2 className="text-sm font-semibold text-v-main mb-4 flex items-center gap-2">
                        <UserPlus size={16} className="text-blue-500" />
                        Invite Member
                    </h2>
                    <form onSubmit={handleInvite} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                        <div className="flex-1 relative">
                            <label className="text-xs font-semibold text-v-muted uppercase tracking-wider">Email Address</label>
                            <input
                                type="text"
                                value={inviteEmail || searchQuery}
                                onChange={e => handleSearch(e.target.value)}
                                placeholder="Search name or email..."
                                required
                                className="mt-1 w-full rounded-lg border border-v-main bg-v-primary px-3 py-2 text-sm text-v-main placeholder:text-v-muted/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                            />
                            {searchResults.length > 0 && (
                                <div className="absolute z-10 mt-1 w-full sm:w-64 bg-v-primary border border-v-main rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto transition-colors">
                                    {searchResults.map(u => (
                                        <button
                                            key={u._id}
                                            type="button"
                                            onClick={() => selectUser(u)}
                                            className="w-full text-left px-4 py-2 text-sm hover:bg-v-secondary flex items-center justify-between transition-colors"
                                        >
                                            <div className="min-w-0">
                                                <p className="font-medium text-v-main truncate">{u.name}</p>
                                                <p className="text-xs text-v-muted truncate">{u.email}</p>
                                            </div>
                                            {u.avatar && <img src={u.avatar} className="h-6 w-6 rounded-full" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <p className="mt-1 text-xs text-v-muted">Search for registered users by name or email.</p>
                        </div>
                        <div className="sm:w-36">
                            <label className="text-xs font-semibold text-v-muted uppercase tracking-wider">Role</label>
                            <select
                                value={inviteRole}
                                onChange={e => setInviteRole(e.target.value)}
                                className="mt-1 w-full rounded-lg border border-v-main bg-v-primary text-v-main px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                            >
                                <option value="Project Manager">Project Manager</option>
                                <option value="Developer">Developer</option>
                                <option value="Tester">Tester</option>
                                <option value="Viewer">Viewer</option>
                                <option value="Admin">Admin</option>
                            </select>
                        </div>
                        <button
                            type="submit"
                            disabled={isInviting}
                            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors h-10"
                        >
                            {isInviting ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                            Invite
                        </button>
                    </form>
                </div>
            )}

            {/* Members list */}
            <div className="rounded-xl bg-v-primary border border-v-main shadow-sm overflow-hidden transition-colors">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 size={28} className="animate-spin text-blue-500" />
                    </div>
                ) : members.length === 0 ? (
                    <p className="py-12 text-center text-v-muted text-sm">No members found.</p>
                ) : (
                    <div className="divide-y divide-v-main">
                        {members.map(member => (
                            <div key={member._id} className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 hover:bg-v-secondary transition-colors group">
                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                                    {member.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-v-main truncate">{member.name}</p>
                                        {member._id === user?._id && (
                                            <span className="text-xs text-v-muted">(you)</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-v-muted truncate hidden sm:block">{member.email}</p>
                                </div>
                                <span className={`rounded-full px-2 sm:px-2.5 py-0.5 text-xs font-medium flex items-center gap-1 flex-shrink-0 ${ROLE_STYLES[member.role] || ROLE_STYLES.Member}`}>
                                    {member.role === 'OrgOwner' ? <Shield size={11} /> : <UserIcon size={11} />}
                                    <span className="hidden sm:inline">{member.role}</span>
                                </span>
                                {member._id !== user?._id && isAdmin && (
                                    <button
                                        onClick={() => handleRemove(member._id, member.name)}
                                        className="rounded-lg p-1.5 text-v-muted hover:bg-red-50 hover:text-red-500 transition-all flex-shrink-0"
                                        title="Remove member"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MembersPage;
