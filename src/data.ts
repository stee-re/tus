import type { Bookmark, Data, Group, GroupStyle, Page, PageHeader } from "./types";

export const DEFAULT_COLUMNS = 3;

export const DEFAULT_HEADER: PageHeader = {
  mode: "page-title",
  text: "",
};

export const DEFAULT_GROUP_STYLE: GroupStyle = {
  cardColor: "#ffffff",
  tileColor: "#f4f7f5",
  textColor: "#18211c",
};

export const DEFAULT_DARK_GROUP_STYLE: GroupStyle = {
  cardColor: "#17211b",
  tileColor: "#223128",
  textColor: "#eff6f1",
};

export function createEmptyPage(title = "Main"): Page {
  return {
    title,
    groups: [],
    columns: DEFAULT_COLUMNS,
    header: { ...DEFAULT_HEADER },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function normalizeColor(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function normalizeBookmark(value: unknown): Bookmark | null {
  if (!isRecord(value)) {
    return null;
  }

  const title =
    typeof value.title === "string" && value.title.trim() ? value.title.trim() : "Untitled";
  const url = typeof value.url === "string" ? value.url.trim() : "";

  if (!url) {
    return null;
  }

  const icon = typeof value.icon === "string" && value.icon.trim() ? value.icon.trim() : undefined;

  return {
    type: "bookmark",
    title,
    url,
    icon,
  };
}

function normalizeStyle(value: unknown): GroupStyle | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  return {
    cardColor: normalizeColor(value.cardColor, DEFAULT_GROUP_STYLE.cardColor),
    tileColor: normalizeColor(value.tileColor, DEFAULT_GROUP_STYLE.tileColor),
    textColor: normalizeColor(value.textColor, DEFAULT_GROUP_STYLE.textColor),
  };
}

function normalizeGroup(value: unknown): Group[] {
  if (!isRecord(value)) {
    return [];
  }

  if (Array.isArray(value.bookmarks)) {
    const title =
      typeof value.title === "string" && value.title.trim() ? value.title.trim() : "Group";

    return [
      {
        type: "group",
        title,
        bookmarks: value.bookmarks
          .map((bookmark) => normalizeBookmark(bookmark))
          .filter((bookmark): bookmark is Bookmark => Boolean(bookmark)),
        style: normalizeStyle(value.style),
      },
    ];
  }

  return [];
}

function normalizeHeader(value: unknown): PageHeader {
  if (!isRecord(value)) {
    return { ...DEFAULT_HEADER };
  }

  return {
    mode: value.mode === "custom" ? "custom" : "page-title",
    text: typeof value.text === "string" ? value.text : "",
  };
}

function normalizePage(value: unknown, index: number): Page {
  if (!isRecord(value)) {
    return createEmptyPage(index === 0 ? "Main" : `Page ${index + 1}`);
  }

  const title =
    typeof value.title === "string" && value.title.trim()
      ? value.title.trim()
      : index === 0
        ? "Main"
        : `Page ${index + 1}`;

  return {
    title,
    groups: Array.isArray(value.groups) ? value.groups.flatMap(normalizeGroup) : [],
    columns:
      typeof value.columns === "number"
        ? Math.min(6, Math.max(1, Math.round(value.columns)))
        : DEFAULT_COLUMNS,
    header: normalizeHeader(value.header),
    style: normalizeStyle(value.style),
  };
}

export function normalizeData(value: unknown): Data {
  if (!isRecord(value) || !Array.isArray(value.pages) || value.pages.length === 0) {
    return { pages: [createEmptyPage()] };
  }

  return {
    pages: value.pages.map((page, index) => normalizePage(page, index)),
  };
}

export function getPageHeading(page: Page) {
  if (page.header.mode === "custom" && page.header.text.trim()) {
    return page.header.text.trim();
  }

  return page.title;
}

export function getDefaultStyleForMode(mode: "light" | "dark"): GroupStyle {
  return mode === "dark" ? DEFAULT_DARK_GROUP_STYLE : DEFAULT_GROUP_STYLE;
}
