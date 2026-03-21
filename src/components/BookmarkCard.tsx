import { useMemo } from "react";
import {
  IconButton,
  Link,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Bookmark } from "../types";

type BookmarkCardProps = {
  bookmark: Bookmark;
  groupIndex: number;
  bookmarkIndex: number;
  editMode: boolean;
  dndEnabled: boolean;
  textColor: string;
  tileColor: string;
  onRename: () => void;
  onDelete: () => void;
};

export default function BookmarkCard({
  bookmark,
  groupIndex,
  bookmarkIndex,
  editMode,
  dndEnabled,
  textColor,
  tileColor,
  onRename,
  onDelete,
}: BookmarkCardProps) {
  const sortable = useSortable({
    id: `bookmark:${groupIndex}:${bookmarkIndex}`,
    data: {
      type: "bookmark",
      groupIndex,
      bookmarkIndex,
    },
    disabled: !dndEnabled,
  });

  const style = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
    opacity: sortable.isDragging ? 0.65 : 1,
  };

  const favicon = useMemo(() => {
    if (bookmark.icon) {
      return "";
    }

    try {
      const hostname = new URL(bookmark.url).hostname;
      return hostname
        ? `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`
        : "";
    } catch {
      return "";
    }
  }, [bookmark.icon, bookmark.url]);

  return (
    <Paper
      ref={sortable.setNodeRef}
      variant="outlined"
      style={style}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1.25,
        width: "100%",
        minWidth: 0,
        px: 1.25,
        py: 1,
        borderRadius: "5px",
        backgroundColor: tileColor,
        color: textColor,
        borderColor: "rgba(15, 23, 42, 0.1)",
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        minWidth={0}
        sx={{ flex: 1, overflow: "hidden" }}
      >
        {editMode && dndEnabled && (
          <IconButton
            size="small"
            aria-label="Reorder bookmark"
            {...sortable.attributes}
            {...sortable.listeners}
            sx={{ color: "inherit", cursor: "grab" }}
          >
            <DragIndicatorRoundedIcon fontSize="small" />
          </IconButton>
        )}
        {favicon ? (
          <img
            src={favicon}
            alt=""
            width={18}
            height={18}
            loading="lazy"
            style={{ borderRadius: 4, flexShrink: 0 }}
          />
        ) : null}
        <Link
          href={bookmark.url}
          target="_blank"
          rel="noreferrer"
          underline="none"
          color="inherit"
          sx={{ minWidth: 0, display: "block", flex: 1, overflow: "hidden" }}
        >
          <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
            {bookmark.title}
          </Typography>
          <Tooltip title={bookmark.url} placement="top-start">
            <Typography
              variant="caption"
              sx={{
                color: "inherit",
                opacity: 0.72,
                display: "block",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {bookmark.url}
            </Typography>
          </Tooltip>
        </Link>
      </Stack>

      <Stack direction="row" spacing={0.25} alignItems="center" sx={{ flexShrink: 0 }}>
        {editMode && (
          <>
            <IconButton size="small" onClick={onRename} aria-label="Rename bookmark" sx={{ color: "inherit" }}>
              <EditRoundedIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={onDelete} aria-label="Delete bookmark" sx={{ color: "inherit" }}>
              <DeleteOutlineRoundedIcon fontSize="small" />
            </IconButton>
          </>
        )}
      </Stack>
    </Paper>
  );
}
