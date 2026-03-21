import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import {
  Box,
  Card,
  CardContent,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import BookmarkCard from "./BookmarkCard";
import { useConfirm } from "./ConfirmDialogProvider";
import TextPromptDialog, { type TextPromptField } from "./TextPromptDialog";
import ThemeStyleDialog from "./ThemeStyleDialog";
import type { Data, Group, GroupStyle } from "../types";

type GroupCardProps = {
  group: Group;
  groupIndex: number;
  pageIndex: number;
  editMode: boolean;
  inheritedStyle: GroupStyle;
  query: string;
  dndEnabled: boolean;
  groupDropActive?: boolean;
  bookmarkDropTarget?: {
    kind: "bookmark" | "drop";
    bookmarkIndex?: number;
  } | null;
  setData: Dispatch<SetStateAction<Data>>;
};

type GroupDialogState =
  | {
      kind: "rename-group";
      title: string;
      confirmLabel: string;
      fields: TextPromptField[];
    }
  | {
      kind: "add-bookmark";
      title: string;
      confirmLabel: string;
      fields: TextPromptField[];
    }
  | {
      kind: "edit-bookmark";
      title: string;
      confirmLabel: string;
      bookmarkIndex: number;
      fields: TextPromptField[];
    }
  | null;

export default function GroupCard({
  group,
  groupIndex,
  pageIndex,
  editMode,
  inheritedStyle,
  query,
  dndEnabled,
  groupDropActive = false,
  bookmarkDropTarget = null,
  setData,
}: GroupCardProps) {
  const [styleDialogOpen, setStyleDialogOpen] = useState(false);
  const [draftStyle, setDraftStyle] = useState(group.style ?? inheritedStyle);
  const [dialogState, setDialogState] = useState<GroupDialogState>(null);
  const confirm = useConfirm();

  const sortable = useSortable({
    id: `group:${groupIndex}`,
    data: {
      type: "group",
      groupIndex,
    },
    disabled: !dndEnabled,
  });

  const dropZone = useDroppable({
    id: `drop:${groupIndex}`,
    data: {
      type: "group-drop",
      groupIndex,
    },
    disabled: !dndEnabled,
  });

  const style = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
    opacity: sortable.isDragging ? 0.7 : 1,
  };

  const colors = useMemo(() => group.style ?? inheritedStyle, [group.style, inheritedStyle]);
  const visibleBookmarks = useMemo(() => {
    if (!query.trim()) {
      return group.bookmarks.map((bookmark, index) => ({ bookmark, bookmarkIndex: index }));
    }

    const lower = query.toLowerCase();
    return group.bookmarks
      .map((bookmark, index) => ({ bookmark, bookmarkIndex: index }))
      .filter(({ bookmark }) => bookmark.title.toLowerCase().includes(lower));
  }, [group.bookmarks, query]);

  const bookmarkIds = visibleBookmarks.map(
    ({ bookmarkIndex }) => `bookmark:${groupIndex}:${bookmarkIndex}`,
  );

  const updateGroup = (updater: (draft: Group) => void) => {
    setData((previous) => {
      const copy = structuredClone(previous);
      updater(copy.pages[pageIndex].groups[groupIndex]);
      return copy;
    });
  };

  const removeSelf = async () => {
    const confirmed = await confirm({
      title: `Delete "${group.title}"?`,
      description: "This group and all of its bookmarks will be removed.",
      confirmLabel: "Delete",
      confirmColor: "error",
    });

    if (!confirmed) {
      return;
    }

    setData((previous) => {
      const copy = structuredClone(previous);
      copy.pages[pageIndex].groups.splice(groupIndex, 1);
      return copy;
    });
  };

  const saveStyle = () => {
    updateGroup((draft) => {
      draft.style = { ...draftStyle };
    });
    setStyleDialogOpen(false);
  };

  const handleDialogSubmit = (values: Record<string, string>) => {
    if (!dialogState) {
      return;
    }

    if (dialogState.kind === "rename-group") {
      updateGroup((draft) => {
        draft.title = values.title;
      });
    } else if (dialogState.kind === "add-bookmark") {
      updateGroup((draft) => {
        draft.bookmarks.push({
          type: "bookmark",
          title: values.title,
          url: values.url,
        });
      });
    } else if (dialogState.kind === "edit-bookmark") {
      updateGroup((draft) => {
        draft.bookmarks[dialogState.bookmarkIndex] = {
          ...draft.bookmarks[dialogState.bookmarkIndex],
          title: values.title,
          url: values.url,
        };
      });
    }

    setDialogState(null);
  };

  const renderBookmarkCard = (bookmarkTitle: string, bookmarkUrl: string, bookmarkIndex: number) => (
    <BookmarkCard
      key={`${bookmarkTitle}-${bookmarkIndex}`}
      bookmark={group.bookmarks[bookmarkIndex]}
      groupIndex={groupIndex}
      bookmarkIndex={bookmarkIndex}
      editMode={editMode}
      dndEnabled={dndEnabled}
      textColor={colors.textColor}
      tileColor={colors.tileColor}
      onRename={() =>
        setDialogState({
          kind: "edit-bookmark",
          title: "Edit bookmark",
          confirmLabel: "Save",
          bookmarkIndex,
          fields: [
            {
              key: "title",
              label: "Bookmark title",
              initialValue: bookmarkTitle,
              required: true,
              autoFocus: true,
            },
            {
              key: "url",
              label: "URL",
              initialValue: bookmarkUrl,
              required: true,
              type: "url",
            },
          ],
        })
      }
      onDelete={async () => {
        const confirmed = await confirm({
          title: `Delete "${bookmarkTitle}"?`,
          description: "This bookmark will be removed from the group.",
          confirmLabel: "Delete",
          confirmColor: "error",
        });

        if (!confirmed) {
          return;
        }

        updateGroup((draft) => {
          draft.bookmarks.splice(bookmarkIndex, 1);
        });
      }}
    />
  );

  const renderDropIndicator = (label = "Drop here") => (
    <Box
      sx={{
        minHeight: 38,
        border: "1px dashed",
        borderColor: colors.textColor,
        borderRadius: "5px",
        display: "grid",
        placeItems: "center",
        color: colors.textColor,
        opacity: 0.78,
      }}
    >
      <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {label}
      </Typography>
    </Box>
  );

  return (
    <>
      <Box sx={{ display: "grid", gap: 1 }}>
        {groupDropActive ? renderDropIndicator("Drop group here") : null}
        <Card
          ref={sortable.setNodeRef}
          variant="outlined"
          style={style}
          sx={{
            height: "fit-content",
            borderRadius: "5px",
            backgroundColor: colors.cardColor,
            color: colors.textColor,
            borderColor: "rgba(15, 23, 42, 0.12)",
          }}
        >
          <CardContent sx={{ p: 1.75, "&:last-child": { pb: 1.75 } }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center" minWidth={0}>
                {editMode && dndEnabled ? (
                  <IconButton
                    size="small"
                    aria-label="Reorder group"
                    {...sortable.attributes}
                    {...sortable.listeners}
                    sx={{ color: "inherit", cursor: "grab" }}
                  >
                    <DragIndicatorRoundedIcon fontSize="small" />
                  </IconButton>
                ) : null}
                <Typography variant="h6" noWrap sx={{ fontSize: "1rem", fontWeight: 700 }}>
                  {group.title}
                </Typography>
              </Stack>
              {editMode ? (
                <Stack direction="row" spacing={0.25}>
                  <IconButton
                    size="small"
                    onClick={() =>
                      setDialogState({
                        kind: "add-bookmark",
                        title: `Add bookmark to ${group.title}`,
                        confirmLabel: "Add bookmark",
                        fields: [
                          {
                            key: "title",
                            label: "Bookmark title",
                            required: true,
                            autoFocus: true,
                          },
                          {
                            key: "url",
                            label: "URL",
                            required: true,
                            type: "url",
                          },
                        ],
                      })
                    }
                    aria-label="Add bookmark"
                    sx={{ color: "inherit" }}
                  >
                    <AddRoundedIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setDraftStyle(group.style ?? colors);
                      setStyleDialogOpen(true);
                    }}
                    aria-label="Edit group colors"
                    sx={{ color: "inherit" }}
                  >
                    <PaletteRoundedIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() =>
                      setDialogState({
                        kind: "rename-group",
                        title: "Rename group",
                        confirmLabel: "Save",
                        fields: [
                          {
                            key: "title",
                            label: "Group title",
                            initialValue: group.title,
                            required: true,
                            autoFocus: true,
                          },
                        ],
                      })
                    }
                    aria-label="Rename group"
                    sx={{ color: "inherit" }}
                  >
                    <EditRoundedIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => void removeSelf()}
                    aria-label="Delete group"
                    sx={{ color: "inherit" }}
                  >
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ) : null}
            </Stack>

            <Box
              ref={dropZone.setNodeRef}
              sx={{
                mt: 1.5,
                display: "grid",
                gap: 1,
                minHeight: group.bookmarks.length === 0 ? 84 : "auto",
                p: group.bookmarks.length === 0 ? 1 : 0,
                borderRadius: "5px",
                outline: dropZone.isOver ? `2px dashed ${colors.textColor}` : "none",
                outlineOffset: 2,
              }}
            >
              {bookmarkDropTarget?.kind === "drop" ? renderDropIndicator("Drop bookmark here") : null}
              {visibleBookmarks.length === 0 ? (
                <Typography variant="body2" sx={{ opacity: 0.72 }}>
                  {query.trim() ? "No matching bookmarks" : "Empty group"}
                </Typography>
              ) : dndEnabled ? (
                <SortableContext items={bookmarkIds} strategy={verticalListSortingStrategy}>
                  {visibleBookmarks.flatMap(({ bookmark, bookmarkIndex }) => [
                    bookmarkDropTarget?.kind === "bookmark" &&
                    bookmarkDropTarget.bookmarkIndex === bookmarkIndex
                      ? (
                          <Box key={`drop-before-${bookmarkIndex}`}>
                            {renderDropIndicator("Drop bookmark here")}
                          </Box>
                        )
                      : null,
                    renderBookmarkCard(bookmark.title, bookmark.url, bookmarkIndex),
                  ])}
                </SortableContext>
              ) : (
                visibleBookmarks.map(({ bookmark, bookmarkIndex }) =>
                  renderBookmarkCard(bookmark.title, bookmark.url, bookmarkIndex),
                )
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>

      <TextPromptDialog
        open={Boolean(dialogState)}
        title={dialogState?.title ?? ""}
        confirmLabel={dialogState?.confirmLabel}
        fields={dialogState?.fields ?? []}
        onClose={() => setDialogState(null)}
        onSubmit={handleDialogSubmit}
      />

      <ThemeStyleDialog
        open={styleDialogOpen}
        title="Group colors"
        draftStyle={draftStyle}
        onClose={() => setStyleDialogOpen(false)}
        onChange={setDraftStyle}
        onReset={() => {
          updateGroup((draft) => {
            delete draft.style;
          });
          setDraftStyle(inheritedStyle);
          setStyleDialogOpen(false);
        }}
        onSave={saveStyle}
      />
    </>
  );
}
