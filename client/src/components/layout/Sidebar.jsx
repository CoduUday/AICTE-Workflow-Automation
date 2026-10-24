import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  ShieldCheck,
  CalendarCheck,
  BellRing,
  Settings,
  HelpCircle,
  Database,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isBackendConnected } from '../../services/api';

export default function Sidebar({ isOpen, onClose }) {
  const { isAdmin, user } = useAuth();

  const navigation = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard },
    { name: 'Applications', to: '/applications', icon: FileText },
    { name: 'Compliance Register', to: '/compliance', icon: ShieldCheck },
    { name: 'EVC Scheduling', to: '/evc', icon: CalendarCheck },
    { name: 'Alerts & Reminders', to: '/alerts', icon: BellRing }
  ];

  if (isAdmin) {
    navigation.push({
      name: 'Admin & Workflows',
      to: '/admin',
      icon: Settings,
      badge: 'Admin'
    });
  }

  const navContent = (
    <div className="flex flex-col h-full bg-[#0A2540] text-slate-300">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-6 h-16 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-amber-400 font-bold text-sm">
            🏛️
          </div>
          <div>
            <div className="text-white font-bold text-sm tracking-tight">AICTE PORTAL</div>
            <div className="text-[10px] text-slate-400 font-mono tracking-wider">WORKFLOW v1.0</div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          Main Navigation
        </div>
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.to}
              onClick={onClose}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/50'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-semibold border border-amber-400/30">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Backend & Environment Status Card */}
      <div className="p-4 border-t border-white/10 m-3 rounded-xl bg-white/5 text-xs">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isBackendConnected ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isBackendConnected ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </span>
          <span className="font-semibold text-white">
            {isBackendConnected ? 'Live Backend Connected' : 'Mock Mode Active'}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          {isBackendConnected
            ? 'Synced with server at :5000'
            : 'Standalone demo engine running with instant persistence.'}
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0 border-r border-slate-200">
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#0A2540] shadow-2xl z-10">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
