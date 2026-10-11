import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CreditCard, ExternalLink, ShieldCheck, Loader2, Activity, CheckCircle2, Sparkles } from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';
import { toast } from 'react-toastify';
import UsageBar from './UsageBar';
import { BillingPageSkeleton } from '../../components/ui/Skeleton';

const BillingPage = () => {
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [usage, setUsage] = useState(null);
    const [usageLoading, setUsageLoading] = useState(true);

    const fetchUsage = async () => {
        try {
            const res = await axiosInstance.get('/billing/usage');
            setUsage(res.data);
        } catch (error) {
            console.error('Failed to fetch usage:', error);
        } finally {
            setUsageLoading(false);
        }
    };

    useEffect(() => {
        fetchUsage();

        // Check if returning from a mock upgrade or Cashfree checkout
        if (searchParams.get('mock') === 'true' && searchParams.get('plan')) {
            toast.success(`Plan updated! ${searchParams.get('plan').toUpperCase()} plan is now active.`);
            fetchUsage();
        }

        // Check if returning from a Cashfree checkout with order_id
        const orderId = searchParams.get('order_id');
        if (orderId) {
            axiosInstance.get(`/billing/verify-order/${orderId}`)
                .then(res => {
                    if (res.data.success) {
                        toast.success(`Payment verified! ${res.data.plan.toUpperCase()} plan is now active.`);
                        fetchUsage();
                    }
                })
                .catch(err => {
                    console.error('Order verification error:', err);
                });
        }
    }, [searchParams]);

    const handleManageSubscription = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.post('/billing/checkout', { plan: 'pro' });
            const cashfreeMode = import.meta.env.VITE_CASHFREE_MODE || (import.meta.env.MODE === 'production' ? 'production' : 'sandbox');

            if (res.data.payment_session_id) {
                if (typeof window.Cashfree === 'function') {
                    const cashfree = window.Cashfree({ mode: cashfreeMode });
                    cashfree.checkout({
                        paymentSessionId: res.data.payment_session_id,
                        redirectTarget: '_modal'
                    }).then((result) => {
                        if (result.error) {
                            console.log('Checkout modal closed or error:', result.error);
                        }
                        if (result.redirect) {
                            console.log('Redirecting for payment verification');
                        }
                        if (result.paymentDetails) {
                            toast.success('Payment verified! PRO plan is now active.');
                            fetchUsage();
                        }
                    });
                }
            } else if (res.data.subscription_session_id) {
                if (typeof window.Cashfree === 'function') {
                    const cashfree = window.Cashfree({ mode: cashfreeMode });
                    cashfree.subscriptionsCheckout({
                        subsSessionId: res.data.subscription_session_id,
                        redirectTarget: '_modal'
                    });
                }
            } else if (res.data.url) {
                window.location.href = res.data.url;
            }
        } catch (error) {
            console.error('Checkout Error:', error);
            toast.error(error.response?.data?.message || 'Failed to initialize billing. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <header className="mb-10">
                <h1 className="text-3xl font-bold text-v-main">Billing & Subscription</h1>
                <p className="text-v-muted">Manage your plans and limits via Cashfree Payment Gateway.</p>
            </header>

            <div className="bg-v-primary rounded-2xl shadow-sm border border-v-border p-8 mb-8 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                                <CreditCard size={20} />
                            </span>
                            <h2 className="text-xl font-bold text-v-main">Current Plan</h2>
                            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                {usage?.plan ? `${usage.plan} Plan` : 'Free Plan'}
                            </span>
                        </div>
                        <p className="text-v-muted mb-6">
                            Manage your workspace plan and features securely via Cashfree.
                        </p>

                        <div className="flex flex-wrap gap-3">
                            <Link
                                to="/pricing"
                                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 text-sm"
                            >
                                <Sparkles size={16} />
                                <span>{usage?.plan && usage.plan !== 'free' ? 'Change / Upgrade Plan' : 'Upgrade Plan'}</span>
                            </Link>

                            <button
                                onClick={handleManageSubscription}
                                disabled={loading}
                                className="flex items-center gap-2 px-5 py-3 bg-v-secondary border border-v-border text-v-main rounded-xl font-semibold hover:border-indigo-500 transition-all active:scale-95 disabled:opacity-50 text-sm"
                            >
                                {loading ? 'Initializing...' : 'Instant Pro Checkout'}
                                <ExternalLink size={15} />
                            </button>
                        </div>
                    </div>

                    <div className="hidden md:block shrink-0">
                        <div className="p-5 bg-v-secondary rounded-2xl border border-v-border text-v-muted text-xs shadow-inner transition-colors max-w-xs">
                            <div className="font-semibold text-v-main mb-1">✓ Secure Payments</div>
                            Supported payment modes include UPI, Cards, Netbanking, and Wallets via Cashfree PG.
                        </div>
                    </div>
                </div>
            </div>

            {usageLoading ? (
                <BillingPageSkeleton />
            ) : usage ? (
                <div className="bg-v-primary rounded-2xl shadow-sm border border-v-border p-8 mb-8 transition-colors">
                    <div className="flex items-center gap-2 mb-6">
                        <Activity size={20} className="text-purple-500" />
                        <h2 className="text-xl font-bold text-v-main">Subscription Usage</h2>
                    </div>
                    
                    <div className="space-y-2">
                        <UsageBar 
                            label="Projects" 
                            used={usage.projects.used} 
                            limit={usage.projects.limit} 
                        />
                        <UsageBar 
                            label="AI Copilot Messages" 
                            used={usage.aiCopilot.used} 
                            limit={usage.aiCopilot.limit} 
                        />
                        <UsageBar 
                            label="Meeting Minutes" 
                            used={usage.meetings.used} 
                            limit={usage.meetings.limit} 
                            unit="mins"
                        />
                    </div>
                </div>
            ) : null}

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 flex gap-4 transition-colors">
                <ShieldCheck className="text-blue-500 flex-shrink-0" size={24} />
                <div>
                    <h3 className="font-bold text-v-main mb-1">Billing Support (India)</h3>
                    <p className="text-v-muted text-sm leading-relaxed">
                        Need help with UPI, Netbanking, or Cards?
                        Our support team is here to help 24/7.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default BillingPage;
