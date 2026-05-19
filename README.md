# Ethara Manager

Collaborate. Track. Deliver.

Ethara Manager is a production-shaped Spring Boot SaaS dashboard for team project management. It includes JWT auth, role-based workflows, project membership, Kanban task management, filtering, dashboard analytics, dark/light themes, and a polished static frontend served by Spring Boot.

## What Is Built

- JWT signup/login with BCrypt password hashing
- Role-based access control for `ADMIN` and `MEMBER`
- SQL relational model for users, projects, project members, and tasks
- Validated REST APIs for auth, dashboard, projects, tasks, and team users
- Admin workflows: create and edit projects, manage project members, create/delete tasks
- Member workflows: view assigned/project work and update own task progress
- Dashboard data for stat cards, charts, activity feed, deadlines, and team performance
- Responsive dashboard UI with native drag-and-drop Kanban status updates
- Dark/light theme toggle with local preference persistence
- Admin workflows: add/remove team members, create/edit/delete projects, create/delete tasks
- Seeded demo workspace so the product feels real on first run

## Demo Accounts

All seeded accounts use:

```text
password123
```

| Role | Email |
| --- | --- |
| ADMIN | admin@ethara.dev |
| MEMBER | rohan@ethara.dev |
| MEMBER | anaya@ethara.dev |

## Demo walkthrough script

For a step-by-step narrator script (screen recording or live demo), see [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md).

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
- `POST /api/users`
- `DELETE /api/users/{id}`
- `POST /api/projects`
- `PUT /api/projects/{id}`
- `DELETE /api/projects/{id}`
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

## Railway + PostgreSQL Deployment

This repo includes:

- `system.properties` for Java 21 on Railway
- `Procfile` with the production start command
- PostgreSQL runtime dependency in `pom.xml`

Recommended Railway variables:

```bash
JDBC_DATABASE_URL=jdbc:postgresql://<host>:<port>/<database>
JDBC_DATABASE_USERNAME=<postgres-user>
JDBC_DATABASE_PASSWORD=<postgres-password>
JDBC_DATABASE_DRIVER=org.postgresql.Driver
JPA_DDL_AUTO=update
JWT_SECRET=<long-random-production-secret>
JWT_TTL_SECONDS=86400
H2_CONSOLE_ENABLED=false
```

Railway usually provides database connection values after adding a PostgreSQL service. Convert the URL to JDBC format if needed:

```text
postgresql://user:pass@host:port/db
```

becomes:

```text
jdbc:postgresql://host:port/db
```

Then put the user and password into `JDBC_DATABASE_USERNAME` and `JDBC_DATABASE_PASSWORD`.

## Verification

```bash
./mvnw test
```
