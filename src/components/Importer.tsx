import React from "react";
import { parseBookmarksHtml } from "../parser";
import type { Page } from "../App";

type Props = {
  onImport: (page: Page, mode: "overwrite" | "merge" | "new") => void;
};

const Importer: React.FC<Props> = ({ onImport }) => {
  const fileRef = React.useRef<HTMLInputElement | null>(null);
  const [option, setOption] = React.useState<"overwrite" | "merge" | "new">(
    "new",
  );
  const [name, setName] = React.useState("Imported");

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    try {
      const txt = await f.text();
      const parsed = parseBookmarksHtml(txt);
      const page: Page = {
        title: name || parsed.title || "Imported",
        groups: parsed.groups,
      };
      onImport(page, option);
    } catch (err) {
      // basic error handling - the UI could be improved to show a toast
      console.error("Failed to parse bookmarks file:", err);
      alert(
        "Failed to parse bookmarks file. Make sure it's a valid bookmarks HTML export.",
      );
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="rounded-xl bg-white dark:bg-gray-900 shadow p-4 transition">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept=".html"
          onChange={onFile}
          className="block w-full sm:w-auto text-sm text-gray-700 dark:text-gray-200 file:border file:rounded file:px-3 file:py-1 file:bg-gray-100 dark:file:bg-gray-800 file:border-gray-300 dark:file:border-gray-700"
        />

        <select
          value={option}
          onChange={(e) => setOption(e.target.value as any)}
          className="rounded border px-2 py-1 bg-white dark:bg-gray-900"
        >
          <option value="new">Create new page</option>
          <option value="merge">Merge into current page</option>
          <option value="overwrite">Overwrite all pages</option>
        </select>

        {option === "new" && (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded border px-2 py-1 bg-white dark:bg-gray-900"
            placeholder="Page name"
          />
        )}
      </div>

      <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
        Import a Chrome/Firefox bookmarks HTML export. The parser will preserve
        folder nesting and order.
      </div>
    </div>
  );
};

export default Importer;
