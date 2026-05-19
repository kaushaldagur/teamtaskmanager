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
  selectedProject: "ALL",
  theme: localStorage.getItem("etharaTheme") || "dark"
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
const isAdmin = () => state.user?.role === "ADMIN";

const app = document.querySelector("#app");
const toast = document.querySelector("#toast");

const applyTheme = () => {
  document.documentElement.dataset.theme = state.theme;
};

applyTheme();

const api = async (path, options = {}) => {
  const isAuthRequest = path.startsWith("/api/auth/");
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(state.token && !isAuthRequest ? { Authorization: `Bearer ${state.token}` } : {}),
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

const toggleTheme = () => {
  state.theme = state.theme === "dark" ? "light" : "dark";
  localStorage.setItem("etharaTheme", state.theme);
  applyTheme();
  renderShell();
};

const hydrate = async () => {
  if (!state.token) {
    renderAuth();
    return;
  }
  try {
    const requests = [api("/api/dashboard"), api("/api/projects")];
    if (isAdmin()) {
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
      <div class="auth-shell">
        <section class="auth-visual" aria-hidden="true">
          <div class="auth-stripe"></div>
          <div class="auth-visual-body">
            <div class="auth-visual-mark">E</div>
            <p class="eyebrow">Collaborate · track · deliver</p>
            <h2 class="auth-visual-title">Ethara Manager</h2>
            <p class="auth-visual-copy">Role-based projects, Kanban tasks, and delivery analytics in one calm workspace.</p>
            <ul class="auth-visual-bullets">
              <li>Admin &amp; member workflows</li>
              <li>Live task board &amp; filters</li>
              <li>JWT-secured API</li>
            </ul>
          </div>
        </section>
        <section class="auth-panel">
          <header class="auth-panel-head">
            <h1 class="auth-form-title" data-auth-form-title>Log in</h1>
            <p class="auth-form-lede" data-auth-form-lede>Welcome back — sign in to open your workspace.</p>
          </header>
          <div class="tabs auth-tabs" role="tablist" aria-label="Account">
            <button class="tab active" data-auth-tab="login" type="button" role="tab" aria-selected="true">Log in</button>
            <button class="tab" data-auth-tab="signup" type="button" role="tab" aria-selected="false">Sign up</button>
          </div>
          <form id="loginForm" class="auth-form">
            <label class="auth-field"><span>Email</span><input name="email" type="email" autocomplete="email" placeholder="you@company.com" required></label>
            <label class="auth-field"><span>Password</span><input name="password" type="password" autocomplete="current-password" placeholder="••••••••" required></label>
            <button class="primary-btn auth-submit" type="submit">Continue</button>
          </form>
          <form id="signupForm" class="auth-form hidden">
            <label class="auth-field"><span>Name</span><input name="name" type="text" autocomplete="name" placeholder="Your name" required></label>
            <label class="auth-field"><span>Email</span><input name="email" type="email" autocomplete="email" placeholder="you@company.com" required></label>
            <label class="auth-field"><span>Password</span><input name="password" type="password" autocomplete="new-password" minlength="6" placeholder="At least 6 characters" required></label>
            <label class="auth-field"><span>Role</span><select name="role"><option value="MEMBER">Member</option><option value="ADMIN">Admin</option></select></label>
            <button class="primary-btn auth-submit" type="submit">Create account</button>
          </form>
          <p class="auth-switch" data-auth-switch-login>
            <span>New here?</span>
            <button type="button" class="auth-switch-btn" data-auth-switch="signup">Create an account</button>
          </p>
          <p class="auth-switch hidden" data-auth-switch-signup>
            <span>Already have an account?</span>
            <button type="button" class="auth-switch-btn" data-auth-switch="login">Log in</button>
          </p>
        </section>
      </div>
    </main>
  `;
  bindAuth();
};

const setAuthTabMode = (mode) => {
  const isLogin = mode === "login";
  document.querySelectorAll("[data-auth-tab]").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.authTab === mode);
    tab.setAttribute("aria-selected", String(tab.dataset.authTab === mode));
  });
  document.querySelector("#loginForm").classList.toggle("hidden", !isLogin);
  document.querySelector("#signupForm").classList.toggle("hidden", isLogin);
  const title = document.querySelector("[data-auth-form-title]");
  const lede = document.querySelector("[data-auth-form-lede]");
  if (title) {
    title.textContent = isLogin ? "Log in" : "Sign up";
  }
  if (lede) {
    lede.textContent = isLogin
      ? "Welcome back — sign in to open your workspace."
      : "Create your account to join projects and track tasks with your team.";
  }
  const rowLogin = document.querySelector("[data-auth-switch-login]");
  const rowSignup = document.querySelector("[data-auth-switch-signup]");
  if (rowLogin && rowSignup) {
    rowLogin.classList.toggle("hidden", !isLogin);
    rowSignup.classList.toggle("hidden", isLogin);
  }
};

const bindAuth = () => {
  document.querySelectorAll("[data-auth-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      setAuthTabMode(button.dataset.authTab);
    });
  });
  document.querySelectorAll("[data-auth-switch]").forEach((btn) => {
    btn.addEventListener("click", () => setAuthTabMode(btn.dataset.authSwitch));
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
        <button class="theme-toggle" data-theme-toggle type="button">
          <span>${state.theme === "dark" ? "Light mode" : "Dark mode"}</span>
          <strong>${state.theme === "dark" ? "Light" : "Dark"}</strong>
        </button>
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
            <span class="api-pill">Workspace live</span>
            <input class="global-search" data-global-search value="${escapeHtml(state.search)}" placeholder="Search tasks, projects, people">
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

const renderViewOnly = (focusSelector) => {
  const viewRoot = document.querySelector("#viewRoot");
  if (!viewRoot) {
    return;
  }
  viewRoot.innerHTML = renderView();
  bindViewControls();
  if (focusSelector) {
    const field = document.querySelector(focusSelector);
    field?.focus();
    if (field?.setSelectionRange) {
      field.setSelectionRange(field.value.length, field.value.length);
    }
  }
};

const searchTerm = () => state.search.trim().toLowerCase();

const statsCards = () => {
  const stats = state.dashboard.stats;
  return [
    ["Total Tasks", stats.totalTasks, "Workspace load", "total"],
    ["Completed", stats.completedTasks, "Delivery wins", "done"],
    ["Pending", stats.pendingTasks, "Active queue", "pending"],
    ["Overdue", stats.overdueTasks, "Needs attention", "overdue"]
  ].map(([label, value, note]) => `
    <article class="stat-card stat-${note}"><span>${label}</span><strong>${value}</strong><small>${note}</small></article>
  `).join("");
};

const renderDashboard = () => `
  <section class="dashboard-hero">
    <div>
      <p class="eyebrow">Premium SaaS workspace</p>
      <h2>Ethara Manager</h2>
      <p>Role-based project management with delivery analytics, team performance, and a Kanban workflow for focused execution.</p>
    </div>
    <div class="hero-actions">
      <div class="hero-stat"><span>Active projects</span><strong>${state.projects.length}</strong><small>${filteredTasks().length} visible tasks</small></div>
      <div class="hero-stat"><span>Completion</span><strong>${completionPercent()}%</strong><small>${state.dashboard.stats.completedTasks} delivered</small></div>
    </div>
  </section>
  <section class="stats-grid">${statsCards()}</section>
  <section class="summary-grid">
    <article class="panel summary-panel">${panelTitle("Overview", "Delivery health")}${progressRing()}${statusBars()}</article>
    <article class="panel summary-panel">${panelTitle("Attention", "Important tasks")}${importantTasks()}</article>
    <article class="panel summary-panel">${panelTitle("Deadlines", "Next up")}${upcomingList(3)}</article>
  </section>
  <section class="dashboard-secondary compact">
    <article class="panel">${panelTitle("Activity", "Latest updates")}${activityList(3)}</article>
    <article class="panel dashboard-cta">
      <p class="eyebrow">Workspace</p>
      <h3>Open a tab for detailed work</h3>
      <div class="quick-actions">
        <button class="ghost-btn" data-view="tasks" type="button">Task board</button>
        <button class="ghost-btn" data-view="projects" type="button">Projects</button>
        <button class="ghost-btn" data-view="team" type="button">Team</button>
      </div>
    </article>
  </section>
`;

const renderProjects = () => `
  <section class="split-grid">
    <article class="panel wide">
      ${panelTitle("Projects", "Active delivery spaces")}
      <div class="project-grid">${filteredProjects().map(projectCard).join("") || emptyState("No projects match your search.")}</div>
    </article>
    ${isAdmin() ? createProjectForm() : permissionPanel("Only admins can create projects.")}
  </section>
  ${isAdmin() ? editProjectDialog() : ""}
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
  ${isAdmin() ? createTaskForm() : permissionPanel("Members can update only their assigned task progress.")}
`;

const renderTeamPage = () => `
  <section class="split-grid">
    <article class="panel wide">
      ${panelTitle("Team", "Delivery ownership")}
      <div class="team-cards">${teamList(true)}</div>
    </article>
    ${isAdmin() ? createTeamMemberForm() : permissionPanel("Your member workspace is scoped to projects and tasks assigned to you.")}
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
  const term = searchTerm();
  const text = `${task.title} ${task.description} ${task.assignedTo.name} ${task.projectName}`.toLowerCase();
  return (!term || text.includes(term))
    && (state.status === "ALL" || task.status === state.status)
    && (state.priority === "ALL" || task.priority === state.priority)
    && (state.selectedProject === "ALL" || String(task.projectId) === String(state.selectedProject));
});

const filteredProjects = () => {
  const term = searchTerm();
  return state.projects.filter((project) => {
    const text = `${project.name} ${project.description} ${project.createdBy.name} ${project.members.map((member) => member.name).join(" ")}`.toLowerCase();
    return !term || text.includes(term);
  });
};

const filteredTeamPerformance = () => {
  const term = searchTerm();
  return (state.dashboard?.teamPerformance || []).filter((member) => {
    const user = state.users.find((item) => item.id === member.userId);
    const text = `${member.name} ${user?.email || ""} ${user?.role || ""}`.toLowerCase();
    return !term || text.includes(term);
  });
};

const filteredUpcomingDeadlines = () => {
  const term = searchTerm();
  return (state.dashboard?.upcomingDeadlines || []).filter((item) => {
    const text = `${item.task} ${item.assignee} ${item.priority}`.toLowerCase();
    return !term || text.includes(term);
  });
};

const filteredActivity = () => {
  const term = searchTerm();
  return (state.dashboard?.recentActivity || []).filter((item) => {
    const text = `${item.message} ${item.tone}`.toLowerCase();
    return !term || text.includes(term);
  });
};

const emptyState = (message) => `<div class="empty-state">${escapeHtml(message)}</div>`;

const kanbanBoard = (tasks, withActions) => `
  <div class="kanban ${withActions ? "kanban-manage" : ""}">
    ${columns.map(([status, label]) => {
      const columnTasks = tasks.filter((task) => task.status === status);
      return `
        <section class="column" data-drop-status="${status}">
          <div class="column-title"><span>${label}</span><span>${columnTasks.length}</span></div>
          <div class="column-dropzone">${columnTasks.map((task) => taskCard(task, withActions)).join("") || `<span class="pill empty-pill">No tasks</span>`}</div>
        </section>
      `;
    }).join("")}
  </div>
`;

const taskCard = (task, withActions) => `
  <article class="task-card" draggable="${withActions ? "true" : "false"}" data-task-id="${task.id}">
    <div class="task-title">${escapeHtml(task.title)}</div>
    <p>${escapeHtml(task.description)}</p>
    <div class="task-meta">
      <span class="pill priority-${task.priority}">${task.priority}</span>
      <span class="pill">${task.dueDate}</span>
      <span class="avatar" title="${escapeHtml(task.assignedTo.name)}">${initials(task.assignedTo.name)}</span>
    </div>
    <div class="tag-row">${task.tags.map((tag) => `<span class="pill">${escapeHtml(tag)}</span>`).join("")}</div>
    ${withActions ? `
      <div class="card-actions">
        <select class="status-select" data-task-status="${task.id}">
          ${statuses.map((status) => `<option value="${status}" ${task.status === status ? "selected" : ""}>${status}</option>`).join("")}
        </select>
        ${isAdmin() ? `<button class="icon-btn danger" data-delete-task="${task.id}" type="button" title="Delete task">Delete</button>` : ""}
      </div>
    ` : ""}
  </article>
`;

const statusBars = () => {
  const total = Math.max(state.dashboard.stats.totalTasks, 1);
  return `<div class="chart-stack">${Object.entries(state.dashboard.tasksByStatus).map(([label, value]) => `
    <div class="bar-row"><span>${label.replace("_", " ")}</span><span class="bar-track"><span class="bar-fill" style="width:${Math.round((value / total) * 100)}%"></span></span><strong>${value}</strong></div>
  `).join("")}</div>`;
};

const priorityBars = () => {
  const total = Math.max(state.dashboard.stats.totalTasks, 1);
  return `<div class="chart-stack">${Object.entries(state.dashboard.tasksByPriority).map(([label, value]) => `
    <div class="bar-row"><span>${label}</span><span class="bar-track"><span class="bar-fill priority-fill-${label}" style="width:${Math.round((value / total) * 100)}%"></span></span><strong>${value}</strong></div>
  `).join("")}</div>`;
};

const importantTasks = () => {
  const tasks = filteredTasks()
    .filter((task) => task.priority === "URGENT" || task.priority === "HIGH")
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate))
    .slice(0, 3);
  return `<div class="activity-list">${tasks.map((task) => `
    <div class="activity-item deadline-item">
      <strong>${escapeHtml(task.title)}</strong>
      <span>${escapeHtml(task.assignedTo.name)} · ${task.dueDate}</span>
      <span class="pill priority-${task.priority}">${task.priority}</span>
    </div>
  `).join("") || `<div class="activity-item">No high-priority tasks</div>`}</div>`;
};

const progressRing = () => {
  const percent = completionPercent();
  return `
    <div class="progress-ring" style="--progress:${percent * 3.6}deg">
      <strong>${percent}%</strong>
      <span>complete</span>
    </div>
`;
};

const completionPercent = () => {
  const stats = state.dashboard.stats;
  return stats.totalTasks === 0 ? 0 : Math.round((stats.completedTasks / stats.totalTasks) * 100);
};

const upcomingList = (limit = state.dashboard.upcomingDeadlines.length) => `<div class="activity-list">${filteredUpcomingDeadlines().slice(0, limit).map((item) => `
  <div class="activity-item deadline-item">
    <strong>${escapeHtml(item.task)}</strong>
    <span>${escapeHtml(item.assignee)} · ${item.dueDate}</span>
    <span class="pill priority-${item.priority}">${item.priority}</span>
  </div>
`).join("") || `<div class="activity-item">No upcoming deadlines</div>`}</div>`;

const activityList = (limit = state.dashboard.recentActivity.length) => `<div class="activity-list">${filteredActivity().slice(0, limit).map((item) => `<div class="activity-item">${escapeHtml(item.message)}</div>`).join("") || `<div class="activity-item">No recent activity</div>`}</div>`;

const teamList = (cards = false, limit = Infinity) => {
  const members = filteredTeamPerformance().slice(0, limit);
  const rows = members.map((member) => `
    <div class="${cards ? "member-card" : "member-row"}">
      <div class="member-top"><strong>${escapeHtml(member.name)}</strong><span>${member.completionPercent}%</span></div>
      <div class="bar-track"><div class="bar-fill" style="width:${member.completionPercent}%"></div></div>
      <div class="card-actions">
        <span class="pill">${member.completedTasks}/${member.taskCount} completed</span>
        ${cards && canRemoveMember(member.userId) ? `<button class="icon-btn danger" data-delete-user="${member.userId}" type="button" title="Remove member">Remove</button>` : ""}
      </div>
    </div>
  `).join("");
  const empty = emptyState("No team members match your search.");
  return cards ? (rows || empty) : `<div class="team-list">${rows || empty}</div>`;
};

const canRemoveMember = (userId) => {
  const user = state.users.find((item) => item.id === userId);
  return isAdmin() && userId !== state.user.id && user?.role === "MEMBER";
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
    ${isAdmin() ? `
      <div class="card-actions project-card-actions">
        <div class="card-actions-left">
          <span class="pill" title="Project creator">Admin · ${escapeHtml(project.createdBy.name)}</span>
          <button class="icon-btn" data-edit-project="${project.id}" type="button" title="Edit project">Edit</button>
        </div>
        <button class="icon-btn danger" data-delete-project="${project.id}" type="button" title="Delete project">Delete</button>
      </div>` : ""}
  </article>
`;

const permissionPanel = (message) => `<article class="panel side-note"><p class="eyebrow">Access control</p><h3>${escapeHtml(message)}</h3></article>`;

const editProjectDialog = () => `
  <dialog id="projectEditDialog" class="app-dialog">
    <form id="projectEditForm" class="stack-form">
      <input type="hidden" name="id" id="projectEditId">
      <p class="eyebrow">Admin</p>
      <h3 class="dialog-title">Edit project</h3>
      <input name="name" id="projectEditName" placeholder="Project name" required>
      <textarea name="description" id="projectEditDescription" placeholder="Description" required></textarea>
      <input name="deadline" id="projectEditDeadline" type="date" required>
      <select name="memberIds" id="projectEditMembers" multiple required></select>
      <div class="dialog-actions">
        <button class="ghost-btn" type="button" data-close-project-edit>Cancel</button>
        <button class="primary-btn" type="submit">Save changes</button>
      </div>
    </form>
  </dialog>
`;

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
      <input name="tags" placeholder="Tags: design, QA">
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

const createTeamMemberForm = () => `
  <article class="panel">
    ${panelTitle("Admin", "Add member")}
    <form id="memberForm" class="stack-form">
      <input name="name" placeholder="Full name" required>
      <input name="email" type="email" placeholder="member@ethara.dev" required>
      <input name="password" type="password" minlength="6" placeholder="Temporary password" required>
      <select name="role"><option>MEMBER</option><option>ADMIN</option></select>
      <button class="primary-btn" type="submit">Add member</button>
    </form>
  </article>
`;

const bindShell = () => {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });
  document.querySelector("#logoutButton")?.addEventListener("click", logout);
  document.querySelector("#settingsLogout")?.addEventListener("click", logout);
  document.querySelector("[data-refresh]")?.addEventListener("click", hydrate);
  document.querySelector("[data-theme-toggle]")?.addEventListener("click", toggleTheme);
  document.querySelector("[data-global-search]")?.addEventListener("input", (event) => {
    state.search = event.target.value;
    renderViewOnly();
  });

  bindViewControls();
};

const bindViewControls = () => {
  document.querySelector("#taskSearch")?.addEventListener("input", (event) => {
    state.search = event.target.value;
    document.querySelector("[data-global-search]").value = state.search;
    renderViewOnly("#taskSearch");
  });
  document.querySelector("#statusFilter")?.addEventListener("change", (event) => {
    state.status = event.target.value;
    renderViewOnly();
  });
  document.querySelector("#priorityFilter")?.addEventListener("change", (event) => {
    state.priority = event.target.value;
    renderViewOnly();
  });
  document.querySelector("#projectFilter")?.addEventListener("change", (event) => {
    state.selectedProject = event.target.value;
    renderViewOnly();
  });

  document.querySelectorAll("[data-task-status]").forEach((select) => {
    select.addEventListener("change", async (event) => {
      await updateTaskStatus(event.target.dataset.taskStatus, event.target.value);
    });
  });

  document.querySelectorAll(".task-card[draggable='true']").forEach((card) => {
    card.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", card.dataset.taskId);
      event.dataTransfer.effectAllowed = "move";
      card.classList.add("dragging");
    });
    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
      document.querySelectorAll(".column").forEach((column) => column.classList.remove("drag-over"));
    });
  });

  document.querySelectorAll("[data-drop-status]").forEach((column) => {
    column.addEventListener("dragover", (event) => {
      event.preventDefault();
      column.classList.add("drag-over");
    });
    column.addEventListener("dragleave", () => {
      column.classList.remove("drag-over");
    });
    column.addEventListener("drop", async (event) => {
      event.preventDefault();
      column.classList.remove("drag-over");
      const taskId = event.dataTransfer.getData("text/plain");
      const status = column.dataset.dropStatus;
      const task = filteredTasks().find((item) => String(item.id) === String(taskId));
      if (!task || task.status === status) {
        return;
      }
      await updateTaskStatus(taskId, status);
    });
  });

  document.querySelectorAll("[data-delete-task]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!confirm("Delete this task permanently?")) {
        return;
      }
      try {
        await api(`/api/tasks/${button.dataset.deleteTask}`, { method: "DELETE" });
        notify("Task deleted", "success");
        await hydrate();
      }
      catch (error) {
        notify(error.message, "error");
      }
    });
  });

  document.querySelectorAll("[data-delete-project]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!confirm("Delete this project and all of its tasks?")) {
        return;
      }
      try {
        await api(`/api/projects/${button.dataset.deleteProject}`, { method: "DELETE" });
        notify("Project deleted", "success");
        await hydrate();
      }
      catch (error) {
        notify(error.message, "error");
      }
    });
  });

  document.querySelectorAll("[data-edit-project]").forEach((button) => {
    button.addEventListener("click", () => {
      const project = state.projects.find((item) => String(item.id) === String(button.dataset.editProject));
      const dialog = document.querySelector("#projectEditDialog");
      const form = document.querySelector("#projectEditForm");
      const membersSelect = document.querySelector("#projectEditMembers");
      if (!project || !dialog || !form || !membersSelect) {
        return;
      }
      form.reset();
      document.querySelector("#projectEditId").value = project.id;
      document.querySelector("#projectEditName").value = project.name;
      document.querySelector("#projectEditDescription").value = project.description;
      document.querySelector("#projectEditDeadline").value = project.deadline;
      membersSelect.innerHTML = state.users.map((user) => {
        const selected = project.members.some((member) => member.id === user.id) ? " selected" : "";
        return `<option value="${user.id}"${selected}>${escapeHtml(user.name)} · ${user.role}</option>`;
      }).join("");
      dialog.showModal();
    });
  });

  document.querySelector("[data-close-project-edit]")?.addEventListener("click", () => {
    document.querySelector("#projectEditDialog")?.close();
  });

  document.querySelector("#projectEditForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const id = document.querySelector("#projectEditId").value;
    const fd = new FormData(form);
    const memberIds = Array.from(form.memberIds.selectedOptions).map((option) => Number(option.value));
    try {
      await api(`/api/projects/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: fd.get("name"),
          description: fd.get("description"),
          deadline: fd.get("deadline"),
          memberIds
        })
      });
      document.querySelector("#projectEditDialog")?.close();
      notify("Project updated", "success");
      await hydrate();
    }
    catch (error) {
      notify(error.message, "error");
    }
  });

  document.querySelectorAll("[data-delete-user]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!confirm("Remove this member and their assigned tasks?")) {
        return;
      }
      try {
        await api(`/api/users/${button.dataset.deleteUser}`, { method: "DELETE" });
        notify("Team member removed", "success");
        await hydrate();
      }
      catch (error) {
        notify(error.message, "error");
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

  document.querySelector("#memberForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api("/api/users", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(form))
      });
      notify("Team member added", "success");
      await hydrate();
    }
    catch (error) {
      notify(error.message, "error");
    }
  });
};

const updateTaskStatus = async (taskId, status) => {
  try {
    await api(`/api/tasks/${taskId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
    notify("Task status updated", "success");
    await hydrate();
  }
  catch (error) {
    notify(error.message, "error");
    await hydrate();
  }
};

if (state.token && state.user) {
  renderShell();
  hydrate();
}
else {
  renderAuth();
}
