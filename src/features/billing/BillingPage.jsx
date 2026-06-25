import React, { useState } from 'react';
import { CreditCard, ExternalLink, ShieldCheck } from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';

const BillingPage = () => {
    const [loading, setLoading] = useState(false);

    const handleManageSubscription = async () => {
        setLoading(true);
        try {
            // For Cashfree, we use /billing/checkout to get a session
            const res = await axiosInstance.post('/billing/checkout', { plan: 'pro' });

            if (res.data.sessionId && window.Cashfree) {
                const cashfree = window.Cashfree({
                    mode: "sandbox" // Default to sandbox for safety
                });

                await cashfree.checkout({
                    paymentSessionId: res.data.sessionId,
                    redirectTarget: "_self"
                });
            } else if (res.data.url) {
                window.location.href = res.data.url;
            }
        } catch (error) {
            console.error('Checkout Error:', error);
            alert('Failed to initialize Cashfree. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <header className="mb-10">
                <h1 className="text-3xl font-bold text-v-main">Billing & Subscription</h1>
                <p className="text-v-muted">Manage your plan via Cashfree (India).</p>
            </header>

            <div className="bg-v-primary rounded-2xl shadow-sm border border-v-border p-8 mb-8 transition-colors">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                                <CreditCard size={20} />
                            </span>
                            <h2 className="text-xl font-bold text-v-main">Current Plan</h2>
                        </div>
                        <p className="text-v-muted mb-6">Manage your subscription via our secure billing system.</p>

                        <div className="flex gap-4">
                            <button
                                onClick={handleManageSubscription}
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50"
                            >
                                {loading ? 'Loading...' : 'Upgrade with Cashfree'}
                                <ExternalLink size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="hidden md:block">
                        <div className="p-6 bg-v-secondary rounded-2xl border border-v-border italic text-v-muted text-sm shadow-inner transition-colors">
                            "Securely managed by Cashfree Payments"
                        </div>
                    </div>
                </div>
            </div>

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
