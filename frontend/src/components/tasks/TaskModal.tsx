import { useEffect, useState } from 'react';
import { Task, User, TaskStatus, TaskPriority } from '../../types';
import Modal from '../common/Modal';
import { tasksApi } from '../../services/api';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  task?: Task | null;
  users: User[];
  allTasks: Task[];
  onSaved: (task: Task) => void;
}

const PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const PRIORITY_COLORS: Record<TaskPriority, string> = {
  LOW: 'text-gray-500', MEDIUM: 'text-yellow-500', HIGH: 'text-orange-500', CRITICAL: 'text-red-500',
};

export default function TaskModal({ isOpen, onClose, projectId, task, users, allTasks, onSaved }: Props) {
  const [form, setForm] = useState({
    title: '', description: '', status: 'TODO' as TaskStatus,
    priority: 'MEDIUM' as TaskPriority, assignedUserId: '' as string | number,
    dueDate: '', projectId,
  });
  const [saving, setSaving] = useState(false);
  const [depTaskId, setDepTaskId] = useState('');
  const [addingDep, setAddingDep] = useState(false);

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title, description: task.description || '',
        status: task.status, priority: task.priority,
        assignedUserId: task.assignedUser?.id || '',
        dueDate: task.dueDate || '', projectId,
      });
    } else {
      setForm({ title: '', description: '', status: 'TODO', priority: 'MEDIUM', assignedUserId: '', dueDate: '', projectId });
    }
  }, [task, projectId, isOpen]);

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Task title is required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        assignedUserId: form.assignedUserId ? Number(form.assignedUserId) : undefined,
        dueDate: form.dueDate || undefined,
      };
      const { data } = task ? await tasksApi.update(task.id, payload) : await tasksApi.create(payload);
      onSaved(data);
      onClose();
      toast.success(task ? 'Task updated' : 'Task created');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const handleAddDep = async () => {
    if (!task || !depTaskId) return;
    setAddingDep(true);
    try {
      await tasksApi.addDependency(task.id, Number(depTaskId));
      const { data } = await tasksApi.getById(task.id);
      onSaved(data);
      setDepTaskId('');
      toast.success('Dependency added');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add dependency');
    } finally {
      setAddingDep(false);
    }
  };

  const handleRemoveDep = async (depOnId: number) => {
    if (!task) return;
    try {
      await tasksApi.removeDependency(task.id, depOnId);
      const { data } = await tasksApi.getById(task.id);
      onSaved(data);
      toast.success('Dependency removed');
    } catch (err: any) {
      toast.error('Failed to remove dependency');
    }
  };

  const availableForDep = allTasks.filter(t => t.id !== task?.id && !task?.dependencies.some(d => d.dependsOnTaskId === t.id));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={task ? 'Edit Task' : 'New Task'} size="lg">
      <div className="space-y-4">
        <div>
          <label className="label">Title *</label>
          <input className="input" placeholder="Task title" value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })} />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea className="input resize-none" rows={3} placeholder="Task description..."
            value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as TaskStatus })}>
              <option value="TODO">📋 To Do</option>
              <option value="IN_PROGRESS">🔄 In Progress</option>
              <option value="DONE">✅ Done</option>
            </select>
          </div>
          <div>
            <label className="label">Priority</label>
            <select className="input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as TaskPriority })}>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Assigned To</label>
            <select className="input" value={String(form.assignedUserId)} onChange={e => setForm({ ...form, assignedUserId: e.target.value })}>
              <option value="">Unassigned</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Due Date</label>
            <input type="date" className="input" value={form.dueDate}
              onChange={e => setForm({ ...form, dueDate: e.target.value })} />
          </div>
        </div>

        {/* Dependencies section - only for existing tasks */}
        {task && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              🔗 Task Dependencies
              {task.blocked && (
                <span className="badge bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                  ⛔ Blocked
                </span>
              )}
            </h3>

            {task.dependencies.length > 0 ? (
              <div className="space-y-2">
                {task.dependencies.map(dep => (
                  <div key={dep.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span>{dep.dependsOnTaskStatus === 'DONE' ? '✅' : '⏳'}</span>
                      <span className="font-medium">{dep.dependsOnTaskTitle}</span>
                      <span className={`text-xs ${dep.dependsOnTaskStatus === 'DONE' ? 'text-green-500' : 'text-yellow-500'}`}>
                        {dep.dependsOnTaskStatus}
                      </span>
                    </div>
                    <button onClick={() => handleRemoveDep(dep.dependsOnTaskId)}
                      className="text-red-400 hover:text-red-600 text-xs px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No dependencies</p>
            )}

            {availableForDep.length > 0 && (
              <div className="flex gap-2">
                <select className="input text-sm flex-1" value={depTaskId} onChange={e => setDepTaskId(e.target.value)}>
                  <option value="">Select a task to depend on…</option>
                  {availableForDep.map(t => (
                    <option key={t.id} value={t.id}>{t.title} ({t.status})</option>
                  ))}
                </select>
                <button onClick={handleAddDep} disabled={!depTaskId || addingDep}
                  className="btn-secondary text-sm px-3 shrink-0">
                  {addingDep ? '...' : '+ Add'}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} className="btn-primary flex-1" disabled={saving}>
            {saving ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
