# Ethara Manager

Collaborate. Track. Deliver.

Ethara Manager is a production-shaped Spring Boot backend for a modern SaaS project management platform. It is designed to support a Linear/ClickUp-style frontend with JWT auth, role-based workflows, project membership, Kanban task management, filtering, and dashboard analytics.

## What Is Built

- JWT signup/login with BCrypt password hashing
- Role-based access control for `ADMIN` and `MEMBER`
- SQL relational model for users, projects, project members, and tasks
- Validated REST APIs for auth, dashboard, projects, tasks, and team users
- Admin workflows: create projects, manage project members, create/delete tasks
- Member workflows: view assigned/project work and update own task progress
- Dashboard data for stat cards, charts, activity feed, deadlines, and team performance
- Seeded demo workspace so the product feels real on first run

## Demo Accounts

All seeded accounts use:

```text
password123
```

| Role | Email |
| --- | --- |
| ADMIN | admin@ethara.dev |
| MEMBER | kaushal@ethara.dev |
| MEMBER | anaya@ethara.dev |

## Run Locally

```bash
./mvnw spring-boot:run
```

The API starts on `http://localhost:8080` by default.

To use PostgreSQL, set:

```bash
JDBC_DATABASE_URL=jdbc:postgresql://localhost:5432/ethara
JDBC_DATABASE_USERNAME=postgres
JDBC_DATABASE_PASSWORD=postgres
JDBC_DATABASE_DRIVER=org.postgresql.Driver
JPA_DDL_AUTO=update
JWT_SECRET=replace-with-a-long-random-secret
```

Without those variables, the app uses an in-memory H2 database for fast demos.

## API Overview

Public:

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/health`

Authenticated:

- `GET /api/dashboard`
- `GET /api/projects`
- `GET /api/projects/{id}`
- `GET /api/projects/{id}/tasks`
- `GET /api/tasks?status=&priority=&assigneeId=&search=`
- `PATCH /api/tasks/{id}/status`

Admin only:

- `GET /api/users`
- `POST /api/projects`
- `POST /api/projects/{id}/members`
- `DELETE /api/projects/{id}/members/{userId}`
- `POST /api/tasks`
- `DELETE /api/tasks/{id}`

Use the login response token as:

```http
Authorization: Bearer <token>
```

## Example Login

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ethara.dev","password":"password123"}'
```

## Frontend Contract

Task status values:

```text
TODO
IN_PROGRESS
DONE
```

Priority values:

```text
LOW
MEDIUM
HIGH
URGENT
```

The dashboard endpoint returns:

- `stats` for analytics cards
- `tasksByStatus` for pie/bar charts
- `tasksByPriority` for priority charts
- `recentActivity` for the activity feed
- `upcomingDeadlines` for deadline cards
- `teamPerformance` for member progress bars

## Verification

```bash
./mvnw test
```
