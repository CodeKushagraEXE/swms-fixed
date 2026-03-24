import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../services/api';
import { DashboardStats } from '../types';
import { LoadingScreen } from '../components/common/Spinner';
import { useAppSelector } from '../hooks/useAppDispatch';

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <div className={`card p-6 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <span className="text-4xl">{icon}</span>
      </div>
    </div>
  );
}

function ProgressBar({ value, max, color = 'bg-blue-500' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
      <div className={`${color} h-2 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const user = useAppSelector(s => s.auth.user);

  useEffect(() => {
    dashboardApi.getStats().then(r => setStats(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingScreen />;
  if (!stats) return <div className="text-center text-gray-500">Failed to load stats</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back, {user?.name} 👋</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Projects" value={stats.totalProjects} icon="📁" color="border-blue-500" />
        <StatCard label="Total Tasks" value={stats.totalTasks} icon="📋" color="border-purple-500" />
        <StatCard label="In Progress" value={stats.inProgressTasks} icon="🔄" color="border-yellow-500" />
        <StatCard label="Completed" value={stats.doneTasks} icon="✅" color="border-green-500" />
      </div>

      {/* Completion Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span>📊</span> Task Breakdown
          </h2>
          <div className="space-y-4">
            {[
              { label: 'To Do', count: stats.todoTasks, total: stats.totalTasks, color: 'bg-gray-400' },
              { label: 'In Progress', count: stats.inProgressTasks, total: stats.totalTasks, color: 'bg-blue-500' },
              { label: 'Done', count: stats.doneTasks, total: stats.totalTasks, color: 'bg-green-500' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{item.label}</span>
                  <span className="text-gray-500">{item.count} / {item.total}</span>
                </div>
                <ProgressBar value={item.count} max={item.total} color={item.color} />
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span>🏆</span> Project Progress
          </h2>
          {stats.projectStats.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm">No projects yet.</p>
              <Link to="/projects" className="btn-primary mt-3 text-sm inline-flex">Create Project</Link>
            </div>
          ) : (
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {stats.projectStats.map(ps => (
                <div key={ps.projectId}>
                  <div className="flex justify-between items-center text-sm mb-1.5">
                    <Link to={`/projects/${ps.projectId}`} className="font-medium hover:text-blue-600 truncate max-w-[60%]">
                      {ps.projectName}
                    </Link>
                    <span className="text-gray-500 shrink-0">
                      {ps.completed}/{ps.total} · {Math.round(ps.completionPercent)}%
                    </span>
                  </div>
                  <ProgressBar value={ps.completed} max={ps.total}
                    color={ps.completionPercent === 100 ? 'bg-green-500' : 'bg-blue-500'} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/projects" className="btn-primary">📁 View Projects</Link>
          <Link to="/projects" className="btn-secondary">➕ New Project</Link>
        </div>
      </div>
    </div>
  );
}
