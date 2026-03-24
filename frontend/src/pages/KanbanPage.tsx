import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { tasksApi, projectsApi, usersApi } from '../services/api';
import { Task, TaskStatus, User, Project, WsEvent } from '../types';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { setTasks, updateTask, addTask, removeTask } from '../store/slices/tasksSlice';
import { wsService } from '../services/websocket';
import TaskModal from '../components/tasks/TaskModal';
import { LoadingScreen } from '../components/common/Spinner';
import toast from 'react-hot-toast';

const COLUMNS: { key: TaskStatus; label: string; icon: string; color: string; bgColor: string }[] = [
  { key: 'TODO', label: 'To Do', icon: '📋', color: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-700/50' },
  { key: 'IN_PROGRESS', label: 'In Progress', icon: '🔄', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
  { key: 'DONE', label: 'Done', icon: '✅', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-900/20' },
];

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  CRITICAL: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

function TaskCard({ task, index, onEdit, onDelete }: { task: Task; index: number; onEdit: () => void; onDelete: () => void }) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

  return (
    <Draggable draggableId={String(task.id)} index={index} isDragDisabled={task.blocked}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white dark:bg-gray-800 rounded-xl border transition-all group
            ${snapshot.isDragging ? 'shadow-xl ring-2 ring-blue-500 rotate-1' : 'shadow-sm hover:shadow-md'}
            ${task.blocked ? 'border-red-300 dark:border-red-700 opacity-80' : 'border-gray-200 dark:border-gray-700'}
          `}>
          <div className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold leading-tight flex-1">{task.title}</p>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button onClick={onEdit} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500 transition-colors" title="Edit">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button onClick={onDelete} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-colors" title="Delete">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>

            {task.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{task.description}</p>
            )}

            <div className="flex items-center justify-between gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority]}`}>
                {task.priority}
              </span>
              {task.assignedUser && (
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-xs font-semibold text-purple-600 dark:text-purple-400">
                    {task.assignedUser.name.charAt(0)}
                  </div>
                  <span className="text-xs text-gray-500 max-w-[80px] truncate">{task.assignedUser.name}</span>
                </div>
              )}
            </div>

            {(task.dueDate || task.blocked || task.dependencies.length > 0) && (
              <div className="flex flex-wrap gap-1.5 pt-1 border-t border-gray-100 dark:border-gray-700">
                {task.dueDate && (
                  <span className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
                    📅 {new Date(task.dueDate).toLocaleDateString()}
                    {isOverdue && ' ⚠️'}
                  </span>
                )}
                {task.blocked && (
                  <span className="text-xs bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                    ⛔ Blocked
                  </span>
                )}
                {task.dependencies.length > 0 && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    🔗 {task.dependencies.length}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}

export default function KanbanPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const dispatch = useAppDispatch();
  const tasks = useAppSelector(s => s.tasks.byProject[projectId] || []);
  const token = useAppSelector(s => s.auth.token);

  const [project, setProject] = useState<Project | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [wsConnected, setWsConnected] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [projectRes, tasksRes, usersRes] = await Promise.all([
        projectsApi.getById(projectId),
        tasksApi.getByProject(projectId),
        usersApi.getAll(),
      ]);
      setProject(projectRes.data);
      dispatch(setTasks({ projectId, tasks: tasksRes.data }));
      setUsers(usersRes.data);
    } catch (err) {
      toast.error('Failed to load project data');
    } finally {
      setLoading(false);
    }
  }, [projectId, dispatch]);

  useEffect(() => {
    loadData();
    // Connect WebSocket
    if (token) {
      wsService.connect(token).then(() => {
        setWsConnected(true);
        wsService.subscribeToProject(projectId, (event: WsEvent) => {
          const t = event.payload as Task;
          switch (event.type) {
            case 'TASK_CREATED':
              dispatch(addTask(t));
              if (event.actorName) toast(`${event.actorName} created "${t.title}"`, { icon: '✨' });
              break;
            case 'TASK_UPDATED':
            case 'TASK_STATUS_CHANGED':
              dispatch(updateTask(t));
              break;
            case 'TASK_DELETED':
              dispatch(removeTask({ id: (event.payload as any).id, projectId }));
              break;
          }
        });
      }).catch(() => console.log('WebSocket unavailable'));
    }
    return () => {
      wsService.unsubscribeFromProject(projectId);
    };
  }, [projectId, token]);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const taskId = Number(draggableId);
    const newStatus = destination.droppableId as TaskStatus;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Optimistic update
    dispatch(updateTask({ ...task, status: newStatus, position: destination.index }));

    try {
      await tasksApi.updateStatus(taskId, newStatus, destination.index);
    } catch (err: any) {
      // Revert on error
      dispatch(updateTask(task));
      toast.error(err.response?.data?.message || 'Cannot move task — check dependencies');
    }
  };

  const handleTaskSaved = (t: Task) => {
    if (tasks.find(x => x.id === t.id)) dispatch(updateTask(t));
    else dispatch(addTask(t));
  };

  const handleDeleteTask = async (task: Task) => {
    if (!confirm(`Delete "${task.title}"?`)) return;
    try {
      await tasksApi.delete(task.id);
      dispatch(removeTask({ id: task.id, projectId }));
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const filteredTasks = searchQuery
    ? tasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    : tasks;

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link to={`/projects/${projectId}`} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            ← Back
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{project?.name}</h1>
              {wsConnected && (
                <span className="flex items-center gap-1 text-xs text-green-500">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  Live
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">Kanban Board · {tasks.length} tasks</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input
            className="input w-56 text-sm"
            placeholder="🔍 Search tasks..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <button onClick={() => { setEditingTask(null); setModalOpen(true); }} className="btn-primary shrink-0">
            + Add Task
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
          {COLUMNS.map(col => {
            const colTasks = filteredTasks.filter(t => t.status === col.key)
              .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
            return (
              <div key={col.key} className="flex flex-col w-72 shrink-0">
                <div className={`flex items-center justify-between px-4 py-3 rounded-xl mb-3 ${col.bgColor}`}>
                  <div className="flex items-center gap-2">
                    <span>{col.icon}</span>
                    <span className={`font-semibold text-sm ${col.color}`}>{col.label}</span>
                  </div>
                  <span className="text-xs font-bold bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full shadow-sm">
                    {colTasks.length}
                  </span>
                </div>

                <Droppable droppableId={col.key}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 space-y-3 min-h-[200px] rounded-xl p-2 transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50 dark:bg-blue-900/10 ring-2 ring-blue-200 dark:ring-blue-800' : ''}`}>
                      {colTasks.map((task, idx) => (
                        <TaskCard key={task.id} task={task} index={idx}
                          onEdit={() => { setEditingTask(task); setModalOpen(true); }}
                          onDelete={() => handleDeleteTask(task)} />
                      ))}
                      {provided.placeholder}
                      {colTasks.length === 0 && !snapshot.isDraggingOver && (
                        <div className="text-center py-8 text-gray-300 dark:text-gray-600 text-sm">
                          Drop tasks here
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

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
