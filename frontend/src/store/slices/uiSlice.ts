import { createSlice } from '@reduxjs/toolkit';
const uiSlice = createSlice({
  name: 'ui',
  initialState: { darkMode: localStorage.getItem('darkMode') === 'true', sidebarOpen: true },
  reducers: {
    toggleDarkMode: (s) => { s.darkMode = !s.darkMode; localStorage.setItem('darkMode', String(s.darkMode)); },
    toggleSidebar: (s) => { s.sidebarOpen = !s.sidebarOpen; },
  },
});
export const { toggleDarkMode, toggleSidebar } = uiSlice.actions;
export default uiSlice.reducer;
