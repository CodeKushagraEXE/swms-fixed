import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectsApi, tasksApi, logsApi, usersApi } from '../services/api';
import { Project, Task, ActivityLog, User } from '../types';
import { LoadingScreen } from '../components/common/Spinner';
import TaskModal from '../components/tasks/TaskModal';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { setTasks, addTask, updateTask, removeTask } from '../store/slices/tasksSlice';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const STATUS_BADGE: Record<string, string> = {
  TODO: 'badge-todo', IN_PROGRESS: 'badge-progress', DONE: 'badge-done',
};

const PRIORITY_BADGE: Record<string, string> = {
  LOW: 'badge-low', MEDIUM: 'badge-medium', HIGH: 'badge-high', CRITICAL: 'badge-critical',
};

const ACTION_ICONS: Record<string, string> = {
  TASK_CREATED: '✨', TASK_UPDATED: '✏️', TASK_DELETED: '🗑️', TASK_STATUS_CHANGED: '🔄',
  TASK_ASSIGNED: '👤', DEPENDENCY_ADDED: '🔗', DEPENDENCY_REMOVED: '🔓',
  PROJECT_CREATED: '🚀', PROJECT_UPDATED: '📝', PROJECT_MEMBER_ADDED: '👥',
  USER_LOGGED_IN: '🔑', USER_REGISTERED: '🎉',
};

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const dispatch = useAppDispatch();
  const tasks = useAppSelector(s => s.tasks.byProject[projectId] || []);

  const [project, setProject] = useState<Project | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState<'tasks' | 'logs'>('tasks');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  useEffect(() => {
    Promise.all([
      projectsApi.getById(projectId).then(r => setProject(r.data)),
      tasksApi.getByProject(projectId).then(r => dispatch(setTasks({ projectId, tasks: r.data }))),
      logsApi.getProjectLogs(projectId).then(r => setLogs(r.data)),
      usersApi.getAll().then(r => setUsers(r.data)),
    ]).finally(() => setLoading(false));
  }, [projectId]);

  const refreshLogs = () => logsApi.getProjectLogs(projectId).then(r => setLogs(r.data));

  const handleTaskSaved = async (t: Task) => {
    if (tasks.find(x => x.id === t.id)) dispatch(updateTask(t));
    else dispatch(addTask(t));
    await refreshLogs();
  };

  const handleDeleteTask = async (task: Task) => {
    if (!confirm(`Delete "${task.title}"?`)) return;
    try {
      await tasksApi.delete(task.id);
      dispatch(removeTask({ id: task.id, projectId }));
      await refreshLogs();
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    return true;
  });

  if (loading) return <LoadingScreen />;
  if (!project) return <div className="text-center text-gray-500 mt-20">Project not found</div>;

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 'DONE').length;
  const pct = totalTasks > 0 ? Math.round(doneTasks / totalTasks * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <Link to="/projects" className="hover:text-blue-500 transition-colors">Projects</Link>
            <span>/</span>
            <span>{project.name}</span>
          </div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          {project.description && <p className="text-gray-500 dark:text-gray-400 mt-1">{project.description}</p>}
        </div>
        <div className="flex gap-3">
          <Link to={`/projects/${projectId}/board`} className="btn-secondary">📋 Kanban Board</Link>
          <button onClick={() => { setEditingTask(null); setModalOpen(true); }} className="btn-primary">+ Add Task</button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-6 items-center">
          <div className="flex-1 min-w-48">
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-gray-500">Progress</span>
              <span className="font-semibold">{doneTasks}/{totalTasks} · {pct}%</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
              <div className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className="flex gap-4 text-sm">
            {[
              { label: 'To Do', count: tasks.filter(t => t.status === 'TODO').length, cls: 'text-gray-500' },
              { label: 'In Progress', count: tasks.filter(t => t.status === 'IN_PROGRESS').length, cls: 'text-blue-500' },
              { label: 'Done', count: doneTasks, cls: 'text-green-500' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className={`text-xl font-bold ${s.cls}`}>{s.count}</p>
                <p className="text-gray-400 text-xs">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Team:</span>
            <div className="flex -space-x-1">
              {[project.owner, ...project.members].slice(0, 5).map((m, i) => (
                <div key={i} title={m.name} className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-300">
                  {m.name.charAt(0)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-1">
          {(['tasks', 'logs'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize
                ${activeTab === tab ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
              {tab === 'tasks' ? `📋 Tasks (${tasks.length})` : `📜 Activity (${logs.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <select className="input w-40 text-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>
            <select className="input w-40 text-sm" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="card p-12 text-center">
              <span className="text-4xl block mb-3">📋</span>
              <p className="text-gray-500">No tasks {filterStatus || filterPriority ? 'match your filters' : 'yet'}</p>
              {!filterStatus && !filterPriority && (
                <button onClick={() => { setEditingTask(null); setModalOpen(true); }} className="btn-primary mt-4">Create First Task</button>
              )}
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    {['Title', 'Status', 'Priority', 'Assigned', 'Due Date', 'Deps', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredTasks.map(task => (
                    <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {task.blocked && <span title="Blocked" className="text-red-400">⛔</span>}
                          <span className="font-medium">{task.title}</span>
                        </div>
                        {task.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{task.description}</p>}
                      </td>
                      <td className="px-4 py-3"><span className={STATUS_BADGE[task.status]}>{task.status.replace('_', ' ')}</span></td>
                      <td className="px-4 py-3"><span className={PRIORITY_BADGE[task.priority]}>{task.priority}</span></td>
                      <td className="px-4 py-3">{task.assignedUser ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-400">{task.assignedUser.name.charAt(0)}</div>
                          <span className="truncate max-w-[80px]">{task.assignedUser.name}</span>
                        </div>
                      ) : <span className="text-gray-400">—</span>}</td>
                      <td className="px-4 py-3">
                        {task.dueDate ? (
                          <span className={`${new Date(task.dueDate) < new Date() && task.status !== 'DONE' ? 'text-red-500' : 'text-gray-500'}`}>
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-400">{task.dependencies.length > 0 ? `🔗 ${task.dependencies.length}` : '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingTask(task); setModalOpen(true); }} className="p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-400 hover:text-blue-500">✏️</button>
                          <button onClick={() => handleDeleteTask(task)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Activity Log Tab */}
      {activeTab === 'logs' && (
        <div className="space-y-3 max-w-2xl">
          {logs.length === 0 ? (
            <div className="card p-12 text-center"><p className="text-gray-400">No activity yet</p></div>
          ) : logs.map(log => (
            <div key={log.id} className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xl shrink-0">
                {ACTION_ICONS[log.action] || '📌'}
              </div>
              <div className="flex-1 card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{log.details || log.action.replace(/_/g, ' ')}</p>
                    {log.oldValue && log.newValue && (
                      <p className="text-xs text-gray-500 mt-1">
                        <span className="line-through text-red-400">{log.oldValue}</span>
                        {' → '}
                        <span className="text-green-500">{log.newValue}</span>
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">
                    {log.createdAt ? formatDistanceToNow(new Date(log.createdAt), { addSuffix: true }) : ''}
                  </span>
                </div>
                {log.user && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs text-blue-600 dark:text-blue-400 font-bold">
                      {log.user.name.charAt(0)}
                    </div>
                    <span className="text-xs text-gray-400">{log.user.name}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <TaskModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingTask(null); }}
        projectId={projectId}
        task={editingTask}
        users={users}
        allTasks={tasks}
        onSaved={handleTaskSaved}
      />
    </div>
  );
}
