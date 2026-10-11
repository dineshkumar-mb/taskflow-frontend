import React from 'react';
import { RefreshCw, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function RefundPolicyPage() {
  return (
    <article className="prose prose-invert max-w-none space-y-6 text-slate-300">
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-indigo-400 text-sm font-semibold tracking-wide uppercase">
          <RefreshCw className="w-5 h-5" />
          <span>Customer Protection</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white mt-2">Refund & Cancellation Policy</h1>
        <p className="text-sm text-slate-400 mt-1">Last updated: October 11, 2026</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">1. Cancellation Policy</h2>
        <p>
          At TaskFlow, we want you to be completely satisfied with our project management platform. You can cancel your subscription plan at any time through the <strong>Billing</strong> section of your Organization dashboard.
        </p>
        <div className="bg-slate-800/40 border border-slate-700/60 p-4 rounded-xl flex items-start gap-3">
          <Clock className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-white text-sm">Instant Cancellation</h4>
            <p className="text-sm text-slate-300 mt-1">
              Upon cancellation, your plan will remain active until the end of your current paid billing period, and no further automatic charges will occur.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">2. 7-Day Money-Back Guarantee</h2>
        <p>
          We offer a full <strong>7-day money-back guarantee</strong> for all first-time paid plan upgrades (Starter or Professional). If you find TaskFlow does not meet your team's workflow requirements within 7 days of purchase:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-slate-300">
          <li>Send a refund request email to <strong>support@taskflow.com</strong> or <strong>dineshkumarmannibrundha@gmail.com</strong> with your organization name and registered email address.</li>
          <li>Our team will acknowledge and process your request within 24–48 business hours.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">3. Refund Processing & Turnaround Time</h2>
        <p>
          Once your refund is approved:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <div className="bg-slate-800/40 border border-slate-700/60 p-4 rounded-xl">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
              <CheckCircle2 className="w-4 h-4" />
              Payment Source
            </div>
            <p className="text-sm text-slate-300">
              Refunds are credited directly back to the original payment source (Credit/Debit Card, UPI account, or Net Banking) used during checkout.
            </p>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/60 p-4 rounded-xl">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold mb-1">
              <Clock className="w-4 h-4" />
              Settlement Window
            </div>
            <p className="text-sm text-slate-300">
              The refund amount typically reflects in your bank account within <strong>5 to 7 working days</strong>, depending on your banking institution.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">4. Non-Refundable Items</h2>
        <p>
          Refunds are not applicable for enterprise custom consulting services or billing periods that have elapsed past the 7-day initial request window.
        </p>
      </section>
    </article>
  );
}
