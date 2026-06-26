import { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { toast } from 'react-toastify';
import { Shield, Plus, Edit2, Trash2, Check, X, ShieldAlert, Loader2 } from 'lucide-react';
import { useSelector } from 'react-redux';

const AVAILABLE_PERMISSIONS = [
    { id: 'manage_users', label: 'Manage Users & Roles' },
    { id: 'manage_projects', label: 'Manage All Projects' },
    { id: 'manage_billing', label: 'Manage Billing' },
    { id: 'view_projects', label: 'View Projects' },
    { id: 'edit_tasks', label: 'Create & Edit Tasks' },
    { id: 'view_assigned_tasks', label: 'View Assigned Tasks Only' },
];

const RolesPage = () => {
    const { user } = useSelector(state => state.auth);
    const [roles, setRoles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentRole, setCurrentRole] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '', permissions: [] });

    // Ensure user has permission
    const canManageRoles = ['OrgOwner', 'Admin', 'SuperAdmin'].includes(user?.role) || user?.role?.permissions?.includes('manage_users') || user?.role?.permissions?.includes('*');

    const fetchRoles = async () => {
        try {
            setIsLoading(true);
            const res = await axiosInstance.get('/roles');
            setRoles(res.data);
        } catch (error) {
            toast.error('Failed to load roles');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const handleOpenForm = (role = null) => {
        if (role) {
            setFormData({ name: role.name, description: role.description, permissions: role.permissions });
            setCurrentRole(role);
        } else {
            setFormData({ name: '', description: '', permissions: [] });
            setCurrentRole(null);
        }
        setIsEditing(true);
    };

    const handleCloseForm = () => {
        setIsEditing(false);
        setCurrentRole(null);
    };

    const togglePermission = (permId) => {
        setFormData(prev => {
            const hasPerm = prev.permissions.includes(permId);
            if (hasPerm) {
                return { ...prev, permissions: prev.permissions.filter(p => p !== permId) };
            } else {
                return { ...prev, permissions: [...prev.permissions, permId] };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (currentRole) {
                await axiosInstance.put(`/roles/${currentRole._id}`, formData);
                toast.success('Role updated successfully');
            } else {
                await axiosInstance.post('/roles', formData);
                toast.success('Role created successfully');
            }
            handleCloseForm();
            fetchRoles();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error saving role');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this role?')) return;
        try {
            await axiosInstance.delete(`/roles/${id}`);
            toast.success('Role deleted successfully');
            fetchRoles();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error deleting role');
        }
    };

    if (!canManageRoles) {
        return (
            <div className="flex h-full items-center justify-center text-v-muted">
                <div className="text-center">
                    <ShieldAlert size={48} className="mx-auto mb-4 text-v-muted/50" />
                    <h2 className="text-lg font-medium text-v-main">Access Denied</h2>
                    <p className="text-sm mt-1">You do not have permission to manage roles.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-v-bg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-v-border shrink-0">
                <div>
                    <h1 className="text-xl font-bold text-v-main flex items-center gap-2">
                        <Shield size={20} className="text-blue-500" />
                        Roles & Permissions
                    </h1>
                    <p className="text-sm text-v-muted mt-1">Manage access control and define custom roles for your organization.</p>
                </div>
                {!isEditing && (
                    <button
                        onClick={() => handleOpenForm()}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        <Plus size={16} />
                        Create Role
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {isEditing ? (
                    <div className="max-w-2xl mx-auto bg-v-component border border-v-border rounded-xl p-6">
                        <h2 className="text-lg font-bold text-v-main mb-6">
                            {currentRole ? 'Edit Role' : 'Create Custom Role'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-v-main mb-2">Role Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 bg-v-bg border border-v-border rounded-lg text-v-main focus:outline-none focus:border-blue-500"
                                    placeholder="e.g. Guest Developer"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-v-main mb-2">Description</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 bg-v-bg border border-v-border rounded-lg text-v-main focus:outline-none focus:border-blue-500"
                                    placeholder="Brief description of the role's purpose"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-v-main mb-4">Permissions</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {AVAILABLE_PERMISSIONS.map(perm => {
                                        const isChecked = formData.permissions.includes(perm.id) || formData.permissions.includes('*');
                                        const isAll = formData.permissions.includes('*');
                                        return (
                                            <div 
                                                key={perm.id}
                                                onClick={() => !isAll && togglePermission(perm.id)}
                                                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isChecked ? 'bg-blue-500/10 border-blue-500/30' : 'bg-v-bg border-v-border hover:border-v-border/80'}`}
                                            >
                                                <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-v-border'}`}>
                                                    {isChecked && <Check size={14} />}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className={`text-sm font-medium ${isChecked ? 'text-blue-500' : 'text-v-main'}`}>{perm.label}</span>
                                                    <span className="text-xs text-v-muted font-mono mt-1">{perm.id}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-v-border">
                                <button
                                    type="button"
                                    onClick={handleCloseForm}
                                    className="px-4 py-2 text-sm font-medium text-v-muted hover:text-v-main"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                                >
                                    Save Role
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {isLoading ? (
                            <div className="col-span-full flex justify-center py-12">
                                <Loader2 size={24} className="animate-spin text-blue-500" />
                            </div>
                        ) : roles.length > 0 ? (
                            roles.map(role => (
                                <div key={role._id} className="bg-v-component border border-v-border rounded-xl p-5 flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-lg font-bold text-v-main flex items-center gap-2">
                                            {role.name}
                                            {role.isSystem && (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-500 uppercase tracking-wider">System</span>
                                            )}
                                        </h3>
                                        {!role.isSystem && (
                                            <div className="flex gap-2">
                                                <button onClick={() => handleOpenForm(role)} className="p-1.5 text-v-muted hover:text-blue-500 rounded bg-v-bg">
                                                    <Edit2 size={14} />
                                                </button>
                                                <button onClick={() => handleDelete(role._id)} className="p-1.5 text-v-muted hover:text-red-500 rounded bg-v-bg">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-sm text-v-muted mb-4 flex-1">{role.description || 'No description provided.'}</p>
                                    
                                    <div>
                                        <p className="text-xs font-semibold text-v-muted uppercase tracking-wider mb-2">Permissions</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {role.permissions.includes('*') ? (
                                                <span className="px-2 py-1 rounded bg-red-500/10 text-red-500 text-xs font-medium">All Permissions (*)</span>
                                            ) : role.permissions.length > 0 ? (
                                                role.permissions.slice(0, 3).map((p, idx) => (
                                                    <span key={idx} className="px-2 py-1 rounded bg-v-bg border border-v-border text-v-main text-xs font-medium">
                                                        {p.replace('_', ' ')}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs text-v-muted italic">No permissions</span>
                                            )}
                                            {!role.permissions.includes('*') && role.permissions.length > 3 && (
                                                <span className="px-2 py-1 rounded bg-v-bg border border-v-border text-v-main text-xs font-medium">
                                                    +{role.permissions.length - 3} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full flex flex-col items-center justify-center py-12 text-v-muted border border-dashed border-v-border rounded-xl">
                                <Shield size={32} className="mb-3 opacity-50" />
                                <p>No roles found.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RolesPage;
