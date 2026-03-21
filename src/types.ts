export type Bookmark = {
  type: "bookmark";
  title: string;
  url: string;
  icon?: string;
};

export type GroupStyle = {
  cardColor: string;
  tileColor: string;
  textColor: string;
};

export type Group = {
  type: "group";
  title: string;
  bookmarks: Bookmark[];
  style?: GroupStyle;
};

export type HeaderMode = "page-title" | "custom";

export type PageHeader = {
  mode: HeaderMode;
  text: string;
};

export type Page = {
  title: string;
  groups: Group[];
  columns: number;
  header: PageHeader;
  style?: GroupStyle;
};

export type Data = {
  pages: Page[];
};

export const STORAGE_KEY = "bookmark-startpage:data";
export const THEME_KEY = "bookmark-startpage:theme";
export const ACTIVE_PAGE_KEY = "bookmark-startpage:active-page";
