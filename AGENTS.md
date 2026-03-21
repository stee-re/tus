# Bookmark Startpage — AGENTS.md

This document defines architectural decisions, design principles, and feature direction
for the Bookmark Startpage project.

This file is authoritative for future development decisions.

---

# 1. Project Vision

A fast, minimal, privacy-first bookmark start page.

Goals:

- Used as browser homepage and/or new-tab page.
- Fully client-side.
- No server.
- No telemetry.
- No external storage.
- All bookmark data stored locally (localStorage).
- Deployable to GitHub Pages.
- Simple, distraction-free, extremely fast to navigate.

The primary objective is **speed of access** and **low friction**.

---

# 2. Tech Stack (Locked In)

- Vite
- React (latest)
- TypeScript
- Tailwind CSS v4
- No PostCSS
- Dark mode via `class` strategy
- localStorage persistence

We do NOT use:

- Redux
- Zustand
- Server APIs
- Backend storage
- Docker
- Self-hosted services

This must remain a purely static web app.

---

# 3. Data Model (Source of Truth)

All data lives in localStorage.

Storage key:

```
bookmark-startpage:data
```

Theme key:

```
bookmark-startpage:theme
```

## Data Shape

```ts
type Bookmark = {
  type: "bookmark";
  title: string;
  url: string;
  icon?: string; // optional custom icon identifier
};

type Group = {
  type: "group";
  title: string;
  bookmarks: Array<Bookmark>;
};

type Page = {
  title: string;
  groups: Group[];
};

type Data = {
  pages: Page[];
};
```

Notes:

- Order is defined strictly by array order.
- No IDs.
- No metadata.
- No timestamps.
- Keep it minimal.

---

# 4. Import / Export

## Browser HTML Import

- Accept Chrome & Firefox exported bookmarks HTML.
- Parse `<DL><DT><H3>` nested structure and flatten it into page-level groups.
- Preserve order.
- Folder paths may be reflected in group titles.
- Empty folders must remain visible.

## JSON Export

- Export full `Data` object.
- Pretty formatted.
- Download as `bookmarks.json`.

## JSON Import (Required)

- Add button to import JSON.
- Must support:
  - Overwrite all pages
  - Merge into current page
  - Create new page

Invalid JSON should show friendly error message.

---

# 5. UI Architecture

## Layout

- Grid of cards.
- Cards contain clickable tiles which are bookmarks
- Column count configurable.
- Responsive.
- No collapsing groups (initially).

## Search

- Search input auto-focus on page load.
- `Ctrl/Cmd + F` focuses search.
- If exactly 1 match:
  - `Enter` → open in current tab
  - `Ctrl/Cmd + Enter` → open in new tab

Search matches:

- title

Search is simple includes-based (fuzzy search can be added later).
Search does not use autocomplete or a dropdown list
When the search box is empty, all bookmarks are displayed
Search filters the tiles/groups displayed
If all tiles in a group are filtered out, the group is also hidden
The "Esc" key, clears the search box

---

# 6. Global Controls (Kebab Menu)

All global controls must be behind a kebab icon in header.

Menu contains:

- Edit Mode toggle
- Import/Export JSON
- Import Browser Bookmarks
- Dark/Light mode toggle

No clutter in header.

---

# 7. Edit Mode (High Priority)

When edit mode is enabled:

- Page selectors and buttons are hidden
- Title becomes page title (with edit & delete button beside it)

For:

- Pages
- Groups
- Bookmarks

All must show:

- 🗑 Delete icon
- ✏ Rename icon

Additionally:

- Column selector only visible in Edit mode
- Icon selector only visible in Edit mode

Edit mode must feel lightweight and not cluttered.

---

# 8. Drag and Drop

In Edit mode:

It must be possible to drag and drop:

- Groups
- Bookmarks
- Move bookmarks between groups
- Reorder everything
- Clear visual indicators for drop zones

Recommended library:

@dnd-kit

Reason:

- Modern
- Lightweight
- Actively maintained

Drag-and-drop should preserve structure and update arrays immutably.

---

# 9. Icon Strategy

Google favicon service is used by default:

https://www.google.com/s2/favicons?domain=HOSTNAME&sz=32

However, many sites fail to resolve.

We must support custom icons.

Bookmark type:

icon?: string

If icon is present:

- Render custom icon
- Do NOT fetch favicon

## Icon Source Strategy

Use one of:

- FontAwesome (preferred for breadth)
- Or Iconify
- Or Lucide + additional icon pack

Important:

- Large icon pool
- No API calls required
- Fully client-side

Icon selector must appear in Edit mode.

---

# 11. Performance Principles

This app must:

- Load instantly
- Render immediately
- Avoid unnecessary re-renders
- Avoid heavy state libraries
- Avoid large UI frameworks

It must feel faster than native bookmark UI.

---

# 12. Design Principles

- Minimal
- Clean
- Functional
- No unnecessary animations
- No visual noise
- Focus on usability

When in doubt:  
Choose simplicity.

---

# 13. Things We Explicitly Avoid

- Cloud sync
- Accounts
- Analytics
- Telemetry
- Backend APIs
- Complex theming systems (for now)
- Over-engineering

---

# 14. Future Enhancements (Optional)

- Fuzzy search ranking
- Keyboard navigation
- Quick-add bookmark
- Theme packs
- Import from URL list
- Export as static standalone HTML

These are optional and secondary.

---

# 15. Development Notes

- Use structuredClone for immutability.
- Keep components small.
- Avoid prop drilling explosion (consider provider/context where needed).
- Avoid premature abstraction.

---

# 16. Guiding Priority Order

1. Solid editing capabilities
2. Drag-and-drop
3. Icon customization
4. JSON import/export polish
5. UX refinement

Search and speed must never regress.
