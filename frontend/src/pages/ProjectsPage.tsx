import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectsApi, usersApi } from '../services/api';
import { Project, User } from '../types';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { setProjects, addProject, updateProject, removeProject } from '../store/slices/projectsSlice';
import Modal from '../components/common/Modal';
import { LoadingScreen } from '../components/common/Spinner';
import toast from 'react-hot-toast';

interface ProjectForm { name: string; description: string; memberIds: number[]; }

function ProjectCard({ project, onEdit, onDelete }: { project: Project; onEdit: () => void; onDelete: () => void }) {
  const pct = project.totalTasks > 0 ? Math.round((project.completedTasks / project.totalTasks) * 100) : 0;
  return (
    <div className="card p-5 hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <Link to={`/projects/${project.id}`} className="text-lg font-bold hover:text-blue-600 transition-colors block truncate">
            {project.name}
          </Link>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{project.description || 'No description'}</p>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
          <button onClick={onEdit} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-600" title="Edit">✏️</button>
          <button onClick={onDelete} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-600" title="Delete">🗑️</button>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>{project.completedTasks}/{project.totalTasks} tasks · {pct}%</span>
          </div>
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            <div className="flex -space-x-1">
              {[project.owner, ...project.members].slice(0, 4).map((m, i) => (
                <div key={i} className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-semibold text-blue-600 dark:text-blue-300">
                  {m.name.charAt(0)}
                </div>
              ))}
            </div>
            <span className="text-xs text-gray-400">{project.members.length + 1} member{project.members.length !== 0 ? 's' : ''}</span>
          </div>
          <div className="flex gap-2">
            <Link to={`/projects/${project.id}/board`} className="text-xs btn-secondary py-1 px-2">📋 Board</Link>
            <Link to={`/projects/${project.id}`} className="text-xs btn-primary py-1 px-2">View →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const dispatch = useAppDispatch();
  const projects = useAppSelector(s => s.projects.list);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState<ProjectForm>({ name: '', description: '', memberIds: [] });
  const [users, setUsers] = useState<User[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      projectsApi.getAll().then(r => dispatch(setProjects(r.data))),
      usersApi.getAll().then(r => setUsers(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '', memberIds: [] }); setShowModal(true); };
  const openEdit = (p: Project) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description || '', memberIds: p.members.map(m => m.id) });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Project name is required'); return; }
    setSaving(true);
    try {
      if (editing) {
        const { data } = await projectsApi.update(editing.id, form);
        dispatch(updateProject(data));
        toast.success('Project updated');
      } else {
        const { data } = await projectsApi.create(form);
        dispatch(addProject(data));
        toast.success('Project created');
      }
      setShowModal(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: Project) => {
    if (!confirm(`Delete project "${p.name}"? This will delete all tasks.`)) return;
    try {
      await projectsApi.delete(p.id);
      dispatch(removeProject(p.id));
      toast.success('Project deleted');
    } catch {
      toast.error('Failed to delete project');
    }
  };

  const toggleMember = (uid: number) => {
    setForm(f => ({
      ...f,
      memberIds: f.memberIds.includes(uid) ? f.memberIds.filter(id => id !== uid) : [...f.memberIds, uid],
    }));
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate} className="btn-primary">+ New Project</button>
      </div>

      {projects.length === 0 ? (
        <div className="card p-16 text-center">
          <span className="text-5xl block mb-4">📁</span>
          <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
          <p className="text-gray-500 mb-6">Create your first project to get started</p>
          <button onClick={openCreate} className="btn-primary">Create Project</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map(p => (
            <ProjectCard key={p.id} project={p} onEdit={() => openEdit(p)} onDelete={() => handleDelete(p)} />
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Project' : 'New Project'}>
        <div className="space-y-4">
          <div>
            <label className="label">Project Name *</label>
            <input className="input" placeholder="My Awesome Project" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={3} placeholder="What is this project about?"
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="label">Team Members</label>
            <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg divide-y divide-gray-100 dark:divide-gray-700">
              {users.map(u => (
                <label key={u.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                  <input type="checkbox" className="rounded" checked={form.memberIds.includes(u.id)} onChange={() => toggleMember(u.id)} />
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600 dark:text-blue-300">
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.role}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleSave} className="btn-primary flex-1" disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
