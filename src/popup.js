// popup.js — reads/writes settings to chrome.storage.sync.

const activeEl = document.getElementById("active");
const modeEl = document.getElementById("mode");
const typeEl = document.getElementById("type");
const strengthEl = document.getElementById("strength");
const strengthValEl = document.getElementById("strengthVal");
const shortcutsEl = document.getElementById("shortcuts");

const DEFAULTS = {
  active: false,
  type: "deuteranopia",
  strength: 1,
  mode: "hover",
};

function renderStrength(v) {
  strengthValEl.textContent = Math.round(v * 100) + "%";
}

// Load current settings into the UI.
chrome.storage.sync.get(DEFAULTS, function (items) {
  activeEl.checked = items.active;
  modeEl.value = items.mode;
  typeEl.value = items.type;
  strengthEl.value = items.strength;
  renderStrength(items.strength);
});

activeEl.addEventListener("change", function () {
  chrome.storage.sync.set({ active: activeEl.checked });
});

modeEl.addEventListener("change", function () {
  chrome.storage.sync.set({ mode: modeEl.value });
});

// chrome:// URLs can't be opened from an <a href>; use the tabs API.
shortcutsEl.addEventListener("click", function (e) {
  e.preventDefault();
  chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
});

typeEl.addEventListener("change", function () {
  chrome.storage.sync.set({ type: typeEl.value });
});

strengthEl.addEventListener("input", function () {
  const v = parseFloat(strengthEl.value);
  renderStrength(v);
  chrome.storage.sync.set({ strength: v });
});
