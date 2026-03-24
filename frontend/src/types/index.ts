export type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface AuthResponse {
  token: string;
  type: string;
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  status: ProjectStatus;
  owner: User;
  members: User[];
  totalTasks: number;
  completedTasks: number;
  createdAt: string;
}

export interface Dependency {
  id: number;
  taskId: number;
  taskTitle: string;
  dependsOnTaskId: number;
  dependsOnTaskTitle: string;
  dependsOnTaskStatus: TaskStatus;
  type: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  position: number;
  projectId: number;
  projectName: string;
  assignedUser: User | null;
  createdBy: User | null;
  dependencies: Dependency[];
  createdAt: string;
  updatedAt: string;
  blocked: boolean;
}

export interface ActivityLog {
  id: number;
  action: string;
  entityType: string;
  entityId: number;
  details: string;
  oldValue: string | null;
  newValue: string | null;
  user: User | null;
  createdAt: string;
}

export interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  doneTasks: number;
  projectStats: ProjectStat[];
}

export interface ProjectStat {
  projectId: number;
  projectName: string;
  total: number;
  completed: number;
  inProgress: number;
  completionPercent: number;
}

export interface WsEvent {
  type: string;
  payload: unknown;
  projectId: number;
  actorName: string;
  timestamp: string;
}
