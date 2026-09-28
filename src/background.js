// background.js — service worker.
// Sets sane defaults on install and handles the keyboard toggle command.

chrome.runtime.onInstalled.addListener(function () {
  chrome.storage.sync.get(
    { active: false, type: "deuteranopia", strength: 1 },
    function (items) {
      // Re-write to persist defaults for any keys not yet set.
      chrome.storage.sync.set(items);
    }
  );
});

chrome.commands.onCommand.addListener(function (command) {
  if (command !== "toggle-active") return;
  chrome.storage.sync.get({ active: false }, function (items) {
    chrome.storage.sync.set({ active: !items.active });
  });
});
