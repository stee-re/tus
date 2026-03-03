import React from "react";
import GroupCard from "./GroupCard";

export default function PageView({ page, columns, editMode, setData }: any) {
  return (
    <div
      className="grid gap-6"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {page.groups.map((g: any, i: number) => (
        <GroupCard
          key={i}
          group={g}
          path={[i]}
          editMode={editMode}
          setData={setData}
        />
      ))}
    </div>
  );
}
