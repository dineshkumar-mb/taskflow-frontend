import React, { useState, useEffect } from 'react';
import { Check, Zap, Users, Rocket, X, Ticket, Loader2, Tag, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';
import { toast } from 'react-toastify';

const plans = [
    {
        name: 'Free',
        price: '₹0',
        numericPrice: 0,
        priceId: null,
        description: 'For individuals and small teams starting out.',
        features: ['Up to 2 projects', 'Unlimited tasks', 'Basic analytics', 'Community support'],
        icon: Rocket,
        buttonText: 'Current Plan',
        current: true
    },
    {
        name: 'Pro',
        price: '₹199',
        numericPrice: 199,
        priceId: 'price_1ProPlanID',
        description: 'Take your productivity to the next level.',
        features: ['Unlimited projects', 'Advanced analytics', 'Cashfree billing', 'Priority support', 'Custom fields'],
        icon: Zap,
        buttonText: 'Upgrade to Pro',
        current: false,
        popular: true
    },
    {
        name: 'Team',
        price: '₹499',
        numericPrice: 499,
        priceId: 'price_1TeamPlanID',
        description: 'Advanced features for scaling teams.',
        features: ['Unlimited projects', 'Team invitations', 'Admin controls', 'SLA support', 'Custom domain'],
        icon: Users,
        buttonText: 'Upgrade to Team',
        current: false
    }
];

const CouponBadge = ({ coupon, selected, onClick }) => {
    const label = coupon.discountType === 'percentage'
        ? `${coupon.discountValue}% Off`
        : `₹${coupon.discountValue} Off`;

    const expiry = coupon.expiryDate
        ? `Expires ${new Date(coupon.expiryDate).toLocaleDateString()}`
        : 'No expiry';

    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition-all active:scale-95 ${
                selected
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600'
                    : 'bg-v-secondary border-v-border text-v-main hover:border-blue-500 hover:bg-blue-500/5'
            }`}
        >
            <Tag size={14} className={selected ? 'text-emerald-500' : 'text-v-muted'} />
            <span className="font-mono tracking-wide">{coupon.code}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                selected ? 'bg-emerald-500 text-white' : 'bg-blue-500/10 text-blue-600'
            }`}>
                {label}
            </span>
            {selected && <Check size={14} className="text-emerald-500 ml-auto" />}
        </button>
    );
};

const PricingPage = () => {
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);

    // Coupon state
    const [activeCoupons, setActiveCoupons] = useState([]);
    const [couponsLoading, setCouponsLoading] = useState(false);
    const [showCouponList, setShowCouponList] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [verifyingCoupon, setVerifyingCoupon] = useState(false);
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [checkoutLoading, setCheckoutLoading] = useState(false);

    // Fetch active coupons whenever the modal opens
    useEffect(() => {
        if (!showCheckoutModal) return;
        const fetchCoupons = async () => {
            setCouponsLoading(true);
            try {
                const res = await axiosInstance.get('/billing/active-coupons');
                setActiveCoupons(res.data || []);
            } catch (err) {
                console.error('Could not load active coupons:', err);
                setActiveCoupons([]);
            } finally {
                setCouponsLoading(false);
            }
        };
        fetchCoupons();
    }, [showCheckoutModal]);

    const handleSelectPlan = (plan) => {
        if (plan.current || !plan.priceId) return;
        setSelectedPlan(plan);
        setCouponCode('');
        setAppliedCoupon(null);
        setShowCouponList(false);
        setShowCheckoutModal(true);
    };

    const applyFromList = (coupon) => {
        if (appliedCoupon?.code === coupon.code) {
            // Toggle off
            setAppliedCoupon(null);
            setCouponCode('');
        } else {
            setAppliedCoupon(coupon);
            setCouponCode(coupon.code);
            toast.success(`Coupon "${coupon.code}" applied!`);
        }
    };

    const handleValidateCoupon = async () => {
        if (!couponCode) return;
        setVerifyingCoupon(true);
        try {
            const res = await axiosInstance.post('/billing/validate-coupon', { code: couponCode.toUpperCase().trim() });
            if (res.data.valid) {
                setAppliedCoupon(res.data.coupon);
                toast.success('Coupon applied successfully!');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid coupon code.');
            setAppliedCoupon(null);
        } finally {
            setVerifyingCoupon(false);
        }
    };

    const handleCheckout = async () => {
        setCheckoutLoading(true);
        try {
            const res = await axiosInstance.post('/billing/checkout', {
                plan: selectedPlan.name.toLowerCase(),
                couponCode: appliedCoupon ? appliedCoupon.code : null
            });

            if (res.data.subscription_session_id) {
                const cashfree = window.Cashfree({ mode: 'sandbox' });
                cashfree.subscriptionsCheckout({
                    subsSessionId: res.data.subscription_session_id,
                    redirectTarget: '_self'
                });
            } else if (res.data.url) {
                window.location.href = res.data.url;
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to start checkout. Please try again.');
        } finally {
            setCheckoutLoading(false);
        }
    };

    const calculateDiscountedPrice = () => {
        if (!selectedPlan) return 0;
        if (!appliedCoupon) return selectedPlan.numericPrice;
        const base = selectedPlan.numericPrice;
        if (appliedCoupon.discountType === 'percentage') {
            return Math.max(0, Math.round(base * (1 - appliedCoupon.discountValue / 100)));
        }
        return Math.max(0, Math.round(base - appliedCoupon.discountValue));
    };

    const getDiscountText = () => {
        if (!appliedCoupon) return '';
        return appliedCoupon.discountType === 'percentage'
            ? `${appliedCoupon.discountValue}% Off`
            : `₹${appliedCoupon.discountValue} Off`;
    };

    const closeModal = () => {
        setShowCheckoutModal(false);
        setAppliedCoupon(null);
        setCouponCode('');
        setShowCouponList(false);
    };

    return (
        <div className="py-8 px-4 bg-v-primary text-v-main min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-extrabold text-v-main mb-4">Simple, transparent pricing</h1>
                    <p className="text-xl text-v-muted">Choose the plan that's right for your team.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className={`bg-v-primary rounded-2xl shadow-xl p-8 border transition-all ${
                                plan.popular
                                    ? 'border-indigo-500 ring-2 ring-indigo-500 ring-opacity-10 scale-105 shadow-indigo-500/5'
                                    : 'border-v-border hover:shadow-2xl'
                            }`}
                        >
                            {plan.popular && (
                                <span className="inline-block px-4 py-1 rounded-full bg-indigo-500/10 text-indigo-500 text-xs font-bold uppercase tracking-wider mb-4">
                                    Most Popular
                                </span>
                            )}
                            <div className="flex items-center gap-3 mb-4">
                                <plan.icon className={plan.popular ? 'text-indigo-500' : 'text-v-muted'} size={28} />
                                <h2 className="text-2xl font-bold text-v-main">{plan.name}</h2>
                            </div>
                            <p className="text-v-muted mb-6">{plan.description}</p>
                            <div className="flex items-baseline gap-1 mb-8">
                                <span className="text-4xl font-extrabold text-v-main">{plan.price}</span>
                                <span className="text-v-muted">/month</span>
                            </div>

                            <button
                                onClick={() => handleSelectPlan(plan)}
                                disabled={plan.current || !plan.priceId}
                                className={`w-full py-3 px-6 rounded-xl font-bold text-center transition-all ${
                                    plan.current
                                        ? 'bg-v-secondary text-v-muted cursor-default'
                                        : plan.popular
                                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 active:scale-95'
                                            : 'bg-transparent border-2 border-indigo-600 text-indigo-500 hover:bg-indigo-500/10 active:scale-95'
                                }`}
                            >
                                {plan.buttonText}
                            </button>

                            <ul className="mt-8 space-y-4">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-center gap-3 text-slate-600 text-sm">
                                        <Check size={18} className="text-emerald-500 flex-shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Checkout Modal ── */}
            {showCheckoutModal && selectedPlan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
                    <div className="bg-v-primary border border-v-border rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-5">
                        {/* Header */}
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-v-main">Checkout Confirmation</h3>
                            <button onClick={closeModal} className="text-v-muted hover:text-v-main transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Plan Summary */}
                        <div className="p-4 bg-v-secondary rounded-xl border border-v-border">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-semibold text-v-main">{selectedPlan.name} Plan</span>
                                <span className="font-bold text-v-main">{selectedPlan.price}<span className="text-v-muted text-xs">/mo</span></span>
                            </div>
                            <p className="text-xs text-v-muted">{selectedPlan.description}</p>
                        </div>

                        {/* ── Available Coupons Section ── */}
                        <div>
                            <button
                                type="button"
                                onClick={() => setShowCouponList(p => !p)}
                                className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors w-full"
                            >
                                <Ticket size={16} />
                                {couponsLoading
                                    ? 'Loading coupons…'
                                    : activeCoupons.length > 0
                                        ? `${activeCoupons.length} offer${activeCoupons.length > 1 ? 's' : ''} available — click to apply`
                                        : 'No active offers right now'}
                                {activeCoupons.length > 0 && (
                                    showCouponList ? <ChevronUp size={16} className="ml-auto" /> : <ChevronDown size={16} className="ml-auto" />
                                )}
                            </button>

                            {showCouponList && activeCoupons.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {activeCoupons.map(c => (
                                        <CouponBadge
                                            key={c.code}
                                            coupon={c}
                                            selected={appliedCoupon?.code === c.code}
                                            onClick={() => applyFromList(c)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Manual Coupon Entry */}
                        <div>
                            <label className="block text-xs font-bold text-v-muted uppercase tracking-wider mb-2">
                                Or enter a coupon code manually
                            </label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 text-v-muted" size={16} />
                                    <input
                                        type="text"
                                        placeholder="e.g. SAVE25"
                                        value={couponCode}
                                        onChange={(e) => {
                                            setCouponCode(e.target.value.toUpperCase());
                                            if (appliedCoupon && e.target.value.toUpperCase() !== appliedCoupon.code) {
                                                setAppliedCoupon(null);
                                            }
                                        }}
                                        className="w-full pl-9 pr-3 py-2.5 border border-v-border bg-v-secondary text-v-main rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono font-bold tracking-widest text-sm"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleValidateCoupon}
                                    disabled={verifyingCoupon || !couponCode || appliedCoupon?.code === couponCode}
                                    className="px-4 py-2 bg-v-secondary hover:bg-v-border text-v-main rounded-xl border border-v-border font-bold transition-all disabled:opacity-50 text-sm"
                                >
                                    {verifyingCoupon ? <Loader2 size={16} className="animate-spin" /> : 'Apply'}
                                </button>
                            </div>

                            {appliedCoupon && (
                                <p className="text-xs text-emerald-600 mt-1.5 font-semibold flex items-center gap-1.5">
                                    <Check size={12} />
                                    "{appliedCoupon.code}" — {getDiscountText()} applied!
                                    <button
                                        type="button"
                                        onClick={() => { setAppliedCoupon(null); setCouponCode(''); }}
                                        className="ml-auto text-v-muted hover:text-red-500"
                                    >
                                        <X size={13} />
                                    </button>
                                </p>
                            )}
                        </div>

                        {/* Order Summary */}
                        <div className="border-t border-v-border pt-4 space-y-2 text-sm">
                            <div className="flex justify-between text-v-muted">
                                <span>Subtotal</span>
                                <span>₹{selectedPlan.numericPrice}.00</span>
                            </div>
                            {appliedCoupon && (
                                <div className="flex justify-between text-emerald-600 font-semibold">
                                    <span>Discount ({appliedCoupon.code})</span>
                                    <span>−₹{selectedPlan.numericPrice - calculateDiscountedPrice()}.00</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-lg text-v-main pt-2 border-t border-v-border">
                                <span>You Pay</span>
                                <span className={appliedCoupon ? 'text-emerald-600' : ''}>
                                    ₹{calculateDiscountedPrice()}.00<span className="text-xs font-normal text-v-muted">/mo</span>
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={closeModal}
                                className="flex-1 py-3 border border-v-border text-v-main hover:bg-v-secondary rounded-xl font-bold transition-all active:scale-95 text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCheckout}
                                disabled={checkoutLoading}
                                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 text-sm"
                            >
                                {checkoutLoading && <Loader2 size={15} className="animate-spin" />}
                                Pay Securely via Cashfree
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PricingPage;
