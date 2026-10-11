import React from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { ArrowLeft, Shield, FileText, RefreshCw, Mail, CheckCircle2 } from 'lucide-react';

export default function LegalLayout() {
  const navItems = [
    { to: '/terms', label: 'Terms of Service', icon: FileText },
    { to: '/privacy', label: 'Privacy Policy', icon: Shield },
    { to: '/refund-policy', label: 'Refund & Cancellation', icon: RefreshCw },
    { to: '/contact', label: 'Contact Us', icon: Mail },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/login" className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
                TF
              </div>
              <span className="font-bold text-lg text-white tracking-tight">TaskFlow</span>
            </Link>
            <span className="text-slate-500 text-sm hidden sm:inline">|</span>
            <span className="text-slate-400 text-xs sm:text-sm font-medium hidden sm:inline">Legal & Compliance Portal</span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white px-3.5 py-1.5 rounded-lg border border-slate-700/80 hover:bg-slate-800/80 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to App</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 sm:py-12">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 p-1.5 bg-slate-900/80 rounded-2xl border border-slate-800 w-fit">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </div>

        {/* Content Container */}
        <div className="bg-slate-900/50 border border-slate-800/90 rounded-2xl p-6 sm:p-10 shadow-xl backdrop-blur-sm">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/90 py-8 px-4 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} TaskFlow Technologies. All rights reserved.</p>
          <div className="flex flex-wrap gap-4 text-slate-400">
            <Link to="/terms" className="hover:text-slate-200 transition-colors">Terms of Service</Link>
            <span>•</span>
            <Link to="/privacy" className="hover:text-slate-200 transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link to="/refund-policy" className="hover:text-slate-200 transition-colors">Refund & Cancellation</Link>
            <span>•</span>
            <Link to="/contact" className="hover:text-slate-200 transition-colors">Contact Us</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
