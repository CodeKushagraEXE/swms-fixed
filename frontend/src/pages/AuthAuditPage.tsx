import { useEffect, useState } from 'react';
import { logsApi } from '../services/api';
import { ActivityLog } from '../types';
import { LoadingScreen } from '../components/common/Spinner';
import { useAppSelector } from '../hooks/useAppDispatch';

const labels: Record<string, string> = {
  USER_REGISTERED: 'Signed up',
  USER_LOGGED_IN: 'Logged in',
};

export default function AuthAuditPage() {
  const user = useAppSelector(s => s.auth.user);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    logsApi.getAuthLogs()
      .then(r => setLogs(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingScreen />;

  if (user?.role !== 'ADMIN') {
    return <div className="text-center text-gray-500">Only admins can view auth audit logs.</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Auth Audit</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Recent signup and login events across all users.
        </p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">When</th>
                <th className="text-left px-4 py-3 font-semibold">Event</th>
                <th className="text-left px-4 py-3 font-semibold">User</th>
                <th className="text-left px-4 py-3 font-semibold">Email</th>
                <th className="text-left px-4 py-3 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                    No signup/login events found yet.
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {labels[log.action] || log.action}
                    </td>
                    <td className="px-4 py-3">{log.user?.name || '-'}</td>
                    <td className="px-4 py-3">{log.user?.email || '-'}</td>
                    <td className="px-4 py-3">{log.details || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
