(function () {
  const projects = Array.isArray(window.HTML_APPS_PROJECTS) ? window.HTML_APPS_PROJECTS.slice() : [];
  const searchInput = document.getElementById("search-input");
  const grid = document.getElementById("project-grid");
  const filterBar = document.getElementById("filter-bar");
  const resultsSummary = document.getElementById("results-summary");

  const counts = {
    launchable: document.getElementById("launchable-count"),
    server: document.getElementById("server-count"),
    added: document.getElementById("new-count"),
    categories: document.getElementById("category-count")
  };

  let activeFilter = "All";

  function getFilters() {
    const categoryFilters = Array.from(new Set(projects.map((project) => project.category))).sort();
    return ["All", "Existing", "New"].concat(categoryFilters);
  }

  function updateMetrics() {
    const categories = new Set(projects.map((project) => project.category));
    counts.launchable.textContent = String(projects.filter((project) => project.mode === "file").length);
    counts.server.textContent = String(projects.filter((project) => project.mode === "server").length);
    counts.added.textContent = String(projects.filter((project) => project.collection === "new").length);
    counts.categories.textContent = String(categories.size);
  }

  function createFilterButtons() {
    filterBar.replaceChildren();
    getFilters().forEach((label) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `filter-chip${label === activeFilter ? " is-active" : ""}`;
      button.textContent = label;
      button.addEventListener("click", function () {
        activeFilter = label;
        createFilterButtons();
        render();
      });
      filterBar.appendChild(button);
    });
  }

  function matchesFilter(project) {
    if (activeFilter === "All") {
      return true;
    }

    if (activeFilter === "Existing" || activeFilter === "New") {
      return project.collection === activeFilter.toLowerCase();
    }

    return project.category === activeFilter;
  }

  function matchesSearch(project, query) {
    if (!query) {
      return true;
    }

    const haystack = [
      project.name,
      project.folder,
      project.summary,
      project.note,
      project.category,
      (project.tags || []).join(" ")
    ].join(" ").toLowerCase();

    return haystack.includes(query);
  }

  const isHttp = /^https?:$/.test(window.location.protocol);

  function resolveHref(path) {
    return new URL(path, window.location.href).toString();
  }

  function parentPath(path) {
    const trimmed = path.replace(/[?#].*$/, "");
    const idx = trimmed.lastIndexOf("/");
    return idx >= 0 ? trimmed.slice(0, idx + 1) : trimmed;
  }

  function isCrossDrive(project) {
    return typeof project.path === "string" && project.path.startsWith("../");
  }

  function makeTag(text) {
    const span = document.createElement("span");
    span.className = "meta-tag";
    span.textContent = text;
    return span;
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function renderCard(project) {
    const locked = isHttp && isCrossDrive(project);
    const needsServer = project.mode === "server";
    const launchable = !locked && !needsServer;

    let statusClass;
    let statusLabel;
    if (locked) {
      statusClass = "pill pill-locked";
      statusLabel = "file:// only";
    } else if (project.collection === "new") {
      statusClass = "pill pill-new";
      statusLabel = "New App";
    } else if (needsServer) {
      statusClass = "pill pill-server";
      statusLabel = "Needs HTTP";
    } else {
      statusClass = "pill pill-ready";
      statusLabel = "Launchable";
    }

    const article = el("article", "project-card");

    const head = el("div", "project-head");
    const headLeft = document.createElement("div");
    headLeft.appendChild(el("h3", null, project.name));
    headLeft.appendChild(el("div", "project-folder", project.folder));
    head.appendChild(headLeft);
    head.appendChild(el("span", statusClass, statusLabel));
    article.appendChild(head);

    article.appendChild(el("p", "project-summary", project.summary));

    const tagRow = el("div", "meta-row");
    [project.category].concat(project.tags || []).slice(0, 4).forEach((tag) => {
      tagRow.appendChild(makeTag(tag));
    });
    article.appendChild(tagRow);

    const noteText = locked
      ? `${project.note} Open the hub from file:// to launch this app, or use Open Containing Folder.`
      : project.note;
    article.appendChild(el("div", "project-note", noteText));

    const actions = el("div", "project-actions");

    let primary;
    if (launchable) {
      primary = el("a", "project-link project-link-primary", "Open App");
      primary.href = resolveHref(project.path);
    } else {
      primary = el("span", "project-link project-link-primary project-link-disabled",
        needsServer ? "Use Local Server" : "Open App");
      primary.setAttribute("aria-disabled", "true");
      primary.title = needsServer
        ? "Run serve-html-apps.ps1 -Open and reload the hub over http://localhost:8080"
        : "This app lives outside C:\\HTML apps and can only be launched when the hub is opened from the file system.";
    }
    actions.appendChild(primary);

    const folderHref = resolveHref(parentPath(project.path));
    let secondary;
    if (locked) {
      secondary = el("span", "project-link project-link-secondary project-link-disabled", "Open Containing Folder");
      secondary.setAttribute("aria-disabled", "true");
    } else {
      secondary = el("a", "project-link project-link-secondary", "Open Containing Folder");
      secondary.href = folderHref;
    }
    actions.appendChild(secondary);

    article.appendChild(actions);
    return article;
  }

  function render() {
    const query = (searchInput.value || "").trim().toLowerCase();
    const visible = projects.filter((project) => matchesFilter(project) && matchesSearch(project, query));

    grid.replaceChildren();

    if (!visible.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "No projects match the current search and filter.";
      grid.appendChild(empty);
    } else {
      visible.forEach((project) => grid.appendChild(renderCard(project)));
    }

    resultsSummary.textContent = `${visible.length} project${visible.length === 1 ? "" : "s"} shown`;
  }

  updateMetrics();
  createFilterButtons();
  render();

  searchInput.addEventListener("input", render);
})();
