import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Button from '../components/common/Button';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-bold text-slate-900 tracking-tight">403 - Unauthorized Access</h1>
      <p className="text-sm text-slate-500 max-w-md mt-2 mb-6">
        Your current role does not have authorization to view or execute actions on this administrative workflow section.
      </p>
      <Link to="/">
        <Button variant="primary" leftIcon={ArrowLeft}>
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
}
