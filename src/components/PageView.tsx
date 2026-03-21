import { useState, type Dispatch, type SetStateAction } from "react";
import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { Box, Typography } from "@mui/material";
import GroupCard from "./GroupCard";
import type { Data, GroupStyle, Page } from "../types";

type PageViewProps = {
  page: Page;
  pageIndex: number;
  editMode: boolean;
  inheritedStyle: GroupStyle;
  query: string;
  setData: Dispatch<SetStateAction<Data>>;
};

type DragTarget =
  | { kind: "group"; groupIndex: number }
  | { kind: "bookmark"; groupIndex: number; bookmarkIndex: number }
  | { kind: "drop"; groupIndex: number }
  | null;

function parseDragTarget(id: string): DragTarget {
  const parts = id.split(":");

  if (parts[0] === "group" && parts[1] !== undefined) {
    return { kind: "group", groupIndex: Number(parts[1]) };
  }

  if (parts[0] === "bookmark" && parts[1] !== undefined && parts[2] !== undefined) {
    return {
      kind: "bookmark",
      groupIndex: Number(parts[1]),
      bookmarkIndex: Number(parts[2]),
    };
  }

  if (parts[0] === "drop" && parts[1] !== undefined) {
    return { kind: "drop", groupIndex: Number(parts[1]) };
  }

  return null;
}

export default function PageView({
  page,
  pageIndex,
  editMode,
  inheritedStyle,
  query,
  setData,
}: PageViewProps) {
  const dndEnabled = editMode && !query.trim();
  const [activeTarget, setActiveTarget] = useState<DragTarget>(null);
  const [overTarget, setOverTarget] = useState<DragTarget>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const visibleGroupEntries = query.trim()
    ? page.groups
        .map((group, index) => ({ group, index }))
        .filter(({ group }) =>
          group.bookmarks.some((bookmark) =>
            bookmark.title.toLowerCase().includes(query.toLowerCase()),
          ),
        )
    : page.groups.map((group, index) => ({ group, index }));
  const groupIds = visibleGroupEntries.map(({ index }) => `group:${index}`);

  const resetDragState = () => {
    setActiveTarget(null);
    setOverTarget(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    resetDragState();

    if (!dndEnabled || !event.over) {
      return;
    }

    const active = parseDragTarget(String(event.active.id));
    const over = parseDragTarget(String(event.over.id));

    if (!active || !over) {
      return;
    }

    if (active.kind === "group") {
      const targetGroupIndex = over.groupIndex;
      if (active.groupIndex === targetGroupIndex) {
        return;
      }

      setData((previous) => {
        const copy = structuredClone(previous);
        copy.pages[pageIndex].groups = arrayMove(
          copy.pages[pageIndex].groups,
          active.groupIndex,
          targetGroupIndex,
        );
        return copy;
      });
      return;
    }

    if (active.kind !== "bookmark") {
      return;
    }

    const targetGroupIndex = over.groupIndex;
    const targetBookmarkIndex =
      over.kind === "bookmark"
        ? over.bookmarkIndex
        : page.groups[targetGroupIndex]?.bookmarks.length ?? 0;

    if (
      active.groupIndex === targetGroupIndex &&
      active.bookmarkIndex === targetBookmarkIndex
    ) {
      return;
    }

    setData((previous) => {
      const copy = structuredClone(previous);
      const sourceGroup = copy.pages[pageIndex].groups[active.groupIndex];
      const targetGroup = copy.pages[pageIndex].groups[targetGroupIndex];

      if (!sourceGroup || !targetGroup) {
        return previous;
      }

      const [bookmark] = sourceGroup.bookmarks.splice(active.bookmarkIndex, 1);
      if (!bookmark) {
        return previous;
      }

      let insertIndex = targetBookmarkIndex;
      if (active.groupIndex === targetGroupIndex && active.bookmarkIndex < targetBookmarkIndex) {
        insertIndex -= 1;
      }

      targetGroup.bookmarks.splice(insertIndex, 0, bookmark);
      return copy;
    });
  };

  if (!page.groups.length) {
    return (
      <Box
        sx={{
          border: "1px dashed",
          borderColor: "divider",
          borderRadius: "5px",
          p: 4,
          textAlign: "center",
        }}
      >
        <Typography variant="body1">No groups on this page yet.</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Import bookmarks or add a page, then start organizing.
        </Typography>
      </Box>
    );
  }

  if (!visibleGroupEntries.length) {
    return (
      <Box
        sx={{
          border: "1px dashed",
          borderColor: "divider",
          borderRadius: "5px",
          p: 4,
          textAlign: "center",
        }}
      >
        <Typography variant="body1">No matching bookmarks.</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Refine the search or press Esc to clear it.
        </Typography>
      </Box>
    );
  }

  const content = (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: {
          xs: "1fr",
          md: `repeat(${page.columns}, minmax(0, 1fr))`,
        },
      }}
    >
      {visibleGroupEntries.map(({ group, index }) => (
        <GroupCard
          key={`${group.title}-${index}`}
          group={group}
          groupIndex={index}
          pageIndex={pageIndex}
          editMode={editMode}
          inheritedStyle={inheritedStyle}
          query={query}
          dndEnabled={dndEnabled}
          groupDropActive={
            activeTarget?.kind === "group" &&
            overTarget?.kind === "group" &&
            overTarget.groupIndex === index
          }
          bookmarkDropTarget={
            activeTarget?.kind === "bookmark" && overTarget?.groupIndex === index
              ? overTarget.kind === "bookmark"
                ? { kind: "bookmark", bookmarkIndex: overTarget.bookmarkIndex }
                : { kind: "drop" }
              : null
          }
          setData={setData}
        />
      ))}
    </Box>
  );

  if (!dndEnabled) {
    return content;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={(event: DragStartEvent) => {
        setActiveTarget(parseDragTarget(String(event.active.id)));
      }}
      onDragOver={(event: DragOverEvent) => {
        setOverTarget(event.over ? parseDragTarget(String(event.over.id)) : null);
      }}
      onDragCancel={resetDragState}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={groupIds} strategy={rectSortingStrategy}>
        {content}
      </SortableContext>
    </DndContext>
  );
}
