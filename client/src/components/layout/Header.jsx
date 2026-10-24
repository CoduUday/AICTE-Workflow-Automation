import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  User,
  LogOut,
  Shield,
  Building2,
  FileCheck,
  CalendarCheck,
  Award,
  ChevronDown,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MOCK_ROLES, MOCK_USERS } from '../../services/mockData';
import { alertsAPI } from '../../services/api';

export default function Header({ onToggleSidebar }) {
  const { user, loginAsRole, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    alertsAPI.getAll().then((items) => {
      setUnreadAlertsCount(items.filter((a) => !a.read).length);
    });
  }, []);

  const handleRoleSwitch = (role) => {
    loginAsRole(role);
    setRoleMenuOpen(false);
  };

  const getRoleMeta = (role) => {
    switch (role) {
      case MOCK_ROLES.ADMIN:
        return { label: 'Administrator', icon: Shield, color: 'text-blue-600' };
      case MOCK_ROLES.SCRUTINY_OFFICER:
        return { label: 'Scrutiny Officer', icon: FileCheck, color: 'text-indigo-600' };
      case MOCK_ROLES.EVC_COORDINATOR:
        return { label: 'EVC Coordinator', icon: CalendarCheck, color: 'text-purple-600' };
      case MOCK_ROLES.COMMITTEE_OFFICER:
        return { label: 'Committee Officer (SAC)', icon: Award, color: 'text-amber-600' };
      case MOCK_ROLES.INSTITUTION:
      default:
        return { label: 'Institution', icon: Building2, color: 'text-emerald-600' };
    }
  };

  const roleMeta = getRoleMeta(user?.role);
  const RoleIcon = roleMeta.icon;

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 shadow-xs">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            aria-label="Toggle navigation menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0A2540] text-amber-400 flex items-center justify-center font-bold text-sm shadow-xs">
              AI
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm sm:text-base leading-tight tracking-tight">
                  AICTE Approval & Compliance System
                </span>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  SIH 2026
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden md:block">
                All India Council for Technical Education • Ministry of Education
              </p>
            </div>
          </div>
        </div>

        {/* Right side controls: Role Switcher & Notifications & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Role Switcher Pill (Evaluator / Demo helper) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors shadow-2xs"
            >
              <RoleIcon className={`w-3.5 h-3.5 ${roleMeta.color} shrink-0`} />
              <span className="hidden sm:inline text-slate-500 font-normal">Role:</span>
              <span className="font-semibold text-slate-900">{roleMeta.label}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {roleMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-fade-in">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Switch Active Role (Demo)
                </div>
                {Object.values(MOCK_ROLES).map((r) => {
                  const target = MOCK_USERS.find((u) => u.role === r);
                  const meta = getRoleMeta(r);
                  const ItemIcon = meta.icon;
                  const isSelected = user?.role === r;

                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRoleSwitch(r)}
                      className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs hover:bg-slate-50 transition-colors ${
                        isSelected ? 'bg-blue-50/60 font-semibold text-blue-900' : 'text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <ItemIcon className={`w-4 h-4 ${meta.color} shrink-0`} />
                        <div className="truncate">
                          <div className="font-medium text-slate-900">{meta.label}</div>
                          <div className="text-[11px] text-slate-400 truncate">{target?.name}</div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Alerts Notification Bell */}
          <Link
            to="/alerts"
            className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Deadlines & Alerts"
          >
            <Bell className="w-5 h-5" />
            {unreadAlertsCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs">
                {unreadAlertsCount}
              </span>
            )}
          </Link>

          {/* User profile dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1 pl-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[#0A2540] text-white flex items-center justify-center font-medium text-xs ring-2 ring-blue-100">
                {user?.name
                  ? user.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                  : 'U'}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-fade-in">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-900 truncate">{user?.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                  <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                    {user?.designation || roleMeta.label}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                    navigate('/login');
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
