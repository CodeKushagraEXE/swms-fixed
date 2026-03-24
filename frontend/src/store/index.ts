import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import projectsReducer from './slices/projectsSlice';
import tasksReducer from './slices/tasksSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: { auth: authReducer, projects: projectsReducer, tasks: tasksReducer, ui: uiReducer },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
