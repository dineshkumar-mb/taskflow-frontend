import React from 'react';
import { Shield, Lock, Eye, Database } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <article className="prose prose-invert max-w-none space-y-6 text-slate-300">
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-indigo-400 text-sm font-semibold tracking-wide uppercase">
          <Shield className="w-5 h-5" />
          <span>Data Protection</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white mt-2">Privacy Policy</h1>
        <p className="text-sm text-slate-400 mt-1">Last updated: October 11, 2026</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">1. Information We Collect</h2>
        <p>
          We collect information necessary to provide and enhance our project management platform:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-slate-300">
          <li><strong>Account Details:</strong> Name, email address, password hash, and company/organization name.</li>
          <li><strong>Workspace Data:</strong> Projects, tasks, issues, sprints, comments, and attachments submitted by you and your team.</li>
          <li><strong>Billing Information:</strong> Billing contacts, transaction IDs, and plan subscriptions. Note that full credit card numbers and banking credentials are handled directly by PCI-DSS certified payment processors (Cashfree Payments) and are never stored on TaskFlow servers.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">2. How We Use Your Information</h2>
        <p>We use the collected information for the following purposes:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <div className="bg-slate-800/40 border border-slate-700/60 p-4 rounded-xl">
            <h3 className="font-semibold text-white text-base flex items-center gap-2 mb-1">
              <Database className="w-4 h-4 text-indigo-400" /> Service Delivery
            </h3>
            <p className="text-sm text-slate-300">Providing issue boards, real-time collaboration, email notifications, and team meetings.</p>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/60 p-4 rounded-xl">
            <h3 className="font-semibold text-white text-base flex items-center gap-2 mb-1">
              <Lock className="w-4 h-4 text-emerald-400" /> Security & Billing
            </h3>
            <p className="text-sm text-slate-300">Processing subscription payments via Cashfree, fraud prevention, and audit trail logging.</p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">3. Third-Party Payment Gateway</h2>
        <p>
          We use <strong>Cashfree Payments India Pvt. Ltd.</strong> as our payment gateway partner. When you make a payment, your payment details are transmitted directly to Cashfree's secure servers adhering to PCI-DSS standards and RBI compliance directives.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">4. Data Security</h2>
        <p>
          We implement industry-standard encryption protocols (TLS/SSL) for all data in transit and AES encryption at rest to ensure the highest level of security for your organizational assets.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">5. Your Rights and Data Retention</h2>
        <p>
          You have the right to access, update, or request the deletion of your account and organization data at any time by contacting our support team at <strong>support@taskflow.com</strong>.
        </p>
      </section>
    </article>
  );
}
