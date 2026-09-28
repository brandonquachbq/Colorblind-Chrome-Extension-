# Daltonize

A Chrome extension that recolors academic-journal figures to make confusable
color pairs distinguishable for readers with color vision deficiency
(deuteranopia, protanopia, tritanopia).

## How it works

Hovering over a figure applies **daltonization** — a single per-pixel color
matrix (SVG `feColorMatrix`) referenced via CSS `filter`. Daltonization
redistributes the red/green information a colorblind viewer can't perceive into
channels they can. It runs live in the browser with no screen capture and reads
no pixels, so it needs only the `storage` permission and works on cross-origin
images.

## Install (unpacked)

1. Open `chrome://extensions`.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked** and select this folder.

## Use

1. Click the toolbar icon and toggle **Enable** on (or press
   <kbd>⌘</kbd>+<kbd>Shift</kbd>+<kbd>9</kbd> on Mac).
2. Pick a **Mode**:
   - **Hover a figure** — recolor the figure under the cursor (shows a blue outline).
   - **All figures** — recolor every figure on the page at once.
   - **Whole page** — recolor the entire page, text and all.
3. Switch deficiency type and adjust correction strength as needed.

Settings persist via `chrome.storage.sync`.

### Keyboard shortcut on Mac

The default is <kbd>⌘</kbd>+<kbd>Shift</kbd>+<kbd>9</kbd> (it avoids the Option
key, which on macOS often types a special character instead of triggering the
command). If another app or extension has claimed it, set your own at
`chrome://extensions/shortcuts` — there's a link in the popup. The toolbar
popup toggle always works regardless of the shortcut.

## Files

| File | Purpose |
|---|---|
| `manifest.json` | MV3 manifest (content script, popup, keyboard command) |
| `src/filters.js` | Daltonization matrices + SVG filter injection |
| `src/content.js` | Hover detection, apply/remove filter |
| `src/content.css` | Hover outline |
| `src/popup.html/.js` | On/off, deficiency type, strength |
| `src/background.js` | Defaults + keyboard-toggle handler |

## Known limits

- No small lens circle (a true magnifier lens would require screen capture);
  the modes recolor whole figures or the whole page instead.
- No semantic remap to a categorical palette (e.g. seaborn `colorblind`) — that
  needs image segmentation, not a live filter.
- **Whole page** mode applies a CSS filter to the root element, which can make
  some `position: fixed` headers scroll with the page on certain sites. Switch
  to **All figures** if that bothers you on a given site.
