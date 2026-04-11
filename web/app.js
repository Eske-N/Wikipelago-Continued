const APP_VERSION = "2026.03.26.2";
console.log("Wikipelago web version", APP_VERSION);

const SCROLL_SPEED_FACTORS = [0.18, 0.28, 0.42, 0.6, 0.8, 1];

const state = {
  sessionId: localStorage.getItem("wikipelago_session_id") || "",
  status: null,
  currentTitle: "",
  baseArticleHtml: "",
  clicksUsed: 0,
  announcedGoalComplete: false,
  restoringArticle: false,
  searchOpen: false,
};

const el = {
  connBadge: document.getElementById("connBadge"),
  articleTitle: document.getElementById("articleTitle"),
  articleBody: document.getElementById("articleBody"),
  searchOverlay: document.getElementById("searchOverlay"),
  pageSearchInput: document.getElementById("pageSearchInput"),
  closeSearchBtn: document.getElementById("closeSearchBtn"),
  searchStatus: document.getElementById("searchStatus"),
  searchLetters: document.getElementById("searchLetters"),
  serverInput: document.getElementById("serverInput"),
  slotInput: document.getElementById("slotInput"),
  passwordInput: document.getElementById("passwordInput"),
  connectBtn: document.getElementById("connectBtn"),
  roundText: document.getElementById("roundText"),
  targetText: document.getElementById("targetText"),
  goalText: document.getElementById("goalText"),
  clicksText: document.getElementById("clicksText"),
  fragmentsText: document.getElementById("fragmentsText"),
  compassHint: document.getElementById("compassHint"),
  roundProgress: document.getElementById("roundProgress"),
  backItem: document.getElementById("backItem"),
  searchItem: document.getElementById("searchItem"),
  searchLettersItem: document.getElementById("searchLettersItem"),
  scrollItem: document.getElementById("scrollItem"),
  compassItem: document.getElementById("compassItem"),
  toast: document.getElementById("toast"),
};

el.serverInput.value = "archipelago.gg:";
el.slotInput.value = "WikiTester";

function toast(text, kind = "ok") {
  el.toast.textContent = text;
  el.toast.className = `toast ${kind}`;
  setTimeout(() => { el.toast.className = "toast hidden"; }, 2200);
}

function normalizeTitle(title) {
  return String(title || "").replace(/_/g, " ").trim().replace(/\s+/g, " ").toLowerCase();
}

function ownedSearchLetters() {
  return new Set((state.status?.search_letters || []).map((letter) => String(letter).toUpperCase()));
}

function canUseSearch() {
  if (!state.status?.ctrl_f_unlocked) return false;
  return true;
}

function sanitizeSearchInput(raw) {
  const letters = ownedSearchLetters();
  let output = "";
  for (const ch of String(raw || "")) {
    const upper = ch.toUpperCase();
    if (/[A-Z]/.test(upper)) {
      if (!state.status?.searchsanity || letters.has(upper)) {
        output += ch;
      }
    } else {
      output += ch;
    }
  }
  return output;
}

function renderSearchStatus() {
  const letters = [...ownedSearchLetters()].sort();
  el.searchLetters.textContent = `Letters: ${letters.length ? letters.join("") : "-"}`;
  el.searchLettersItem.textContent = letters.length ? `${letters.length}/26` : (state.status?.searchsanity ? "0/26" : "Free");

  if (!state.status?.ctrl_f_unlocked) {
    el.searchStatus.textContent = "Ctrl+F Lens required";
  } else if (state.status?.searchsanity) {
    el.searchStatus.textContent = "Letter-limited search";
  } else {
    el.searchStatus.textContent = "Search ready";
  }
}

function scrollLevel() {
  return Math.max(0, Math.min(state.status?.scroll_speed_level || 0, state.status?.scroll_speed_upgrades || 5));
}

function scrollFactor() {
  const level = Math.max(0, Math.min(scrollLevel(), SCROLL_SPEED_FACTORS.length - 1));
  return state.status?.scrollsanity ? SCROLL_SPEED_FACTORS[level] : 1;
}

function closeSearchOverlay() {
  state.searchOpen = false;
  el.searchOverlay.classList.add("hidden");
}

function openSearchOverlay() {
  if (!canUseSearch()) {
    if (!state.status?.ctrl_f_unlocked) toast("Ctrl+F Lens is locked", "warn");
    else toast("Search is locked", "warn");
    return;
  }
  state.searchOpen = true;
  el.searchOverlay.classList.remove("hidden");
  renderSearchStatus();
  el.pageSearchInput.focus();
  el.pageSearchInput.select();
}

function clearSearchHighlights() {
  if (state.baseArticleHtml) {
    el.articleBody.innerHTML = state.baseArticleHtml;
  }
}

function applySearchHighlights(query) {
  clearSearchHighlights();
  rewriteLinks(el.articleBody);
  if (!query) return 0;

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, "ig");
  const walker = document.createTreeWalker(el.articleBody, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) {
    if (node.parentElement && node.parentElement.closest("mark")) continue;
    textNodes.push(node);
  }

  let count = 0;
  for (const textNode of textNodes) {
    const text = textNode.nodeValue;
    if (!text || !regex.test(text)) continue;
    regex.lastIndex = 0;

    const frag = document.createDocumentFragment();
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      }
      const mark = document.createElement("mark");
      mark.className = "wiki-search-hit";
      mark.textContent = match[0];
      frag.appendChild(mark);
      lastIndex = match.index + match[0].length;
      count += 1;
    }
    if (lastIndex < text.length) {
      frag.appendChild(document.createTextNode(text.slice(lastIndex)));
    }
    textNode.parentNode.replaceChild(frag, textNode);
  }

  const firstHit = el.articleBody.querySelector(".wiki-search-hit");
  if (firstHit) firstHit.scrollIntoView({ block: "center" });
  return count;
}

function storageKey(suffix) {
  return `wikipelago_${suffix}_${state.sessionId || "pending"}`;
}

function saveLocalProgress() {
  if (!state.sessionId) return;
  if (state.currentTitle) localStorage.setItem(storageKey("last_title"), state.currentTitle);
  localStorage.setItem(storageKey("clicks"), String(state.clicksUsed || 0));
}

function loadSavedTitle() {
  if (!state.sessionId) return "";
  return localStorage.getItem(storageKey("last_title")) || "";
}

function loadSavedClicks() {
  if (!state.sessionId) return 0;
  const raw = localStorage.getItem(storageKey("clicks")) || "0";
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function preferredResumeTitle() {
  const hashTitle = decodeURIComponent((window.location.hash || "").replace(/^#/, "")).trim();
  if (hashTitle) return hashTitle;
  if (state.status?.last_page) return state.status.last_page;
  const savedTitle = loadSavedTitle();
  if (savedTitle) return savedTitle;
  if (state.status?.current_start) return state.status.current_start;
  return "Wikipedia";
}

async function api(path, method = "GET", body = null, retryOnInvalidSession = true) {
  const options = { method, headers: { "Content-Type": "application/json" } };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(path, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    const errText = data.error || `HTTP ${res.status}`;
    if (retryOnInvalidSession && String(errText).toLowerCase() === "invalid session") {
      state.sessionId = "";
      localStorage.removeItem("wikipelago_session_id");
      await ensureSession();
      const fixedPath = path.replace(/\/api\/session\/[^/]+/, `/api/session/${state.sessionId}`);
      return api(fixedPath, method, body, false);
    }
    throw new Error(errText);
  }
  return data;
}

async function ensureSession() {
  if (state.sessionId) return;
  const data = await api("/api/session", "POST", {});
  state.sessionId = data.session_id;
  localStorage.setItem("wikipelago_session_id", state.sessionId);
  state.clicksUsed = loadSavedClicks();
}

function updateHUD(status) {
  const wasComplete = state.status?.boss_completed === true;
  state.status = status;
  state.clicksUsed = Number.isFinite(status.clicks_used) ? status.clicks_used : state.clicksUsed;
  el.connBadge.textContent = status.connected_to_ap ? "Connected" : "Offline";
  el.connBadge.className = status.connected_to_ap ? "badge online" : "badge offline";

  if (status.boss_completed) {
    el.roundText.textContent = "COMPLETE";
    el.targetText.textContent = "GOAL COMPLETE";
    el.goalText.textContent = `${status.goal_article || "..."} (Complete)`;
  } else {
    el.roundText.textContent = `${status.round}/${status.check_count}`;
    el.targetText.textContent = status.current_target || "...";
    el.goalText.textContent = status.goal_article || "...";
  }

  el.clicksText.textContent = String(state.clicksUsed);
  el.fragmentsText.textContent = `${status.fragments}/${status.required_fragments}`;
  el.compassHint.textContent = status.compass_unlocked ? (status.warmer_colder || "Calibrating") : "Locked";
  el.roundProgress.style.width = `${Math.max(0, Math.min(100, (status.round / Math.max(status.check_count, 1)) * 100))}%`;
  el.backItem.textContent = status.back_button_unlocked ? "Unlocked" : "Locked";
  el.searchItem.textContent = status.ctrl_f_unlocked ? "Unlocked" : "Locked";
  renderSearchStatus();
  if (status.scrollsanity) {
    el.scrollItem.textContent = `${status.scroll_speed_level}/${status.scroll_speed_upgrades}`;
  } else {
    el.scrollItem.textContent = "Off";
  }
  el.compassItem.textContent = status.compass_unlocked ? "Unlocked" : "Locked";

  if (status.boss_completed && !wasComplete && !state.announcedGoalComplete) {
    toast("GOAL COMPLETE! Seed finished.", "ok");
    state.announcedGoalComplete = true;
  }
  if (status.last_error) toast(status.last_error, "warn");
  saveLocalProgress();
}

async function pollStatus() {
  try {
    await ensureSession();
    const data = await api(`/api/session/${state.sessionId}/status`);
    updateHUD(data.status);
    if (!state.searchOpen) closeSearchOverlay();
  } catch {
    el.connBadge.textContent = "Offline";
    el.connBadge.className = "badge offline";
  }
}

function sanitizeHtml(root) {
  root.querySelectorAll("script,style,noscript,.reference,.mw-editsection").forEach((n) => n.remove());
}

function rewriteLinks(root) {
  root.querySelectorAll("a").forEach((a) => {
    const href = a.getAttribute("href") || "";
    if (!href.startsWith("/wiki/")) return;
    const wikiPart = href.replace("/wiki/", "");
    if (!wikiPart) return;
    const title = decodeURIComponent(wikiPart).replace(/_/g, " ");
    const ns = title.split(":", 1)[0].toLowerCase();
    const blockedNamespaces = new Set(["file", "category", "help", "template", "special", "portal", "talk", "user", "wikipedia", "module", "book", "draft", "mediawiki"]);
    if (title.includes(":") && blockedNamespaces.has(ns)) return;
    a.dataset.title = title;
    a.href = "#";
  });
}

async function fetchWikiHtml(title) {
  const url = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=text&formatversion=2&format=json&origin=*`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.parse || !data.parse.text) throw new Error("Article unavailable");
  return data.parse.text;
}

async function openArticle(title, options = {}) {
  if (!title) return;
  const { countAsClick = false, replaceHistory = false } = options;

  try {
    const html = await fetchWikiHtml(title);
    state.currentTitle = title;
    el.articleTitle.textContent = title;
    el.articleBody.innerHTML = html;
    sanitizeHtml(el.articleBody);
    rewriteLinks(el.articleBody);
    state.baseArticleHtml = el.articleBody.innerHTML;
    if (state.searchOpen && el.pageSearchInput.value) {
      const sanitized = sanitizeSearchInput(el.pageSearchInput.value);
      if (sanitized !== el.pageSearchInput.value) el.pageSearchInput.value = sanitized;
      applySearchHighlights(sanitized);
    }

    if (countAsClick) state.clicksUsed += 1;
    el.clicksText.textContent = String(state.clicksUsed);
    saveLocalProgress();

    await ensureSession();
    const result = await api(`/api/session/${state.sessionId}/check`, "POST", {
      page_title: title,
      clicks_used: state.clicksUsed,
    });

    if (result.matched) toast("Target hit: " + result.target, "ok");
    if (result.locked) toast("Round locked. Find Round Access items.", "warn");
    if (result.status) updateHUD(result.status);

    if (replaceHistory) {
      history.replaceState({ title }, "", `#${encodeURIComponent(title)}`);
    } else {
      history.pushState({ title }, "", `#${encodeURIComponent(title)}`);
    }
  } catch {
    toast(`Could not open article: ${title}`, "warn");
  }
}

async function restoreArticleView(force = false) {
  if (!state.status) return;
  const desiredTitle = preferredResumeTitle();
  if (!desiredTitle) return;
  if (!force && normalizeTitle(desiredTitle) === normalizeTitle(state.currentTitle)) return;
  if (state.restoringArticle) return;
  state.restoringArticle = true;
  try {
    await openArticle(desiredTitle, { countAsClick: false, replaceHistory: true });
  } finally {
    state.restoringArticle = false;
  }
}

el.articleBody.addEventListener("click", (e) => {
  const a = e.target.closest("a[data-title]");
  if (!a) return;
  e.preventDefault();
  openArticle(a.dataset.title, { countAsClick: true });
});

el.articleBody.addEventListener("wheel", (e) => {
  if (!state.status?.scrollsanity) return;
  e.preventDefault();
  el.articleBody.scrollTop += e.deltaY * scrollFactor();
}, { passive: false });

el.connectBtn.addEventListener("click", async () => {
  try {
    await ensureSession();
    await api(`/api/session/${state.sessionId}/connect`, "POST", {
      server: el.serverInput.value.trim(),
      slot_name: el.slotInput.value.trim(),
      password: el.passwordInput.value,
    });
    toast("Connecting to Archipelago...", "ok");
    await pollStatus();
    await restoreArticleView(true);
  } catch (err) {
    toast(err.message || "Connect failed", "warn");
  }
});

el.closeSearchBtn.addEventListener("click", () => {
  el.pageSearchInput.value = "";
  clearSearchHighlights();
  closeSearchOverlay();
});

el.pageSearchInput.addEventListener("input", () => {
  const sanitized = sanitizeSearchInput(el.pageSearchInput.value);
  if (sanitized !== el.pageSearchInput.value) {
    const pos = sanitized.length;
    el.pageSearchInput.value = sanitized;
    el.pageSearchInput.setSelectionRange(pos, pos);
  }
  const hits = applySearchHighlights(el.pageSearchInput.value.trim());
  renderSearchStatus();
  if (el.pageSearchInput.value.trim()) {
    el.searchStatus.textContent = `${hits} match${hits === 1 ? "" : "es"}`;
  }
});

document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
    e.preventDefault();
    if (state.searchOpen) {
      el.pageSearchInput.focus();
      el.pageSearchInput.select();
    } else {
      openSearchOverlay();
    }
  }
  if (e.altKey && e.key === "ArrowLeft") {
    if (state.status && !state.status.back_button_unlocked) {
      e.preventDefault();
      toast("Back Button is locked", "warn");
    }
  }
  if (e.key === "Backspace") {
    const typing = ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName);
    if (!typing && state.status && !state.status.back_button_unlocked) {
      e.preventDefault();
      toast("Back Button is locked", "warn");
    }
  }
  if (e.key === "Escape" && state.searchOpen) {
    e.preventDefault();
    closeSearchOverlay();
  }
  if (state.status?.scrollsanity && !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) {
    const factor = scrollFactor();
    const keyToAmount = {
      ArrowDown: 40,
      ArrowUp: -40,
      PageDown: 320,
      PageUp: -320,
      Home: -1_000_000,
      End: 1_000_000,
      " ": e.shiftKey ? -320 : 320,
    };
    if (Object.prototype.hasOwnProperty.call(keyToAmount, e.key)) {
      e.preventDefault();
      const amount = keyToAmount[e.key];
      if (e.key === "Home") {
        el.articleBody.scrollTop = 0;
      } else if (e.key === "End") {
        el.articleBody.scrollTop = el.articleBody.scrollHeight;
      } else {
        el.articleBody.scrollTop += amount * factor;
      }
    }
  }
});

window.addEventListener("popstate", (e) => {
  if (state.status && !state.status.back_button_unlocked) {
    history.pushState({ title: state.currentTitle }, "", `#${encodeURIComponent(state.currentTitle)}`);
    toast("Back Button is locked", "warn");
    return;
  }
  const title = e.state?.title;
  if (title) openArticle(title, { countAsClick: false });
});

setInterval(pollStatus, 1500);

(async () => {
  await ensureSession();
  await pollStatus();
  await restoreArticleView(true);
})();
