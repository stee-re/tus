export function parseBookmarksHtml(html: string) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, "text/html")
  const rootDL = doc.querySelector("dl")

  const makeNode = (dt: Element): any => {
    const h3 = dt.querySelector("h3")
    if (h3) {
      const title = h3.textContent || "Folder"
      const dl = dt.querySelector("dl")
      const children: any[] = []

      if (dl) {
        const dts = Array.from(dl.children).filter(
          (n) => n.tagName.toLowerCase() === "dt"
        )
        for (const child of dts) {
          const node = makeNode(child as Element)
          if (node) children.push(node)
        }
      }

      return { type: "group", title, children }
    }

    const a = dt.querySelector("a")
    if (a) {
      return {
        type: "bookmark",
        title: a.textContent || a.getAttribute("href") || "link",
        url: a.getAttribute("href") || "",
      }
    }

    return null
  }

  const groups: any[] = []
  if (rootDL) {
    const topDTs = Array.from(rootDL.children).filter(
      (n) => n.tagName.toLowerCase() === "dt"
    )
    for (const dt of topDTs) {
      const node = makeNode(dt as Element)
      if (node) groups.push(node)
    }
  }

  return { title: "Imported", groups }
}
