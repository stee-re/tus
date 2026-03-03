import React, { useEffect, useMemo, useState } from "react";
import Header from "./components/Header";
import Importer from "./components/Importer";
import PageView from "./components/PageView";

export type Bookmark = {
  type: "bookmark";
  title: string;
  url: string;
};

export type Group = {
  type: "group";
  title: string;
  children: Array<Group | Bookmark>;
};

export type Page = {
  title: string;
  groups: Group[];
};

export type Data = {
  pages: Page[];
};

const STORAGE_KEY = "bookmark-startpage:data";
const THEME_KEY = "bookmark-startpage:theme";

const defaultData: Data = {
  pages: [{ title: "Main", groups: [] }],
};

export default function App() {
  const [data, setData] = useState<Data>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : defaultData;
    } catch {
      return defaultData;
    }
  });

  const [activePage, setActivePage] = useState(0);
  const [columns, setColumns] = useState(3);
  const [editMode, setEditMode] = useState(false);
  const [query, setQuery] = useState("");
  const [dark, setDark] = useState<boolean>(() => {
    return localStorage.getItem(THEME_KEY) === "dark";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem(THEME_KEY, "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem(THEME_KEY, "light");
    }
  }, [dark]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "f" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const el = document.getElementById("search") as HTMLInputElement | null;
        el?.focus();
        el?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    if (!query) return null;
    const lower = query.toLowerCase();
    const page = data.pages[activePage];
    const matches: Bookmark[] = [];

    const walk = (children: Array<Group | Bookmark>) => {
      for (const c of children) {
        if (c.type === "bookmark") {
          if (
            c.title.toLowerCase().includes(lower) ||
            c.url.toLowerCase().includes(lower)
          ) {
            matches.push(c);
          }
        } else {
          walk(c.children);
        }
      }
    };

    for (const g of page.groups) walk([g]);
    return matches;
  }, [query, data, activePage]);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bookmarks.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 p-6 transition-colors">
      <Header
        pages={data.pages.map((p) => p.title)}
        active={activePage}
        onPageChange={setActivePage}
        columns={columns}
        setColumns={setColumns}
        editMode={editMode}
        setEditMode={setEditMode}
        dark={dark}
        setDark={setDark}
        onExport={exportJson}
      />

      <div className="mt-6">
        <Importer
          onImport={(page, mode) => {
            setData((prev) => {
              const copy = structuredClone(prev);
              if (mode === "overwrite") {
                copy.pages = [page];
                setActivePage(0);
              } else if (mode === "merge") {
                copy.pages[activePage].groups.push(...page.groups);
              } else {
                copy.pages.push(page);
                setActivePage(copy.pages.length - 1);
              }
              return copy;
            });
          }}
        />
      </div>

      <div className="mt-6">
        <input
          id="search"
          autoFocus
          placeholder="Search bookmarks (Enter to open)"
          className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results && results.length === 1) {
              if (e.ctrlKey || e.metaKey) window.open(results[0].url, "_blank");
              else window.location.href = results[0].url;
            }
          }}
        />
      </div>

      <main className="mt-8">
        <PageView
          page={data.pages[activePage]}
          columns={columns}
          editMode={editMode}
          setData={setData}
        />
      </main>
    </div>
  );
}
