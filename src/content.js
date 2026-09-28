// content.js
// Applies the daltonization filter in one of three modes:
//   hover   - recolor the figure under the cursor (default)
//   figures - recolor every figure on the page at once
//   page    - recolor the entire page (text and all)

(function () {
  "use strict";

  const FILTER_SELECTOR = "img, canvas, svg, picture, figure";
  const MIN_AREA = 80 * 80; // skip tiny icons/sprites (px^2)
  const APPLIED_ATTR = "data-cbfh-applied";
  const PREV_FILTER_ATTR = "data-cbfh-prev-filter";
  const OUTLINE_CLASS = "cbfh-active-outline";

  const state = {
    active: false,
    type: "deuteranopia",
    strength: 1,
    mode: "hover",
  };

  let currentEl = null; // hover-mode: element we've applied the filter to
  let observer = null; // figures-mode: watches for new images
  let pageFiltered = false; // page-mode: filter applied to <html>

  // --- element-level apply/remove ----------------------------------------

  function isFigure(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.id === "cbfh-filter-defs") return false;
    if (!el.matches || !el.matches(FILTER_SELECTOR)) return false;
    const rect = el.getBoundingClientRect();
    return rect.width * rect.height >= MIN_AREA;
  }

  function applyFilter(el, withOutline) {
    if (!el || el.getAttribute(APPLIED_ATTR) === "1") return;
    el.setAttribute(PREV_FILTER_ATTR, el.style.filter || "");
    el.style.filter = window.CBFH.FILTER_URL;
    el.setAttribute(APPLIED_ATTR, "1");
    if (withOutline) el.classList.add(OUTLINE_CLASS);
  }

  function removeFilter(el) {
    if (!el || el.getAttribute(APPLIED_ATTR) !== "1") return;
    el.style.filter = el.getAttribute(PREV_FILTER_ATTR) || "";
    el.removeAttribute(PREV_FILTER_ATTR);
    el.removeAttribute(APPLIED_ATTR);
    el.classList.remove(OUTLINE_CLASS);
  }

  // --- hover mode ---------------------------------------------------------

  function resolveTarget(node) {
    if (!node || node.nodeType !== 1) return null;
    if (node.closest && node.closest("#cbfh-filter-defs")) return null;
    const el = node.closest(FILTER_SELECTOR);
    if (!el || !isFigure(el)) return null;
    return el;
  }

  function clearHover() {
    if (currentEl) {
      removeFilter(currentEl);
      currentEl = null;
    }
  }

  function onMouseOver(event) {
    if (!state.active || state.mode !== "hover") return;
    const el = resolveTarget(event.target);
    if (!el || el === currentEl) return;
    clearHover();
    applyFilter(el, true);
    currentEl = el;
  }

  function onMouseOut(event) {
    if (!currentEl) return;
    const related = event.relatedTarget;
    if (related && currentEl.contains(related)) return;
    clearHover();
  }

  // --- figures mode -------------------------------------------------------

  // A "leaf" figure has no filterable descendant. Applying only to leaves
  // avoids stacking the filter twice on nested wrappers like
  // <figure><img></figure> or <picture><img></picture>, which would compound
  // the color shift and make this mode look different from hover/page.
  function isLeafFigure(el) {
    return isFigure(el) && !el.querySelector(FILTER_SELECTOR);
  }

  function applyAllFigures(root) {
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll(FILTER_SELECTOR).forEach(function (el) {
      if (isLeafFigure(el)) applyFilter(el, false);
    });
  }

  function removeAllFigures() {
    document.querySelectorAll("[" + APPLIED_ATTR + "]").forEach(removeFilter);
  }

  function startFiguresObserver() {
    if (observer) return;
    observer = new MutationObserver(function (mutations) {
      for (const m of mutations) {
        m.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;
          if (isLeafFigure(node)) applyFilter(node, false);
          if (node.querySelectorAll) applyAllFigures(node);
        });
      }
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  function stopFiguresObserver() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  // --- page mode ----------------------------------------------------------

  function applyPage() {
    if (pageFiltered) return;
    const root = document.documentElement;
    root.setAttribute(PREV_FILTER_ATTR, root.style.filter || "");
    root.style.filter = window.CBFH.FILTER_URL;
    pageFiltered = true;
  }

  function removePage() {
    if (!pageFiltered) return;
    const root = document.documentElement;
    root.style.filter = root.getAttribute(PREV_FILTER_ATTR) || "";
    root.removeAttribute(PREV_FILTER_ATTR);
    pageFiltered = false;
  }

  // --- orchestration ------------------------------------------------------

  function teardown() {
    clearHover();
    removeAllFigures();
    stopFiguresObserver();
    removePage();
  }

  function setup() {
    window.CBFH.ensureFilters(state.type, state.strength);
    if (state.mode === "figures") {
      applyAllFigures(document);
      startFiguresObserver();
    } else if (state.mode === "page") {
      applyPage();
    }
    // hover mode needs no upfront work; it reacts to mouseover.
  }

  function applyState(next) {
    const prevActive = state.active;
    const prevMode = state.mode;

    if (typeof next.active === "boolean") state.active = next.active;
    if (typeof next.type === "string") state.type = next.type;
    if (typeof next.strength === "number") state.strength = next.strength;
    if (typeof next.mode === "string") state.mode = next.mode;

    // Live-update the matrix so type/strength changes take effect instantly.
    if (state.active) window.CBFH.ensureFilters(state.type, state.strength);

    const activeChanged = prevActive !== state.active;
    const modeChanged = prevMode !== state.mode;

    if (activeChanged || modeChanged) {
      teardown();
      if (state.active) setup();
    }
  }

  document.addEventListener("mouseover", onMouseOver, true);
  document.addEventListener("mouseout", onMouseOut, true);

  // --- state sync ---------------------------------------------------------

  const DEFAULTS = {
    active: false,
    type: "deuteranopia",
    strength: 1,
    mode: "hover",
  };

  if (chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.get(DEFAULTS, applyState);

    chrome.storage.onChanged.addListener(function (changes, area) {
      if (area !== "sync") return;
      const next = {};
      for (const key of Object.keys(DEFAULTS)) {
        if (changes[key]) next[key] = changes[key].newValue;
      }
      applyState(next);
    });
  }
})();
