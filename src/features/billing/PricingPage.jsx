import React from 'react';
import { Check, Zap, Users, Rocket } from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';

const plans = [
    {
        name: 'Free',
        price: '₹0',
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
        priceId: 'price_1ProPlanID', // Placeholder
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
        priceId: 'price_1TeamPlanID', // Placeholder
        description: 'Advanced features for scaling teams.',
        features: ['Unlimited projects', 'Team invitations', 'Admin controls', 'SLA support', 'Custom domain'],
        icon: Users,
        buttonText: 'Upgrade to Team',
        current: false
    }
];

const PricingPage = () => {
    const handleUpgrade = async (priceId) => {
        if (!priceId) return;
        try {
            const res = await axiosInstance.post('/billing/checkout', { priceId });
            if (res.data.subscription_session_id) {
                const cashfree = window.Cashfree({ mode: "sandbox" });
                cashfree.subscriptionsCheckout({
                    subsSessionId: res.data.subscription_session_id,
                    redirectTarget: "_self"
                });
            } else if (res.data.url) {
                window.location.href = res.data.url;
            }
        } catch (error) {
            console.error('Failed to initiate checkout:', error);
            alert('Failed to start checkout process. Please try again.');
        }
    };

    return (
        <div className="py-8 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-extrabold text-v-main mb-4">Simple, transparent pricing</h1>
                    <p className="text-xl text-v-muted">Choose the plan that's right for your team.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className={`bg-v-primary rounded-2xl shadow-xl p-8 border ${plan.popular ? 'border-indigo-500 ring-2 ring-indigo-500 ring-opacity-10 scale-105' : 'border-v-border'}`}
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
                                onClick={() => handleUpgrade(plan.priceId)}
                                disabled={plan.current || !plan.priceId}
                                className={`w-full py-3 px-6 rounded-xl font-bold text-center transition-all ${plan.current
                                        ? 'bg-v-secondary text-v-muted cursor-default'
                                        : plan.popular
                                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20'
                                            : 'bg-transparent border-2 border-indigo-600 text-indigo-500 hover:bg-indigo-500/10'
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
        </div>
    );
};

export default PricingPage;
