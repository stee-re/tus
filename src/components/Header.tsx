import React from "react";

export default function Header({
  pages,
  active,
  onPageChange,
  columns,
  setColumns,
  editMode,
  setEditMode,
  dark,
  setDark,
  onExport,
}: any) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-semibold">Bookmarks</h1>

        {pages.length > 1 && (
          <select
            value={active}
            onChange={(e) => onPageChange(Number(e.target.value))}
            className="rounded border px-2 py-1 dark:bg-gray-900"
          >
            {pages.map((p: string, i: number) => (
              <option key={i} value={i}>
                {p}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex items-center gap-3">
        <select
          value={columns}
          onChange={(e) => setColumns(Number(e.target.value))}
          className="rounded border px-2 py-1 dark:bg-gray-900"
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>

        <button
          onClick={() => setDark(!dark)}
          className="rounded border px-3 py-1"
        >
          {dark ? "Light" : "Dark"}
        </button>

        <button
          onClick={() => setEditMode(!editMode)}
          className="rounded border px-3 py-1"
        >
          {editMode ? "Exit Edit" : "Edit"}
        </button>

        <button onClick={onExport} className="rounded border px-3 py-1">
          Export
        </button>
      </div>
    </header>
  );
}
