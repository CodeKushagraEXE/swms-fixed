import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Project } from '../../types';

const projectsSlice = createSlice({
  name: 'projects',
  initialState: { list: [] as Project[], current: null as Project | null, loading: false },
  reducers: {
    setProjects: (s, a: PayloadAction<Project[]>) => { s.list = a.payload; },
    setCurrentProject: (s, a: PayloadAction<Project | null>) => { s.current = a.payload; },
    addProject: (s, a: PayloadAction<Project>) => { s.list.unshift(a.payload); },
    updateProject: (s, a: PayloadAction<Project>) => {
      const i = s.list.findIndex(p => p.id === a.payload.id);
      if (i !== -1) s.list[i] = a.payload;
      if (s.current?.id === a.payload.id) s.current = a.payload;
    },
    removeProject: (s, a: PayloadAction<number>) => { s.list = s.list.filter(p => p.id !== a.payload); },
    setLoading: (s, a: PayloadAction<boolean>) => { s.loading = a.payload; },
  },
});
export const { setProjects, setCurrentProject, addProject, updateProject, removeProject, setLoading } = projectsSlice.actions;
export default projectsSlice.reducer;
