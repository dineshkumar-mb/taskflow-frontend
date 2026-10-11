import React from 'react';
import { Mail, Phone, MapPin, Clock, MessageSquare } from 'lucide-react';

export default function ContactUsPage() {
  return (
    <article className="prose prose-invert max-w-none space-y-6 text-slate-300">
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-indigo-400 text-sm font-semibold tracking-wide uppercase">
          <Mail className="w-5 h-5" />
          <span>Support & Enquiries</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white mt-2">Contact Us</h1>
        <p className="text-sm text-slate-400 mt-1">
          Have questions about TaskFlow, billing, or enterprise onboarding? We are here to help.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-prose">
        {/* Support Email */}
        <div className="bg-slate-800/40 border border-slate-700/60 p-6 rounded-2xl flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Email Support</h3>
            <p className="text-xs text-slate-400 mt-0.5">Primary channel for technical & billing support</p>
            <div className="mt-3 space-y-1">
              <a href="mailto:support@taskflow.com" className="block text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                support@taskflow.com
              </a>
              <a href="mailto:dineshkumarmannibrundha@gmail.com" className="block text-sm text-slate-300 hover:text-indigo-300 transition-colors">
                dineshkumarmannibrundha@gmail.com
              </a>
            </div>
          </div>
        </div>

        {/* Phone Contact */}
        <div className="bg-slate-800/40 border border-slate-700/60 p-6 rounded-2xl flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Phone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Telephone / WhatsApp</h3>
            <p className="text-xs text-slate-400 mt-0.5">Monday to Saturday, 9:00 AM – 7:00 PM IST</p>
            <div className="mt-3">
              <a href="tel:+919092440520" className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
                +91 90924 40520
              </a>
            </div>
          </div>
        </div>

        {/* Operating Address */}
        <div className="bg-slate-800/40 border border-slate-700/60 p-6 rounded-2xl flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Operating Address</h3>
            <p className="text-xs text-slate-400 mt-0.5">Registered development & business operations</p>
            <p className="text-sm text-slate-300 mt-3 leading-relaxed">
              TaskFlow Technologies<br />
              Tamil Nadu, India
            </p>
          </div>
        </div>

        {/* Response SLA */}
        <div className="bg-slate-800/40 border border-slate-700/60 p-6 rounded-2xl flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Response Commitment</h3>
            <p className="text-xs text-slate-400 mt-0.5">Standard SLA for customer inquiries</p>
            <p className="text-sm text-slate-300 mt-3 leading-relaxed">
              We aim to respond to all billing and account queries within <strong>24 business hours</strong>.
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
