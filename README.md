# 🚀 Smart Workflow Management System (SWMS)

A production-ready, full-stack project and task management application with real-time collaboration, kanban boards, task dependency handling, and activity logs.

---

## 📁 Project Structure

```
swms/
├── backend/                    # Spring Boot application
│   ├── src/main/java/com/swms/
│   │   ├── controller/         # REST API Controllers
│   │   │   ├── AuthController.java
│   │   │   ├── ProjectController.java
│   │   │   ├── TaskController.java
│   │   │   ├── DashboardController.java
│   │   │   ├── ActivityLogController.java
│   │   │   └── UserController.java
│   │   ├── service/            # Business logic
│   │   │   ├── AuthService.java
│   │   │   ├── ProjectService.java
│   │   │   ├── TaskService.java
│   │   │   ├── DashboardService.java
│   │   │   ├── ActivityLogService.java
│   │   │   └── UserService.java
│   │   ├── repository/         # JPA Repositories
│   │   ├── model/              # JPA Entities (User, Project, Task, etc.)
│   │   ├── dto/                # Data Transfer Objects
│   │   ├── security/           # JWT + Spring Security
│   │   ├── config/             # Security, WebSocket, Swagger configs
│   │   ├── websocket/          # STOMP WebSocket service
│   │   └── exception/          # Global exception handling
│   ├── src/main/resources/
│   │   └── application.properties
│   └── pom.xml
│
└── frontend/                   # React + TypeScript + Vite
    ├── src/
    │   ├── pages/              # Route-level pages
    │   │   ├── LoginPage.tsx
    │   │   ├── RegisterPage.tsx
    │   │   ├── DashboardPage.tsx
    │   │   ├── ProjectsPage.tsx
    │   │   ├── ProjectDetailPage.tsx
    │   │   └── KanbanPage.tsx
    │   ├── components/
    │   │   ├── common/         # Layout, Header, Sidebar, Modal, Spinner
    │   │   └── tasks/          # TaskModal with dependency editor
    │   ├── store/              # Redux Toolkit
    │   │   └── slices/         # authSlice, projectsSlice, tasksSlice, uiSlice
    │   ├── services/           # API client (Axios) + WebSocket (STOMP)
    │   ├── types/              # TypeScript interfaces
    │   └── hooks/              # useAppDispatch, useAppSelector
    ├── package.json
    ├── vite.config.ts
    └── tailwind.config.js
```

---

## 🔧 Tech Stack

| Layer        | Technology                                    |
|-------------|-----------------------------------------------|
| Frontend     | React 18, TypeScript, Vite, Tailwind CSS      |
| State Mgmt   | Redux Toolkit                                 |
| Drag & Drop  | react-beautiful-dnd                           |
| Real-time    | STOMP over SockJS (WebSocket)                 |
| Backend      | Spring Boot 3.2, Java 17                      |
| Security     | Spring Security + JWT (jjwt)                  |
| Database     | MySQL (JPA/Hibernate)                         |
| API Docs     | Springdoc OpenAPI (Swagger UI)                |

---

## 🗄️ Database Schema

```sql
-- Users
CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('ADMIN','MANAGER','EMPLOYEE') NOT NULL DEFAULT 'EMPLOYEE',
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME
);

-- Projects
CREATE TABLE projects (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('ACTIVE','COMPLETED','ARCHIVED') DEFAULT 'ACTIVE',
  owner_id BIGINT REFERENCES users(id),
  created_at DATETIME,
  updated_at DATETIME
);

-- Project members (many-to-many)
CREATE TABLE project_members (
  project_id BIGINT REFERENCES projects(id),
  user_id BIGINT REFERENCES users(id)
);

-- Tasks
CREATE TABLE tasks (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('TODO','IN_PROGRESS','DONE') DEFAULT 'TODO',
  priority ENUM('LOW','MEDIUM','HIGH','CRITICAL') DEFAULT 'MEDIUM',
  due_date DATE,
  position INT DEFAULT 0,
  project_id BIGINT REFERENCES projects(id),
  assigned_user_id BIGINT REFERENCES users(id),
  created_by_id BIGINT REFERENCES users(id),
  created_at DATETIME,
  updated_at DATETIME
);

-- Task Dependencies
CREATE TABLE task_dependencies (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  task_id BIGINT REFERENCES tasks(id),
  depends_on_task_id BIGINT REFERENCES tasks(id),
  type ENUM('FINISH_TO_START','FINISH_TO_FINISH','START_TO_START','START_TO_FINISH'),
  created_at DATETIME,
  UNIQUE(task_id, depends_on_task_id)
);

-- Activity Logs
CREATE TABLE activity_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id BIGINT,
  details TEXT,
  old_value VARCHAR(500),
  new_value VARCHAR(500),
  user_id BIGINT REFERENCES users(id),
  project_id BIGINT REFERENCES projects(id),
  created_at DATETIME
);
```

---

## ⚡ REST API Endpoints

### Authentication
| Method | Endpoint              | Description          | Auth |
|--------|-----------------------|----------------------|------|
| POST   | `/api/auth/register`  | Register new user    | No   |
| POST   | `/api/auth/login`     | Login, get JWT token | No   |
| GET    | `/api/auth/me`        | Get current user     | Yes  |

### Projects
| Method | Endpoint                        | Description          |
|--------|---------------------------------|----------------------|
| GET    | `/api/projects`                 | List all projects    |
| POST   | `/api/projects`                 | Create project       |
| GET    | `/api/projects/{id}`            | Get project          |
| PUT    | `/api/projects/{id}`            | Update project       |
| DELETE | `/api/projects/{id}`            | Delete project       |
| POST   | `/api/projects/{id}/members/{uid}` | Add member       |

### Tasks
| Method | Endpoint                             | Description                  |
|--------|--------------------------------------|------------------------------|
| GET    | `/api/tasks/project/{id}`            | List project tasks           |
| POST   | `/api/tasks`                         | Create task                  |
| GET    | `/api/tasks/{id}`                    | Get task                     |
| PUT    | `/api/tasks/{id}`                    | Update task                  |
| PATCH  | `/api/tasks/{id}/status`             | Update status (drag & drop)  |
| DELETE | `/api/tasks/{id}`                    | Delete task                  |
| POST   | `/api/tasks/dependency`              | Add dependency               |
| DELETE | `/api/tasks/{id}/dependency/{depId}` | Remove dependency            |

### Dashboard & Logs
| Method | Endpoint                     | Description              |
|--------|------------------------------|--------------------------|
| GET    | `/api/dashboard/stats`       | Get dashboard statistics |
| GET    | `/api/logs/project/{id}`     | Get project activity log |
| GET    | `/api/users`                 | List all users           |

---

## 🎯 Key Features

### ✅ Authentication & RBAC
- JWT-based stateless authentication
- BCrypt password hashing
- Three roles: Admin, Manager, Employee
- Protected routes on frontend and backend

### ✅ Task Dependency System
- Link tasks in a dependency chain
- **Automatic blocking**: tasks cannot move to `IN_PROGRESS` or `DONE` if a dependency is not `DONE`
- **Circular dependency detection** (BFS algorithm)
- Visual indicators on blocked tasks in Kanban
- Dependency management UI in task modal

### ✅ Real-time Collaboration
- WebSocket via STOMP + SockJS
- Live updates when any user creates, updates, or moves a task
- Connected indicator on Kanban board
- Toast notifications with actor name

### ✅ Kanban Board
- Drag-and-drop with react-beautiful-dnd
- Three columns: To Do, In Progress, Done
- Visual feedback for blocked tasks
- Optimistic updates with rollback on failure

### ✅ Activity Log
- Full timeline of all project events
- Tracks: task creation, updates, status changes, assignments, dependency changes
- Displayed in project detail page

---

## 🚀 Running Locally

### Prerequisites
- Java 17+
- Node.js 18+
- MySQL 8.0+
- Maven 3.9+

### 1. Database Setup
```bash
mysql -u root -p
CREATE DATABASE swms_db;
```

### 2. Backend Setup
```bash
cd swms/backend

# Edit database credentials
nano src/main/resources/application.properties
# Set: spring.datasource.username=root
# Set: spring.datasource.password=your_password

# Run
./mvnw spring-boot:run
# OR: mvn spring-boot:run
```
Backend starts on: `http://localhost:8080`
Swagger UI: `http://localhost:8080/swagger-ui.html`

### 3. Frontend Setup
```bash
cd swms/frontend

npm install
npm run dev
```
Frontend starts on: `http://localhost:3000`

---

## 🐳 Docker Compose (Optional)

```yaml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: swms_password
      MYSQL_DATABASE: swms_db
    ports:
      - "3306:3306"

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/swms_db
      SPRING_DATASOURCE_USERNAME: root
      SPRING_DATASOURCE_PASSWORD: swms_password
    depends_on:
      - mysql

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
```

---

## 🔐 Security Notes

- Passwords are hashed with BCrypt (strength 10)
- JWT tokens expire after 24 hours (configurable via `jwt.expiration`)
- CORS is restricted to configured origins
- Spring Security protects all `/api/**` endpoints
- Admin-only endpoints under `/api/admin/**`
- Role-based access enforced in service layer with `AccessDeniedException`

---

## 📧 WebSocket Events

The frontend subscribes to `/topic/project/{id}` and receives:

```json
{
  "type": "TASK_CREATED | TASK_UPDATED | TASK_STATUS_CHANGED | TASK_DELETED",
  "payload": { ...task object },
  "projectId": 1,
  "actorName": "John Doe",
  "timestamp": "2024-01-15T10:30:00"
}
```

---

## 🧪 First Steps After Startup

1. Register an Admin user at `http://localhost:3000/register`
2. Create a project
3. Add team members
4. Create tasks on the Kanban board
5. Set up task dependencies in the task modal
6. Open two browser tabs to see real-time updates

---

*Built with Spring Boot 3.2 + React 18 + Tailwind CSS*
