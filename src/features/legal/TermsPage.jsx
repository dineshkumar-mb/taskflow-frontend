import React from 'react';
import { FileText, CheckCircle2 } from 'lucide-react';

export default function TermsPage() {
  return (
    <article className="prose prose-invert max-w-none space-y-6 text-slate-300">
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-indigo-400 text-sm font-semibold tracking-wide uppercase">
          <FileText className="w-5 h-5" />
          <span>Legal Agreement</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white mt-2">Terms of Service</h1>
        <p className="text-sm text-slate-400 mt-1">Last updated: October 11, 2026</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">1. Acceptance of Terms</h2>
        <p>
          By accessing or using TaskFlow (the "Service") at <strong>taskflow-frontend-self.vercel.app</strong> or any associated domain, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">2. Description of Service</h2>
        <p>
          TaskFlow is a cloud-based Project Management and Issue Tracking Software-as-a-Service (SaaS) application providing sprint planning, kanban boards, issue tracking, workload analytics, and team collaboration tools.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">3. User Accounts and Security</h2>
        <p>
          To access the Service, you must create an account with accurate and up-to-date information. You are responsible for safeguarding your login credentials and for any activities or actions under your password.
        </p>
        <ul className="list-disc pl-5 space-y-1 text-slate-300">
          <li>You must be at least 18 years of age or the age of legal majority in your jurisdiction.</li>
          <li>You may not use the Service for any unlawful or unauthorized purpose.</li>
          <li>You are responsible for all content uploaded to your organization workspace.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">4. Subscription Plans and Payment Terms</h2>
        <p>
          TaskFlow offers free and paid subscription plans (Starter, Professional, and Enterprise). Payments are processed securely via our authorized payment gateway partner, <strong>Cashfree Payments</strong>.
        </p>
        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700 space-y-2">
          <div className="flex items-center gap-2 text-indigo-300 font-semibold text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Pricing & Currency:
          </div>
          <p className="text-sm text-slate-300">
            All prices are stated in Indian Rupees (INR) or US Dollars (USD) as displayed on the Pricing page. Payments are charged at the time of purchase or upgrade.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">5. Termination and Suspension</h2>
        <p>
          You may cancel your account at any time from your Organization Billing settings. We reserve the right to suspend or terminate accounts that violate our terms or engage in fraudulent activities.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">6. Limitation of Liability</h2>
        <p>
          In no event shall TaskFlow Technologies, its directors, employees, or partners be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the Service.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-white">7. Governing Law</h2>
        <p>
          These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions.
        </p>
      </section>
    </article>
  );
}
