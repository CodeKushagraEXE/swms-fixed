import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Task } from '../../types';

const tasksSlice = createSlice({
  name: 'tasks',
  initialState: { byProject: {} as Record<number, Task[]>, loading: false },
  reducers: {
    setTasks: (s, a: PayloadAction<{ projectId: number; tasks: Task[] }>) => { s.byProject[a.payload.projectId] = a.payload.tasks; },
    addTask: (s, a: PayloadAction<Task>) => { const p = a.payload.projectId; if (!s.byProject[p]) s.byProject[p] = []; s.byProject[p].push(a.payload); },
    updateTask: (s, a: PayloadAction<Task>) => { const p = a.payload.projectId; if (s.byProject[p]) { const i = s.byProject[p].findIndex(t => t.id === a.payload.id); if (i !== -1) s.byProject[p][i] = a.payload; } },
    removeTask: (s, a: PayloadAction<{ id: number; projectId: number }>) => { const { id, projectId } = a.payload; if (s.byProject[projectId]) s.byProject[projectId] = s.byProject[projectId].filter(t => t.id !== id); },
    setLoading: (s, a: PayloadAction<boolean>) => { s.loading = a.payload; },
  },
});
export const { setTasks, addTask, updateTask, removeTask, setLoading } = tasksSlice.actions;
export default tasksSlice.reducer;
