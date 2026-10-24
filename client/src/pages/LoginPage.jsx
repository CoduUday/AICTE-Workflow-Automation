import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, FileCheck, Building2, ArrowRight, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MOCK_ROLES, MOCK_USERS } from '../services/mockData';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

export default function LoginPage() {
  const { loginAsRole, loginWithCredentials, loading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin.rajesh@aicte-india.org');
  const [password, setPassword] = useState('demo1234');

  const handleCustomLogin = async (e) => {
    e.preventDefault();
    try {
      await loginWithCredentials(email, password);
      showToast('Successfully logged in!', 'success');
      navigate('/');
    } catch {
      showToast('Authentication failed. Please verify credentials.', 'error');
    }
  };

  const handleQuickRole = async (role) => {
    await loginAsRole(role);
    showToast(`Signed in as ${role === 'ADMIN' ? 'Administrator' : role.toLowerCase()}`, 'success');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50/40 to-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-[#0A2540] text-amber-400 items-center justify-center font-bold text-2xl shadow-lg ring-4 ring-blue-100 mb-4">
          🏛️
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          AICTE Workflow Portal
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-sm mx-auto">
          Integrated Approval Workflow Automation, Compliance Monitoring & Alert Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl border border-slate-200/80 rounded-2xl">
          {/* Quick Demo Role Selection (Evaluator friendly) */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Instant Demo Access
              </span>
              <span className="text-[11px] text-blue-600 font-medium">One-click sign-in</span>
            </div>
            <div className="grid grid-cols-1 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickRole(MOCK_ROLES.ADMIN)}
                className="flex items-center justify-between p-3 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/70 text-left transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-blue-950">AICTE Administrator</div>
                    <div className="text-[11px] text-blue-700">Full workflow & committee rights</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-500 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickRole(MOCK_ROLES.REVIEWER)}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900">Scrutiny / Reviewer Official</div>
                    <div className="text-[11px] text-slate-500">Deficiency notes & EVC tasks</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickRole(MOCK_ROLES.INSTITUTION)}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900">Institution Principal</div>
                    <div className="text-[11px] text-slate-500">Upload compliance & view tracking</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-medium">Or enter credentials</span>
            </div>
          </div>

          {/* Regular Login Form */}
          <form onSubmit={handleCustomLogin} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={Mail}
              placeholder="e.g. official@aicte-india.org"
            />
            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={Lock}
              placeholder="••••••••"
            />

            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
              className="w-full mt-2"
            >
              Sign In to Workflow
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Complies with National Informatics Centre (NIC) and AICTE Approval Process Handbook (APH) guidelines.
        </p>
      </div>
    </div>
  );
}
