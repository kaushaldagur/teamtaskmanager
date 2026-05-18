const adminCredentials = {
  email: "admin@ethara.dev",
  password: "password123"
};

const state = {
  token: localStorage.getItem("etharaToken"),
  user: JSON.parse(localStorage.getItem("etharaUser") || "null"),
  view: localStorage.getItem("etharaView") || "dashboard",
  dashboard: null,
  projects: [],
  users: [],
  search: "",
  status: "ALL",
  priority: "ALL",
  selectedProject: "ALL"
};

if (state.user?.email === adminCredentials?.email && state.user.name !== "Kaushal Dagur") {
  state.user.name = "Kaushal Dagur";
  localStorage.setItem("etharaUser", JSON.stringify(state.user));
}

const views = [
  ["dashboard", "Dashboard"],
  ["projects", "Projects"],
  ["tasks", "Tasks"],
  ["team", "Team"],
  ["settings", "Settings"]
];

const columns = [
  ["TODO", "Todo"],
  ["IN_PROGRESS", "In Progress"],
  ["DONE", "Done"]
];

const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const statuses = ["TODO", "IN_PROGRESS", "DONE"];

const app = document.querySelector("#app");
const toast = document.querySelector("#toast");

const api = async (path, options = {}) => {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
      ...options.headers
    }
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || "Request failed");
  }
  if (response.status === 204) {
    return null;
  }
  return response.json();
};

const notify = (message, tone = "info") => {
  toast.textContent = message;
  toast.className = `toast ${tone}`;
  toast.hidden = false;
  window.clearTimeout(notify.timer);
  notify.timer = window.setTimeout(() => {
    toast.hidden = true;
  }, 2600);
};

const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const initials = (name) => name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

const datePlus = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const saveSession = (result) => {
  state.token = result.token;
  state.user = result.user;
  localStorage.setItem("etharaToken", result.token);
  localStorage.setItem("etharaUser", JSON.stringify(result.user));
};

const logout = () => {
  state.token = null;
  state.user = null;
  state.dashboard = null;
  localStorage.removeItem("etharaToken");
  localStorage.removeItem("etharaUser");
  notify("Logged out");
  renderAuth();
};

const setView = async (view) => {
  state.view = view;
  localStorage.setItem("etharaView", view);
  renderShell();
  await hydrate();
};

const hydrate = async () => {
  if (!state.token) {
    renderAuth();
    return;
  }
  try {
    const requests = [api("/api/dashboard"), api("/api/projects")];
    if (state.user?.role === "ADMIN") {
      requests.push(api("/api/users"));
    }
    const [dashboard, projects, users = []] = await Promise.all(requests);
    state.dashboard = dashboard;
    state.projects = projects;
    state.users = users;
    renderShell();
  }
  catch (error) {
    logout();
    notify(error.message || "Session expired", "error");
  }
};

const renderAuth = () => {
  app.innerHTML = `
    <main class="auth-page">
      <section class="auth-copy">
        <div class="brand large"><span class="brand-mark">E</span><div><strong>Ethara</strong><small>Manager</small></div></div>
        <p class="eyebrow">Collaborate. Track. Deliver.</p>
        <h1>Run projects like a real product team.</h1>
        <p>Ethara Manager brings role-based delivery, team visibility, Kanban task tracking, and executive analytics into one focused workspace.</p>
        <div class="auth-metrics">
          <span><strong>RBAC</strong> Admin/member workflows</span>
          <span><strong>JWT</strong> Secure sessions</span>
          <span><strong>SQL</strong> Real relationships</span>
        </div>
      </section>
      <section class="auth-card">
        <div class="tabs">
          <button class="tab active" data-auth-tab="login" type="button">Login</button>
          <button class="tab" data-auth-tab="signup" type="button">Signup</button>
        </div>
        <form id="loginForm" class="auth-form">
          <label><span>Email</span><input name="email" type="email" value="${adminCredentials.email}" required></label>
          <label><span>Password</span><input name="password" type="password" value="${adminCredentials.password}" required></label>
          <button class="primary-btn" type="submit">Login to workspace</button>
          <div class="credential-box">
            <span>Admin ID</span>
            <strong>${adminCredentials.email}</strong>
            <span>Password</span>
            <strong>${adminCredentials.password}</strong>
          </div>
        </form>
        <form id="signupForm" class="auth-form hidden">
          <label><span>Name</span><input name="name" type="text" value="Kaushal Dagur" required></label>
          <label><span>Email</span><input name="email" type="email" placeholder="you@ethara.dev" required></label>
          <label><span>Password</span><input name="password" type="password" minlength="6" placeholder="Minimum 6 characters" required></label>
          <label><span>Role</span><select name="role"><option>MEMBER</option><option>ADMIN</option></select></label>
          <button class="primary-btn" type="submit">Create account</button>
        </form>
      </section>
    </main>
  `;
  bindAuth();
};

const bindAuth = () => {
  document.querySelectorAll("[data-auth-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      const isLogin = button.dataset.authTab === "login";
      document.querySelectorAll("[data-auth-tab]").forEach((tab) => tab.classList.toggle("active", tab === button));
      document.querySelector("#loginForm").classList.toggle("hidden", !isLogin);
      document.querySelector("#signupForm").classList.toggle("hidden", isLogin);
    });
  });

  document.querySelector("#loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const result = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(form))
      });
      saveSession(result);
      notify(`Welcome back, ${result.user.name}`, "success");
      await hydrate();
    }
    catch (error) {
      notify(error.message, "error");
    }
  });

  document.querySelector("#signupForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const result = await api("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(form))
      });
      saveSession(result);
      notify("Account created", "success");
      await hydrate();
    }
    catch (error) {
      notify(error.message, "error");
    }
  });
};

const renderShell = () => {
  if (!state.token) {
    renderAuth();
    return;
  }
  app.innerHTML = `
    <main class="app-shell">
      <aside class="sidebar">
        <div class="brand"><span class="brand-mark">E</span><div><strong>Ethara</strong><small>Manager</small></div></div>
        <nav class="nav-list" aria-label="Primary">
          ${views.map(([key, label]) => `<button class="nav-item ${state.view === key ? "active" : ""}" data-view="${key}" type="button">${label}</button>`).join("")}
        </nav>
        <section class="workspace-card">
          <span>Signed in as</span>
          <strong>${escapeHtml(state.user?.name || "User")}</strong>
          <small>${escapeHtml(state.user?.role || "")}</small>
          <button class="ghost-btn" id="logoutButton" type="button">Logout</button>
        </section>
      </aside>
      <section class="main-panel">
        <header class="topbar">
          <div>
            <p class="eyebrow">Collaborate. Track. Deliver.</p>
            <h1>${viewTitle()}</h1>
          </div>
          <div class="top-actions">
            <span class="api-pill">API live</span>
            <button class="ghost-btn" data-refresh type="button">Refresh</button>
          </div>
        </header>
        <div id="viewRoot">${state.dashboard ? renderView() : renderLoading()}</div>
      </section>
    </main>
  `;
  bindShell();
};

const viewTitle = () => ({
  dashboard: "Command center",
  projects: "Projects",
  tasks: "Task board",
  team: "Team",
  settings: "Settings"
}[state.view] || "Command center");

const renderLoading = () => `<section class="hero-band"><div><p class="eyebrow">Loading</p><h2>Preparing workspace</h2></div></section>`;

const renderView = () => ({
  dashboard: renderDashboard,
  projects: renderProjects,
  tasks: renderTasks,
  team: renderTeamPage,
  settings: renderSettings
}[state.view] || renderDashboard)();

const statsCards = () => {
  const stats = state.dashboard.stats;
  return [
    ["Total Tasks", stats.totalTasks, "Workspace load"],
    ["Completed", stats.completedTasks, "Delivery wins"],
    ["Pending", stats.pendingTasks, "Active queue"],
    ["Overdue", stats.overdueTasks, "Needs attention"]
  ].map(([label, value, note]) => `
    <article class="stat-card"><span>${label}</span><strong>${value}</strong><small>${note}</small></article>
  `).join("");
};

const renderDashboard = () => `
  <section class="hero-band">
    <div>
      <p class="eyebrow">Premium SaaS workspace</p>
      <h2>Ethara Manager</h2>
      <p>Role-based project management with delivery analytics, team performance, and a Kanban workflow connected to the backend.</p>
    </div>
    <div class="hero-stat"><span>Admin ID</span><strong>${adminCredentials.email}</strong><small>${adminCredentials.password}</small></div>
  </section>
  <section class="stats-grid">${statsCards()}</section>
  <section class="content-grid">
    <article class="panel board-panel">${boardHeader()}${kanbanBoard(filteredTasks().slice(0, 8), false)}</article>
    <article class="panel">${panelTitle("Analytics", "Status mix")}${statusBars()}</article>
    <article class="panel">${panelTitle("Activity", "Recent movement")}${activityList()}</article>
    <article class="panel">${panelTitle("Team", "Performance")}${teamList()}</article>
  </section>
`;

const renderProjects = () => `
  <section class="split-grid">
    <article class="panel wide">
      ${panelTitle("Projects", "Active delivery spaces")}
      <div class="project-grid">${state.projects.map(projectCard).join("")}</div>
    </article>
    ${state.user.role === "ADMIN" ? createProjectForm() : permissionPanel("Only admins can create projects.")}
  </section>
`;

const renderTasks = () => `
  <section class="panel">
    <div class="task-toolbar">
      <input id="taskSearch" value="${escapeHtml(state.search)}" placeholder="Search tasks">
      <select id="statusFilter"><option value="ALL">All statuses</option>${statuses.map((status) => `<option ${state.status === status ? "selected" : ""}>${status}</option>`).join("")}</select>
      <select id="priorityFilter"><option value="ALL">All priorities</option>${priorities.map((priority) => `<option ${state.priority === priority ? "selected" : ""}>${priority}</option>`).join("")}</select>
      <select id="projectFilter"><option value="ALL">All projects</option>${state.projects.map((project) => `<option value="${project.id}" ${String(project.id) === String(state.selectedProject) ? "selected" : ""}>${escapeHtml(project.name)}</option>`).join("")}</select>
    </div>
    ${kanbanBoard(filteredTasks(), true)}
  </section>
  ${state.user.role === "ADMIN" ? createTaskForm() : permissionPanel("Members can update only their assigned task progress.")}
`;

const renderTeamPage = () => `
  <section class="split-grid">
    <article class="panel wide">
      ${panelTitle("Team", "Delivery ownership")}
      <div class="team-cards">${teamList(true)}</div>
    </article>
    ${permissionPanel(state.user.role === "ADMIN" ? "Admin can add members through signup or the users API." : "Your member workspace is scoped to projects and tasks assigned to you.")}
  </section>
`;

const renderSettings = () => `
  <section class="split-grid">
    <article class="panel wide">
      ${panelTitle("Workspace", "Account and environment")}
      <div class="settings-list">
        <div><span>Name</span><strong>${escapeHtml(state.user.name)}</strong></div>
        <div><span>Email</span><strong>${escapeHtml(state.user.email)}</strong></div>
        <div><span>Role</span><strong>${escapeHtml(state.user.role)}</strong></div>
        <div><span>Backend</span><strong>Spring Boot + JWT + SQL</strong></div>
      </div>
    </article>
    <article class="panel">
      ${panelTitle("Session", "Secure access")}
      <button class="danger-btn" id="settingsLogout" type="button">Logout</button>
    </article>
  </section>
`;

const panelTitle = (eyebrow, title) => `
  <div class="panel-heading"><div><p class="eyebrow">${eyebrow}</p><h3>${title}</h3></div></div>
`;

const boardHeader = () => `
  <div class="panel-heading"><div><p class="eyebrow">Kanban</p><h3>Task board</h3></div><span>${filteredTasks().length} tasks</span></div>
`;

const filteredTasks = () => (state.dashboard?.tasks || []).filter((task) => {
  const text = `${task.title} ${task.description} ${task.assignedTo.name} ${task.projectName}`.toLowerCase();
  return (!state.search || text.includes(state.search.toLowerCase()))
    && (state.status === "ALL" || task.status === state.status)
    && (state.priority === "ALL" || task.priority === state.priority)
    && (state.selectedProject === "ALL" || String(task.projectId) === String(state.selectedProject));
});

const kanbanBoard = (tasks, withActions) => `
  <div class="kanban">
    ${columns.map(([status, label]) => {
      const columnTasks = tasks.filter((task) => task.status === status);
      return `
        <section class="column">
          <div class="column-title"><span>${label}</span><span>${columnTasks.length}</span></div>
          ${columnTasks.map((task) => taskCard(task, withActions)).join("") || `<span class="pill">No tasks</span>`}
        </section>
      `;
    }).join("")}
  </div>
`;

const taskCard = (task, withActions) => `
  <article class="task-card">
    <div class="task-title">${escapeHtml(task.title)}</div>
    <p>${escapeHtml(task.description)}</p>
    <div class="task-meta">
      <span class="pill priority-${task.priority}">${task.priority}</span>
      <span class="pill">${task.dueDate}</span>
      <span class="avatar" title="${escapeHtml(task.assignedTo.name)}">${initials(task.assignedTo.name)}</span>
    </div>
    <div class="tag-row">${task.tags.map((tag) => `<span class="pill">${escapeHtml(tag)}</span>`).join("")}</div>
    ${withActions ? `
      <select class="status-select" data-task-status="${task.id}">
        ${statuses.map((status) => `<option value="${status}" ${task.status === status ? "selected" : ""}>${status}</option>`).join("")}
      </select>
    ` : ""}
  </article>
`;

const statusBars = () => {
  const total = Math.max(state.dashboard.stats.totalTasks, 1);
  return `<div class="chart-stack">${Object.entries(state.dashboard.tasksByStatus).map(([label, value]) => `
    <div class="bar-row"><span>${label.replace("_", " ")}</span><span class="bar-track"><span class="bar-fill" style="width:${Math.round((value / total) * 100)}%"></span></span><strong>${value}</strong></div>
  `).join("")}</div>`;
};

const activityList = () => `<div class="activity-list">${state.dashboard.recentActivity.map((item) => `<div class="activity-item">${escapeHtml(item.message)}</div>`).join("")}</div>`;

const teamList = (cards = false) => {
  const rows = state.dashboard.teamPerformance.map((member) => `
    <div class="${cards ? "member-card" : "member-row"}">
      <div class="member-top"><strong>${escapeHtml(member.name)}</strong><span>${member.completionPercent}%</span></div>
      <div class="bar-track"><div class="bar-fill" style="width:${member.completionPercent}%"></div></div>
      <span class="pill">${member.completedTasks}/${member.taskCount} completed</span>
    </div>
  `).join("");
  return cards ? rows : `<div class="team-list">${rows}</div>`;
};

const projectCard = (project) => `
  <article class="project-card">
    <div class="project-top"><h3>${escapeHtml(project.name)}</h3><span>${project.completionPercent}%</span></div>
    <p>${escapeHtml(project.description)}</p>
    <div class="bar-track"><div class="bar-fill" style="width:${project.completionPercent}%"></div></div>
    <div class="task-meta">
      <span class="pill">${project.taskCount} tasks</span>
      <span class="pill">${project.members.length} members</span>
      <span class="pill">${project.deadline}</span>
    </div>
  </article>
`;

const permissionPanel = (message) => `<article class="panel side-note"><p class="eyebrow">Access control</p><h3>${escapeHtml(message)}</h3></article>`;

const createProjectForm = () => `
  <article class="panel">
    ${panelTitle("Admin", "Create project")}
    <form id="projectForm" class="stack-form">
      <input name="name" placeholder="Project name" required>
      <textarea name="description" placeholder="Description" required></textarea>
      <input name="deadline" type="date" value="${datePlus(21)}" required>
      <select name="memberIds" multiple required>
        ${state.users.map((user) => `<option value="${user.id}" selected>${escapeHtml(user.name)} · ${user.role}</option>`).join("")}
      </select>
      <button class="primary-btn" type="submit">Create project</button>
    </form>
  </article>
`;

const createTaskForm = () => `
  <section class="panel form-panel">
    ${panelTitle("Admin", "Create task")}
    <form id="taskForm" class="form-grid">
      <input name="title" placeholder="Task title" required>
      <input name="tags" placeholder="Tags: backend, ui">
      <textarea name="description" placeholder="Description" required></textarea>
      <select name="priority">${priorities.map((priority) => `<option>${priority}</option>`).join("")}</select>
      <select name="status">${statuses.map((status) => `<option>${status}</option>`).join("")}</select>
      <input name="dueDate" type="date" value="${datePlus(7)}" required>
      <select name="assignedUserId" required>${state.users.filter((user) => user.role === "MEMBER").map((user) => `<option value="${user.id}">${escapeHtml(user.name)}</option>`).join("")}</select>
      <select name="projectId" required>${state.projects.map((project) => `<option value="${project.id}">${escapeHtml(project.name)}</option>`).join("")}</select>
      <button class="primary-btn" type="submit">Create task</button>
    </form>
  </section>
`;

const bindShell = () => {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });
  document.querySelector("#logoutButton")?.addEventListener("click", logout);
  document.querySelector("#settingsLogout")?.addEventListener("click", logout);
  document.querySelector("[data-refresh]")?.addEventListener("click", hydrate);

  document.querySelector("#taskSearch")?.addEventListener("input", (event) => {
    state.search = event.target.value;
    renderShell();
  });
  document.querySelector("#statusFilter")?.addEventListener("change", (event) => {
    state.status = event.target.value;
    renderShell();
  });
  document.querySelector("#priorityFilter")?.addEventListener("change", (event) => {
    state.priority = event.target.value;
    renderShell();
  });
  document.querySelector("#projectFilter")?.addEventListener("change", (event) => {
    state.selectedProject = event.target.value;
    renderShell();
  });

  document.querySelectorAll("[data-task-status]").forEach((select) => {
    select.addEventListener("change", async (event) => {
      try {
        await api(`/api/tasks/${event.target.dataset.taskStatus}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status: event.target.value })
        });
        notify("Task status updated", "success");
        await hydrate();
      }
      catch (error) {
        notify(error.message, "error");
        await hydrate();
      }
    });
  });

  document.querySelector("#projectForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const memberIds = Array.from(event.currentTarget.memberIds.selectedOptions).map((option) => Number(option.value));
    try {
      await api("/api/projects", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          description: form.get("description"),
          deadline: form.get("deadline"),
          memberIds
        })
      });
      notify("Project created", "success");
      await hydrate();
    }
    catch (error) {
      notify(error.message, "error");
    }
  });

  document.querySelector("#taskForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api("/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: form.get("title"),
          description: form.get("description"),
          priority: form.get("priority"),
          status: form.get("status"),
          dueDate: form.get("dueDate"),
          assignedUserId: Number(form.get("assignedUserId")),
          projectId: Number(form.get("projectId")),
          tags: String(form.get("tags") || "").split(",").map((tag) => tag.trim()).filter(Boolean)
        })
      });
      notify("Task created", "success");
      await hydrate();
    }
    catch (error) {
      notify(error.message, "error");
    }
  });
};

if (state.token && state.user) {
  renderShell();
  hydrate();
}
else {
  renderAuth();
}
