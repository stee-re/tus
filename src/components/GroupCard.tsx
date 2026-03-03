import React from "react";
import BookmarkCard from "./BookmarkCard";

export default function GroupCard({ group, path, editMode, setData }: any) {
  const removeSelf = () => {
    setData((prev: any) => {
      const copy = structuredClone(prev);
      let arr = copy.pages[0].groups;
      for (let i = 0; i < path.length - 1; i++) {
        arr = arr[path[i]].children;
      }
      arr.splice(path[path.length - 1], 1);
      return copy;
    });
  };

  return (
    <div className="rounded-xl bg-white dark:bg-gray-900 shadow p-4 transition">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">{group.title}</h3>
        {editMode && (
          <button
            onClick={removeSelf}
            className="text-sm text-red-500 hover:text-red-700"
          >
            Delete
          </button>
        )}
      </div>

      <div className="mt-4 space-y-2">
        {(!group.children || group.children.length === 0) && (
          <div className="text-sm text-gray-500">Empty</div>
        )}

        {group.children &&
          group.children.map((c: any, i: number) =>
            c.type === "bookmark" ? (
              <BookmarkCard key={i} bm={c} />
            ) : (
              <GroupCard
                key={i}
                group={c}
                path={[...path, i]}
                editMode={editMode}
                setData={setData}
              />
            ),
          )}
      </div>
    </div>
  );
}
