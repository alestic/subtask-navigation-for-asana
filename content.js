// Subtask Navigation for Asana — Shift+Alt+Arrow to navigate the task tree
// [Created with AI: Claude Code with Opus 4.6]

(function () {
  'use strict';

  const CACHE_KEY = 'subtask-navigation-for-asana';
  const CACHE_TTL = 60000;
  const MAX_CACHE_ENTRIES = 20;

  // --- Toast ---

  let toastEl = null;
  let toastTimeout = null;

  function getToast() {
    if (toastEl) return toastEl;
    toastEl = document.createElement('div');
    toastEl.id = 'subtask-navigation-for-asana-toast';
    document.body.appendChild(toastEl);
    return toastEl;
  }

  function showToast(text, isBoundary) {
    const el = getToast();
    el.textContent = text;
    el.classList.toggle('boundary', !!isBoundary);
    el.classList.add('visible');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => el.classList.remove('visible'), 1200);
  }

  // --- URL ---

  function getTaskIdFromUrl() {
    const path = window.location.pathname;
    const taskMatch = path.match(/\/task\/(\d+)/);
    if (taskMatch) return taskMatch[1];
    const segments = path.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    if (/^\d+$/.test(last)) return last;
    return null;
  }

  // --- API ---

  async function fetchJson(url) {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`API ${resp.status}`);
    const json = await resp.json();
    return json.data;
  }

  // --- Cache ---

  let cache = loadCache();

  function loadCache() {
    try {
      const stored = JSON.parse(sessionStorage.getItem(CACHE_KEY));
      if (
        stored &&
        stored.childrenOf &&
        stored.lastVisited &&
        stored.parentOf
      ) {
        return stored;
      }
    } catch (err) {
      console.debug('Subtask Navigation for Asana: loadCache failed:', err);
    }
    return { childrenOf: {}, lastVisited: {}, parentOf: {} };
  }

  function saveCache() {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (err) {
      console.debug('Subtask Navigation for Asana: saveCache failed:', err);
    }
  }

  function evictOldestIfNeeded() {
    const keys = Object.keys(cache.childrenOf);
    if (keys.length <= MAX_CACHE_ENTRIES) return;
    let oldestKey = keys[0];
    let oldestTime = cache.childrenOf[oldestKey].fetchedAt;
    for (let i = 1; i < keys.length; i++) {
      const t = cache.childrenOf[keys[i]].fetchedAt;
      if (t < oldestTime) {
        oldestTime = t;
        oldestKey = keys[i];
      }
    }
    const evicted = cache.childrenOf[oldestKey];
    evicted.siblings.forEach((s) => {
      delete cache.parentOf[s.gid];
    });
    delete cache.childrenOf[oldestKey];
  }

  // --- Resolvers ---

  async function resolveParent(taskId) {
    const cached = cache.parentOf[taskId];
    if (cached) return cached;

    const task = await fetchJson(
      `/api/1.0/tasks/${taskId}?opt_fields=gid,parent`,
    );
    if (!task.parent) return null;

    cache.parentOf[taskId] = task.parent.gid;
    return task.parent.gid;
  }

  async function resolveChildren(parentGid) {
    const entry = cache.childrenOf[parentGid];
    if (entry && Date.now() - entry.fetchedAt < CACHE_TTL) {
      return entry.siblings;
    }

    const siblings = await fetchJson(
      `/api/1.0/tasks/${parentGid}/subtasks?opt_fields=name&limit=100`,
    );
    cache.childrenOf[parentGid] = { siblings, fetchedAt: Date.now() };
    evictOldestIfNeeded();
    siblings.forEach((s) => {
      cache.parentOf[s.gid] = parentGid;
    });
    return siblings;
  }

  function findIndex(siblings, taskId, parentGid) {
    // Fast path: O(1) check of stored index
    const lv = cache.lastVisited[parentGid];
    if (lv && lv.gid === taskId && siblings[lv.idx]?.gid === taskId) {
      return lv.idx;
    }
    // Slow path: linear scan
    return siblings.findIndex((s) => s.gid === taskId);
  }

  async function resolveParentAndSiblings(taskId) {
    let parentGid = await resolveParent(taskId);
    if (!parentGid) return null;

    let siblings = await resolveChildren(parentGid);
    let idx = findIndex(siblings, taskId, parentGid);

    if (idx === -1) {
      // Task not found — re-fetch parent and siblings (handles reparenting)
      const task = await fetchJson(
        `/api/1.0/tasks/${taskId}?opt_fields=gid,parent`,
      );
      if (!task.parent) return null;
      parentGid = task.parent.gid;
      cache.parentOf[taskId] = parentGid;

      delete cache.childrenOf[parentGid];
      siblings = await resolveChildren(parentGid);
      idx = siblings.findIndex((s) => s.gid === taskId);
    }

    return { parentGid, siblings, idx };
  }

  // --- SPA navigation via Asana's internal router ---

  function getNavigationService() {
    const link = document.querySelector('a.HiddenNavigationLink');
    if (!link) return null;
    const fiberKey = Object.keys(link).find((k) =>
      k.startsWith('__reactFiber$'),
    );
    if (!fiberKey) return null;
    let fiber = link[fiberKey];
    for (let i = 0; i < 10 && fiber; i++) {
      const nav = fiber.memoizedProps?.services?.navigation;
      if (nav?.requestChangeRoute) return nav;
      fiber = fiber.return;
    }
    return null;
  }

  function spaNavigate(targetTaskId) {
    const nav = getNavigationService();
    if (!nav) return false;
    let routed = false;
    nav.requestChangeRoute(function (currentRoute) {
      if (!currentRoute.child?.task) return currentRoute;
      routed = true;
      const newRoute = Object.assign({}, currentRoute);
      newRoute.child = Object.assign({}, currentRoute.child);
      newRoute.child.task = Object.assign({}, currentRoute.child.task);
      newRoute.child.task.id = targetTaskId;
      return newRoute;
    });
    return routed;
  }

  // --- Navigation handlers ---

  async function navigateSibling(direction) {
    const taskId = getTaskIdFromUrl();
    if (!taskId) return;

    const ctx = await resolveParentAndSiblings(taskId);
    if (!ctx) {
      showToast('No parent task', true);
      return;
    }
    if (ctx.idx === -1) {
      showToast(
        ctx.siblings.length === 100
          ? 'Too many siblings (100+)'
          : 'Task not found in siblings',
        true,
      );
      return;
    }

    const newIdx = ctx.idx + direction;
    if (newIdx < 0 || newIdx >= ctx.siblings.length) {
      const label = direction < 0 ? 'First' : 'Last';
      showToast(
        `${label} task \u00b7 ${ctx.idx + 1} / ${ctx.siblings.length}`,
        true,
      );
      return;
    }

    const target = ctx.siblings[newIdx];
    if (!spaNavigate(target.gid)) {
      showToast('Navigation unavailable', true);
      return;
    }
    cache.lastVisited[ctx.parentGid] = { gid: target.gid, idx: newIdx };
    saveCache();
    showToast(`${newIdx + 1} / ${ctx.siblings.length}`, false);
  }

  async function navigateToEdge(end) {
    const taskId = getTaskIdFromUrl();
    if (!taskId) return;

    const ctx = await resolveParentAndSiblings(taskId);
    if (!ctx) {
      showToast('No parent task', true);
      return;
    }
    if (ctx.idx === -1) {
      showToast(
        ctx.siblings.length === 100
          ? 'Too many siblings (100+)'
          : 'Task not found in siblings',
        true,
      );
      return;
    }

    const newIdx = end ? ctx.siblings.length - 1 : 0;
    if (newIdx === ctx.idx) {
      const label = end ? 'Last' : 'First';
      showToast(
        `${label} task \u00b7 ${ctx.idx + 1} / ${ctx.siblings.length}`,
        true,
      );
      return;
    }

    const target = ctx.siblings[newIdx];
    if (!spaNavigate(target.gid)) {
      showToast('Navigation unavailable', true);
      return;
    }
    cache.lastVisited[ctx.parentGid] = { gid: target.gid, idx: newIdx };
    saveCache();
    showToast(`${newIdx + 1} / ${ctx.siblings.length}`, false);
  }

  async function navigateToParent() {
    const taskId = getTaskIdFromUrl();
    if (!taskId) return;

    const ctx = await resolveParentAndSiblings(taskId);
    if (!ctx) {
      showToast('No parent task', true);
      return;
    }

    // Remember current position before leaving
    if (!spaNavigate(ctx.parentGid)) {
      showToast('Navigation unavailable', true);
      return;
    }
    if (ctx.idx !== -1) {
      cache.lastVisited[ctx.parentGid] = { gid: taskId, idx: ctx.idx };
      saveCache();
    }
    showToast('\u2190 Parent', false);
  }

  async function navigateToSubtask() {
    const taskId = getTaskIdFromUrl();
    if (!taskId) return;

    const subtasks = await resolveChildren(taskId);
    if (subtasks.length === 0) {
      showToast('No subtasks', true);
      return;
    }

    // Find last-visited subtask, or use first
    let targetIdx = 0;
    const lv = cache.lastVisited[taskId];
    if (lv) {
      if (subtasks[lv.idx]?.gid === lv.gid) {
        targetIdx = lv.idx;
      } else {
        const found = subtasks.findIndex((s) => s.gid === lv.gid);
        if (found !== -1) targetIdx = found;
      }
    }

    const target = subtasks[targetIdx];
    if (!spaNavigate(target.gid)) {
      showToast('Navigation unavailable', true);
      return;
    }
    cache.lastVisited[taskId] = { gid: target.gid, idx: targetIdx };
    saveCache();
    showToast(`\u2192 ${targetIdx + 1} / ${subtasks.length}`, false);
  }

  // --- Main dispatcher ---

  let navigating = false;

  async function navigate(handler) {
    if (navigating) return;
    navigating = true;
    try {
      await handler();
    } catch (err) {
      console.error('Subtask Navigation for Asana:', err);
      if (err.message === 'API 404') {
        showToast('Not a task', true);
      } else {
        showToast('Error — see console', true);
      }
    } finally {
      navigating = false;
    }
  }

  document.addEventListener(
    'keydown',
    (e) => {
      if (!e.altKey || !e.shiftKey || e.ctrlKey || e.metaKey) return;

      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable)
        return;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigate(() => navigateSibling(-1));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        navigate(() => navigateSibling(1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigate(navigateToParent);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigate(navigateToSubtask);
      } else if (e.key === 'Home') {
        e.preventDefault();
        navigate(() => navigateToEdge(false));
      } else if (e.key === 'End') {
        e.preventDefault();
        navigate(() => navigateToEdge(true));
      }
    },
    true,
  );
})();
