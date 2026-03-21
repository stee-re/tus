import type { Bookmark, Group } from "./types";

type ParsedBookmarks = {
  title: string;
  groups: Group[];
};

function directChildrenByTag(element: Element, tagName: string) {
  return Array.from(element.children).filter(
    (node) => node.tagName.toLowerCase() === tagName.toLowerCase(),
  );
}

export function parseBookmarksHtml(html: string): ParsedBookmarks {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const rootDL = doc.querySelector("dl");

  const collectGroups = (
    list: Element,
    trail: string[] = [],
    includeLooseBookmarksGroup = trail.length === 0,
  ): Group[] => {
    const groups: Group[] = [];
    const looseBookmarks: Bookmark[] = [];

    for (const dt of directChildrenByTag(list, "dt")) {
      const folder = dt.querySelector(":scope > h3");
      if (folder) {
        const title = folder.textContent?.trim() || "Folder";
        const nestedDL = dt.querySelector(":scope > dl");
        const bookmarks: Bookmark[] = [];
        const nestedGroups = nestedDL ? collectGroups(nestedDL, [...trail, title], false) : [];

        if (nestedDL) {
          for (const nestedDT of directChildrenByTag(nestedDL, "dt")) {
            const link = nestedDT.querySelector(":scope > a");
            if (!link) {
              continue;
            }

            bookmarks.push({
              type: "bookmark",
              title: link.textContent?.trim() || link.getAttribute("href") || "Link",
              url: link.getAttribute("href") || "",
            });
          }
        }

        groups.push({
          type: "group",
          title: [...trail, title].join(" / "),
          bookmarks,
        });
        groups.push(...nestedGroups);
        continue;
      }

      const link = dt.querySelector(":scope > a");
      if (!link) {
        continue;
      }

      looseBookmarks.push({
        type: "bookmark",
        title: link.textContent?.trim() || link.getAttribute("href") || "Link",
        url: link.getAttribute("href") || "",
      });
    }

    if (includeLooseBookmarksGroup && looseBookmarks.length > 0) {
      groups.unshift({
        type: "group",
        title: trail.length > 0 ? `${trail.join(" / ")} / Links` : "Imported Links",
        bookmarks: looseBookmarks,
      });
    }

    return groups;
  };

  return {
    title: "Imported",
    groups: rootDL ? collectGroups(rootDL) : [],
  };
}
