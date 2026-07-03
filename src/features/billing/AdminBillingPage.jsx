import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
    Users, Ticket, Plus, Trash2, Edit2, ShieldAlert, 
    Check, X, Search, RefreshCw, Loader2, Calendar, Hash
} from 'lucide-react';
import { AdminBillingPageSkeleton } from '../../components/ui/Skeleton';
import axiosInstance from '../../utils/axiosInstance';
import { toast } from 'react-toastify';

const AdminBillingPage = () => {
    const { user } = useSelector((state) => state.auth);
    const navigate = useNavigate();

    // Access Control
    const userRole = typeof user?.role === 'object' ? user?.role?.name : (user?.role || user?.roleName);
    const isSuperAdmin = userRole === 'SuperAdmin';

    useEffect(() => {
        if (!isSuperAdmin) {
            navigate('/dashboard');
        }
    }, [isSuperAdmin, navigate]);

    // State Variables
    const [activeTab, setActiveTab] = useState('organizations');
    const [organizations, setOrganizations] = useState([]);
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Search/Filters
    const [orgSearch, setOrgSearch] = useState('');
    
    // Modals
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [selectedOrg, setSelectedOrg] = useState(null);
    const [modalPlan, setModalPlan] = useState('free');
    const [modalStatus, setModalStatus] = useState('ACTIVE');
    const [savingPlan, setSavingPlan] = useState(false);

    const [showCouponModal, setShowCouponModal] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [couponType, setCouponType] = useState('percentage');
    const [couponValue, setCouponValue] = useState('');
    const [couponExpiry, setCouponExpiry] = useState('');
    const [couponMaxRedemptions, setCouponMaxRedemptions] = useState('');
    const [savingCoupon, setSavingCoupon] = useState(false);

    // Fetch Data
    const fetchData = async () => {
        if (!isSuperAdmin) return;
        setLoading(true);
        try {
            if (activeTab === 'organizations') {
                const res = await axiosInstance.get('/admin/organizations');
                setOrganizations(res.data);
            } else {
                const res = await axiosInstance.get('/admin/coupons');
                setCoupons(res.data);
            }
        } catch (error) {
            console.error('Error fetching admin data:', error);
            toast.error(error.response?.data?.message || 'Failed to load details.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab, isSuperAdmin]);

    // Handle Manual Plan Override
    const handleOpenPlanModal = (org) => {
        setSelectedOrg(org);
        setModalPlan(org.plan || 'free');
        setModalStatus(org.subscriptionStatus || 'ACTIVE');
        setShowPlanModal(true);
    };

    const handleSavePlanOverride = async () => {
        if (!selectedOrg) return;
        setSavingPlan(true);
        try {
            await axiosInstance.put(`/admin/organizations/${selectedOrg._id}/plan`, {
                plan: modalPlan,
                subscriptionStatus: modalStatus
            });
            toast.success(`Plan updated successfully for ${selectedOrg.name}!`);
            setShowPlanModal(false);
            fetchData();
        } catch (error) {
            console.error('Error saving manual plan override:', error);
            toast.error(error.response?.data?.message || 'Failed to update plan.');
        } finally {
            setSavingPlan(false);
        }
    };

    // Handle Coupon Creation
    const handleCreateCoupon = async (e) => {
        e.preventDefault();
        if (!couponCode || !couponValue) {
            toast.warn('Please fill in all required fields.');
            return;
        }

        setSavingCoupon(true);
        try {
            await axiosInstance.post('/admin/coupons', {
                code: couponCode.toUpperCase().trim(),
                discountType: couponType,
                discountValue: Number(couponValue),
                expiryDate: couponExpiry || null,
                maxRedemptions: couponMaxRedemptions ? Number(couponMaxRedemptions) : null
            });
            toast.success('Coupon generated successfully!');
            setShowCouponModal(false);
            
            // Reset form
            setCouponCode('');
            setCouponType('percentage');
            setCouponValue('');
            setCouponExpiry('');
            setCouponMaxRedemptions('');
            
            fetchData();
        } catch (error) {
            console.error('Error creating coupon:', error);
            toast.error(error.response?.data?.message || 'Failed to generate coupon.');
        } finally {
            setSavingCoupon(false);
        }
    };

    // Handle Coupon Deletion
    const handleDeleteCoupon = async (id) => {
        if (!window.confirm('Are you sure you want to delete this coupon?')) return;
        try {
            await axiosInstance.delete(`/admin/coupons/${id}`);
            toast.success('Coupon deleted successfully!');
            fetchData();
        } catch (error) {
            console.error('Error deleting coupon:', error);
            toast.error(error.response?.data?.message || 'Failed to delete coupon.');
        }
    };

    if (!isSuperAdmin) return null;

    // Filter organizations by search
    const filteredOrgs = organizations.filter(org => 
        org.name.toLowerCase().includes(orgSearch.toLowerCase()) ||
        org.owner?.name?.toLowerCase().includes(orgSearch.toLowerCase()) ||
        org.owner?.email?.toLowerCase().includes(orgSearch.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen bg-v-primary text-v-main">
            <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold flex items-center gap-3">
                        <ShieldAlert className="text-red-500" size={32} />
                        Admin Billing Control Panel
                    </h1>
                    <p className="text-v-muted mt-1">Configure user subscriptions, manually override active plans, and generate coupon codes.</p>
                </div>
                <button 
                    onClick={fetchData} 
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 border border-v-border bg-v-secondary hover:bg-v-border rounded-xl transition-all disabled:opacity-50"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </header>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-v-border mb-8">
                <button
                    onClick={() => setActiveTab('organizations')}
                    className={`flex items-center gap-2 pb-4 px-2 font-bold text-sm border-b-2 transition-all ${activeTab === 'organizations' ? 'border-blue-600 text-blue-600' : 'border-transparent text-v-muted hover:text-v-main'}`}
                >
                    <Users size={18} />
                    Organizations & Subscriptions
                </button>
                <button
                    onClick={() => setActiveTab('coupons')}
                    className={`flex items-center gap-2 pb-4 px-2 font-bold text-sm border-b-2 transition-all ${activeTab === 'coupons' ? 'border-blue-600 text-blue-600' : 'border-transparent text-v-muted hover:text-v-main'}`}
                >
                    <Ticket size={18} />
                    Coupons & Discounts
                </button>
            </div>

            {/* Tab Contents */}
            {activeTab === 'organizations' ? (
                <div>
                    <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-v-muted" size={18} />
                            <input
                                type="text"
                                placeholder="Search by name, owner, email..."
                                value={orgSearch}
                                onChange={(e) => setOrgSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-v-border rounded-xl bg-v-secondary text-v-main focus:outline-none focus:ring-2 focus:ring-blue-600"
                            />
                        </div>
                        <div className="text-sm text-v-muted">
                            Showing {filteredOrgs.length} organization(s)
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-6"><AdminBillingPageSkeleton /></div>
                    ) : (
                        <div className="bg-v-primary border border-v-border rounded-2xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-v-secondary border-b border-v-border text-v-muted text-xs font-semibold uppercase tracking-wider">
                                            <th className="py-4 px-6">Organization</th>
                                            <th className="py-4 px-6">Owner</th>
                                            <th className="py-4 px-6">Current Plan</th>
                                            <th className="py-4 px-6">Subscription Status</th>
                                            <th className="py-4 px-6">Last Updated</th>
                                            <th className="py-4 px-6 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-v-border text-sm">
                                        {filteredOrgs.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="py-8 text-center text-v-muted italic">
                                                    No organizations found.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredOrgs.map((org) => (
                                                <tr key={org._id} className="hover:bg-v-secondary/30 transition-colors">
                                                    <td className="py-4 px-6 font-semibold text-v-main">{org.name}</td>
                                                    <td className="py-4 px-6">
                                                        <div className="font-medium">{org.owner?.name || 'Unknown'}</div>
                                                        <div className="text-xs text-v-muted">{org.owner?.email || 'N/A'}</div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                                            org.plan === 'team' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' : 
                                                            org.plan === 'pro' ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20' : 
                                                            'bg-slate-500/10 text-v-muted border border-v-border'
                                                        }`}>
                                                            {org.plan}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                                                            org.subscriptionStatus === 'ACTIVE' || org.subscriptionStatus === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                                                        }`}>
                                                            {org.subscriptionStatus || 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-v-muted">
                                                        {new Date(org.updatedAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="py-4 px-6 text-right">
                                                        <button 
                                                            onClick={() => handleOpenPlanModal(org)}
                                                            className="flex items-center gap-1.5 ml-auto px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all active:scale-95"
                                                        >
                                                            <Edit2 size={12} />
                                                            Modify Plan
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div>
                    <div className="mb-6 flex justify-between items-center">
                        <h2 className="text-xl font-bold">Active Coupons</h2>
                        <button
                            onClick={() => setShowCouponModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all active:scale-95 shadow-md shadow-blue-600/20"
                        >
                            <Plus size={18} />
                            Generate Coupon
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 size={32} className="animate-spin text-blue-600" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {coupons.length === 0 ? (
                                <div className="col-span-full py-16 border-2 border-dashed border-v-border rounded-2xl text-center text-v-muted italic">
                                    No coupons generated yet. Click "Generate Coupon" to create one.
                                </div>
                            ) : (
                                coupons.map((coupon) => (
                                    <div 
                                        key={coupon._id} 
                                        className="bg-v-primary border border-v-border p-6 rounded-2xl relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5"
                                    >
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 rounded-full -mr-8 -mt-8 flex items-center justify-center">
                                            <Ticket className="text-blue-500/20 -ml-4 -mt-4" size={40} />
                                        </div>

                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <span className="font-mono text-xl font-extrabold uppercase tracking-wide bg-blue-500/10 text-blue-600 px-3 py-1 rounded-lg">
                                                    {coupon.code}
                                                </span>
                                                <span className={`ml-2 inline-block px-2 py-0.5 rounded text-[10px] font-bold ${coupon.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                                    {coupon.active ? 'ACTIVE' : 'INACTIVE'}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteCoupon(coupon._id)}
                                                className="text-v-muted hover:text-red-500 transition-colors p-1"
                                                title="Delete Coupon"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>

                                        <div className="space-y-2 text-sm text-v-muted mb-4">
                                            <div className="flex justify-between">
                                                <span>Discount Value:</span>
                                                <span className="font-bold text-v-main">
                                                    {coupon.discountType === 'percentage' ? `${coupon.discountValue}% Off` : `₹${coupon.discountValue} Off`}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Total Redemptions:</span>
                                                <span className="font-semibold text-v-main">{coupon.redemptionsCount} {coupon.maxRedemptions ? `/ ${coupon.maxRedemptions}` : ''}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Expiry Date:</span>
                                                <span className="font-semibold text-v-main">
                                                    {coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString() : 'Never'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Plan Modification Modal */}
            {showPlanModal && selectedOrg && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
                    <div className="bg-v-primary border border-v-border rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">Manual Plan Override</h3>
                            <button onClick={() => setShowPlanModal(false)} className="text-v-muted hover:text-v-main">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm text-v-muted">Modifying plan for organization:</p>
                            <h4 className="text-lg font-bold text-v-main">{selectedOrg.name}</h4>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-xs font-bold text-v-muted uppercase tracking-wider mb-2">Subscription Plan</label>
                                <select 
                                    value={modalPlan}
                                    onChange={(e) => setModalPlan(e.target.value)}
                                    className="w-full p-3 border border-v-border bg-v-secondary text-v-main rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                                >
                                    <option value="free">Free</option>
                                    <option value="pro">Pro</option>
                                    <option value="team">Team</option>
                                    <option value="starter">Starter</option>
                                    <option value="business">Business</option>
                                    <option value="enterprise">Enterprise</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-v-muted uppercase tracking-wider mb-2">Subscription Status</label>
                                <select 
                                    value={modalStatus}
                                    onChange={(e) => setModalStatus(e.target.value)}
                                    className="w-full p-3 border border-v-border bg-v-secondary text-v-main rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                                >
                                    <option value="ACTIVE">ACTIVE</option>
                                    <option value="CANCELLED">CANCELLED</option>
                                    <option value="ON_HOLD">ON HOLD</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowPlanModal(false)}
                                className="flex-1 py-3 border border-v-border text-v-main hover:bg-v-secondary rounded-xl font-bold transition-all active:scale-95"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSavePlanOverride}
                                disabled={savingPlan}
                                className="flex-1 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                {savingPlan && <Loader2 size={16} className="animate-spin" />}
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Coupon Creation Modal */}
            {showCouponModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
                    <div className="bg-v-primary border border-v-border rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">Generate Discount Coupon</h3>
                            <button onClick={() => setShowCouponModal(false)} className="text-v-muted hover:text-v-main">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateCoupon} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-v-muted uppercase tracking-wider mb-2">Coupon Code *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. SAVE25"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                    className="w-full p-3 border border-v-border bg-v-secondary text-v-main rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono tracking-wider"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-v-muted uppercase tracking-wider mb-2">Discount Type *</label>
                                    <select 
                                        value={couponType}
                                        onChange={(e) => setCouponType(e.target.value)}
                                        className="w-full p-3 border border-v-border bg-v-secondary text-v-main rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="flat">Flat (₹)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-v-muted uppercase tracking-wider mb-2">Value *</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        placeholder={couponType === 'percentage' ? 'e.g. 20' : 'e.g. 100'}
                                        value={couponValue}
                                        onChange={(e) => setCouponValue(e.target.value)}
                                        className="w-full p-3 border border-v-border bg-v-secondary text-v-main rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-semibold"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-v-muted uppercase tracking-wider mb-2">Max Redemptions</label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-v-muted" size={16} />
                                        <input
                                            type="number"
                                            min="1"
                                            placeholder="Unlimited"
                                            value={couponMaxRedemptions}
                                            onChange={(e) => setCouponMaxRedemptions(e.target.value)}
                                            className="w-full pl-9 pr-3 py-3 border border-v-border bg-v-secondary text-v-main rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-v-muted uppercase tracking-wider mb-2">Expiry Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-v-muted" size={16} />
                                        <input
                                            type="date"
                                            value={couponExpiry}
                                            onChange={(e) => setCouponExpiry(e.target.value)}
                                            className="w-full pl-9 pr-3 py-3 border border-v-border bg-v-secondary text-v-main rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCouponModal(false)}
                                    className="flex-1 py-3 border border-v-border text-v-main hover:bg-v-secondary rounded-xl font-bold transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingCoupon}
                                    className="flex-1 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    {savingCoupon && <Loader2 size={16} className="animate-spin" />}
                                    Generate
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminBillingPage;
