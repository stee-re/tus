import React from "react";

export default function BookmarkCard({ bm }: any) {
  let hostname = "";
  try {
    hostname = new URL(bm.url).hostname;
  } catch {}

  const favicon = hostname
    ? `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`
    : "";

  return (
    <a
      href={bm.url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
    >
      {favicon && (
        <img src={favicon} width={18} height={18} className="rounded-sm" />
      )}
      <div className="truncate">
        <div className="text-sm font-medium truncate">{bm.title}</div>
        <div className="text-xs text-gray-500 truncate">{bm.url}</div>
      </div>
    </a>
  );
}
