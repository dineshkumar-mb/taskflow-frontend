import React from 'react';
import { Check, Zap, Users, Rocket } from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';

const plans = [
    {
        name: 'Free',
        price: '$0',
        priceId: null,
        description: 'For individuals and small teams starting out.',
        features: ['Up to 2 projects', 'Unlimited tasks', 'Basic analytics', 'Community support'],
        icon: Rocket,
        buttonText: 'Current Plan',
        current: true
    },
    {
        name: 'Pro',
        price: '$19',
        priceId: 'price_1ProPlanID', // Placeholder
        description: 'Take your productivity to the next level.',
        features: ['Unlimited projects', 'Advanced analytics', 'Stripe billing', 'Priority support', 'Custom fields'],
        icon: Zap,
        buttonText: 'Upgrade to Pro',
        current: false,
        popular: true
    },
    {
        name: 'Team',
        price: '$49',
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
            if (res.data.url) {
                window.location.href = res.data.url;
            }
        } catch (error) {
            console.error('Failed to initiate checkout:', error);
            alert('Failed to start checkout process. Please try again.');
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen py-16 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Simple, transparent pricing</h1>
                    <p className="text-xl text-slate-600">Choose the plan that's right for your team.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className={`bg-white rounded-2xl shadow-xl p-8 border ${plan.popular ? 'border-indigo-500 ring-2 ring-indigo-500 ring-opacity-10 scale-105' : 'border-slate-200'}`}
                        >
                            {plan.popular && (
                                <span className="inline-block px-4 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-4">
                                    Most Popular
                                </span>
                            )}
                            <div className="flex items-center gap-3 mb-4">
                                <plan.icon className={plan.popular ? 'text-indigo-600' : 'text-slate-400'} size={28} />
                                <h2 className="text-2xl font-bold text-slate-800">{plan.name}</h2>
                            </div>
                            <p className="text-slate-500 mb-6">{plan.description}</p>
                            <div className="flex items-baseline gap-1 mb-8">
                                <span className="text-4xl font-extrabold text-slate-900">{plan.price}</span>
                                <span className="text-slate-500">/month</span>
                            </div>

                            <button
                                onClick={() => handleUpgrade(plan.priceId)}
                                disabled={plan.current || !plan.priceId}
                                className={`w-full py-3 px-6 rounded-xl font-bold text-center transition-all ${plan.current
                                        ? 'bg-slate-100 text-slate-500 cursor-default'
                                        : plan.popular
                                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
                                            : 'bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50'
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
