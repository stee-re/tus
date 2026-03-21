import { useMemo, useRef, useState, type ReactNode } from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { parseBookmarksHtml } from "../parser";
import { normalizeData } from "../data";
import type { Data, Group, Page } from "../types";

export type ImportMode = "overwrite" | "merge" | "new";
export type ImportPayload =
  | { kind: "page"; page: Page }
  | { kind: "data"; data: Data };

type Props = {
  existingUrls: string[];
  onImport: (payload: ImportPayload, mode: ImportMode) => void;
  renderTrigger: (actions: {
    openJsonImport: () => void;
    openHtmlImport: () => void;
  }) => ReactNode;
};

type SelectionMap = Record<string, boolean>;
type DuplicateMap = Record<string, boolean>;
type TouchedMap = Record<string, boolean>;

function getPages(payload: ImportPayload | null): Page[] {
  if (!payload) {
    return [];
  }

  return payload.kind === "page" ? [payload.page] : payload.data.pages;
}

function normalizeUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) {
    return "";
  }

  try {
    const parsed = new URL(trimmed);
    parsed.hash = "";
    if (parsed.pathname === "/") {
      parsed.pathname = "";
    }
    parsed.hostname = parsed.hostname.toLowerCase();
    return parsed.toString();
  } catch {
    return trimmed;
  }
}

function createImportState(
  payload: ImportPayload,
  existingUrls: string[],
  mode: ImportMode,
) {
  const selection: SelectionMap = {};
  const duplicates: DuplicateMap = {};
  const seenExistingUrls = new Set(existingUrls.map(normalizeUrl));
  const seenImportedUrls = new Set<string>();

  getPages(payload).forEach((page, pageIndex) => {
    page.groups.forEach((group, groupIndex) => {
      selection[`group:${pageIndex}:${groupIndex}`] = true;

      group.bookmarks.forEach((bookmark, bookmarkIndex) => {
        const bookmarkKey = `bookmark:${pageIndex}:${groupIndex}:${bookmarkIndex}`;
        const normalizedUrl = normalizeUrl(bookmark.url);
        const isExistingDuplicate = Boolean(normalizedUrl) && seenExistingUrls.has(normalizedUrl);
        const isImportedDuplicate = Boolean(normalizedUrl) && seenImportedUrls.has(normalizedUrl);
        const isDuplicate =
          isImportedDuplicate || (mode !== "overwrite" && isExistingDuplicate);

        duplicates[bookmarkKey] = isDuplicate;
        selection[bookmarkKey] = !isDuplicate;

        if (normalizedUrl) {
          seenImportedUrls.add(normalizedUrl);
        }
      });
    });
  });

  return { selection, duplicates };
}

function filterGroup(
  group: Group,
  pageIndex: number,
  groupIndex: number,
  selection: SelectionMap,
): Group | null {
  const selectedBookmarks = group.bookmarks.filter((_, bookmarkIndex) => {
    const bookmarkKey = `bookmark:${pageIndex}:${groupIndex}:${bookmarkIndex}`;
    return selection[bookmarkKey] !== false;
  });

  if (selectedBookmarks.length === 0) {
    return null;
  }

  return {
    ...group,
    bookmarks: selectedBookmarks,
  };
}

function filterPayload(payload: ImportPayload, selection: SelectionMap): ImportPayload {
  if (payload.kind === "page") {
    return {
      kind: "page",
      page: {
        ...payload.page,
        groups: payload.page.groups
          .map((group, groupIndex) => filterGroup(group, 0, groupIndex, selection))
          .filter((group): group is Group => Boolean(group)),
      },
    };
  }

  return {
    kind: "data",
    data: {
      pages: payload.data.pages.map((page, pageIndex) => ({
        ...page,
        groups: page.groups
          .map((group, groupIndex) => filterGroup(group, pageIndex, groupIndex, selection))
          .filter((group): group is Group => Boolean(group)),
      })),
    },
  };
}

export default function Importer({ existingUrls, onImport, renderTrigger }: Props) {
  const htmlInputRef = useRef<HTMLInputElement | null>(null);
  const jsonInputRef = useRef<HTMLInputElement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<ImportMode>("new");
  const [pageTitle, setPageTitle] = useState("Imported");
  const [payload, setPayload] = useState<ImportPayload | null>(null);
  const [selection, setSelection] = useState<SelectionMap>({});
  const [duplicates, setDuplicates] = useState<DuplicateMap>({});
  const [touched, setTouched] = useState<TouchedMap>({});
  const [error, setError] = useState<string | null>(null);

  const previewPages = useMemo(() => getPages(payload), [payload]);

  const resetInput = (input: HTMLInputElement | null) => {
    if (input) {
      input.value = "";
    }
  };

  const openImportDialog = (nextPayload: ImportPayload, initialTitle: string) => {
    const nextState = createImportState(nextPayload, existingUrls, "new");
    setPayload(nextPayload);
    setSelection(nextState.selection);
    setDuplicates(nextState.duplicates);
    setTouched({});
    setPageTitle(initialTitle);
    setMode("new");
    setDialogOpen(true);
    setError(null);
  };

  const updateSelectionForMode = (nextMode: ImportMode) => {
    if (!payload) {
      return;
    }

    const defaults = createImportState(payload, existingUrls, nextMode);
    setDuplicates(defaults.duplicates);
    setSelection((previous) => {
      const next = { ...previous };

      previewPages.forEach((page, pageIndex) => {
        page.groups.forEach((group, groupIndex) => {
          const groupKey = `group:${pageIndex}:${groupIndex}`;
          const bookmarkKeys = group.bookmarks.map(
            (_, bookmarkIndex) => `bookmark:${pageIndex}:${groupIndex}:${bookmarkIndex}`,
          );

          bookmarkKeys.forEach((bookmarkKey) => {
            if (!touched[bookmarkKey]) {
              next[bookmarkKey] = defaults.selection[bookmarkKey];
            }
          });

          if (!touched[groupKey]) {
            next[groupKey] =
              group.bookmarks.length === 0
                ? defaults.selection[groupKey]
                : bookmarkKeys.some((bookmarkKey) => next[bookmarkKey] !== false);
          }
        });
      });

      return next;
    });
  };

  const handleHtmlFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = parseBookmarksHtml(text);
      openImportDialog(
        {
          kind: "page",
          page: {
            title: file.name.replace(/\.[^.]+$/, "") || parsed.title,
            groups: parsed.groups,
            columns: 3,
            header: { mode: "page-title", text: "" },
          },
        },
        file.name.replace(/\.[^.]+$/, "") || parsed.title,
      );
    } catch (parseError) {
      console.error("Failed to parse bookmarks file:", parseError);
      setError(
        "Failed to parse bookmarks HTML. Use a Chrome or Firefox bookmarks export.",
      );
    }
  };

  const handleJsonFile = async (file: File) => {
    try {
      const text = await file.text();
      const raw = JSON.parse(text);
      const data = normalizeData(raw);
      openImportDialog({ kind: "data", data }, data.pages[0]?.title || "Imported");
    } catch (parseError) {
      console.error("Failed to parse JSON file:", parseError);
      setError("Invalid JSON import. Check the file contents and try again.");
    }
  };

  const applyAllSelection = (checked: boolean) => {
    setSelection((previous) => {
      const next = { ...previous };

      previewPages.forEach((page, pageIndex) => {
        page.groups.forEach((group, groupIndex) => {
          next[`group:${pageIndex}:${groupIndex}`] = checked;
          group.bookmarks.forEach((_, bookmarkIndex) => {
            next[`bookmark:${pageIndex}:${groupIndex}:${bookmarkIndex}`] = checked;
          });
        });
      });

      return next;
    });
    setTouched((previous) => {
      const next = { ...previous };

      previewPages.forEach((page, pageIndex) => {
        page.groups.forEach((group, groupIndex) => {
          next[`group:${pageIndex}:${groupIndex}`] = true;
          group.bookmarks.forEach((_, bookmarkIndex) => {
            next[`bookmark:${pageIndex}:${groupIndex}:${bookmarkIndex}`] = true;
          });
        });
      });

      return next;
    });
  };

  return (
    <>
      {renderTrigger({
        openJsonImport: () => jsonInputRef.current?.click(),
        openHtmlImport: () => htmlInputRef.current?.click(),
      })}

      <input
        ref={htmlInputRef}
        type="file"
        accept=".html,text/html"
        hidden
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (file) {
            await handleHtmlFile(file);
          }
          resetInput(htmlInputRef.current);
        }}
      />
      <input
        ref={jsonInputRef}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (file) {
            await handleJsonFile(file);
          }
          resetInput(jsonInputRef.current);
        }}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Import bookmarks</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: 1.5 }}>
          {error ? <Typography color="error">{error}</Typography> : null}
          <FormControl fullWidth>
            <Select
              value={mode}
              onChange={(event) => {
                const nextMode = event.target.value as ImportMode;
                setMode(nextMode);
                updateSelectionForMode(nextMode);
              }}
            >
              <MenuItem value="new">Create new page</MenuItem>
              <MenuItem value="merge">Merge into current page</MenuItem>
              <MenuItem value="overwrite">Overwrite all pages</MenuItem>
            </Select>
          </FormControl>
          {(payload?.kind === "page" || payload?.data.pages.length === 1) && (
            <TextField
              label="Page title"
              value={pageTitle}
              onChange={(event) => setPageTitle(event.target.value)}
              fullWidth
            />
          )}
          {payload?.kind === "data" && payload.data.pages.length > 1 ? (
            <Typography variant="body2" color="text.secondary">
              This JSON file contains {payload.data.pages.length} pages. Creating a new page will append all of them.
            </Typography>
          ) : null}

          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button size="small" variant="outlined" onClick={() => applyAllSelection(true)}>
              Select all
            </Button>
            <Button size="small" variant="outlined" onClick={() => applyAllSelection(false)}>
              Deselect all
            </Button>
            <Typography variant="caption" sx={{ alignSelf: "center" }} color="text.secondary">
              Duplicate URLs are deselected by default.
            </Typography>
          </Stack>

          <Paper
            variant="outlined"
            sx={{
              borderRadius: "5px",
              maxHeight: 420,
              overflowY: "auto",
            }}
          >
            {previewPages.map((page, pageIndex) => (
              <Box key={`${page.title}-${pageIndex}`}>
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {page.title}
                  </Typography>
                </Box>
                <Divider />
                <Stack spacing={1} sx={{ p: 1.5 }}>
                  {page.groups.map((group, groupIndex) => {
                    const groupKey = `group:${pageIndex}:${groupIndex}`;
                    const bookmarkKeys = group.bookmarks.map(
                      (_, bookmarkIndex) => `bookmark:${pageIndex}:${groupIndex}:${bookmarkIndex}`,
                    );
                    const selectedCount = bookmarkKeys.filter((key) => selection[key] !== false).length;
                    const groupChecked =
                      group.bookmarks.length === 0
                        ? selection[groupKey] !== false
                        : selectedCount === group.bookmarks.length;

                    return (
                      <Paper key={groupKey} variant="outlined" sx={{ p: 1.25, borderRadius: "5px" }}>
                        <Stack spacing={0.75}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Stack direction="row" alignItems="center" spacing={1} minWidth={0} sx={{ flex: 1 }}>
                              <Checkbox
                                checked={groupChecked}
                                indeterminate={
                                  groupChecked &&
                                  selectedCount > 0 &&
                                  selectedCount < group.bookmarks.length
                                }
                                onChange={(event) => {
                                  const checked = event.target.checked;
                                  setSelection((previous) => {
                                    const next = { ...previous, [groupKey]: checked };
                                    bookmarkKeys.forEach((key) => {
                                      next[key] = checked;
                                    });
                                    return next;
                                  });
                                  setTouched((previous) => {
                                    const next = { ...previous, [groupKey]: true };
                                    bookmarkKeys.forEach((key) => {
                                      next[key] = true;
                                    });
                                    return next;
                                  });
                                }}
                              />
                              <Box minWidth={0}>
                                <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                                  {group.title}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {group.bookmarks.length} bookmark{group.bookmarks.length === 1 ? "" : "s"}
                                </Typography>
                              </Box>
                            </Stack>
                          </Stack>

                          <Stack spacing={0.25} sx={{ pl: 4.5 }}>
                            {group.bookmarks.map((bookmark, bookmarkIndex) => {
                              const bookmarkKey = `bookmark:${pageIndex}:${groupIndex}:${bookmarkIndex}`;
                              const isDuplicate = duplicates[bookmarkKey] === true;

                              return (
                                <Stack
                                  key={bookmarkKey}
                                  direction="row"
                                  alignItems="center"
                                  spacing={1}
                                  sx={{ minWidth: 0 }}
                                >
                                  <Checkbox
                                    size="small"
                                    checked={selection[bookmarkKey] !== false}
                                    onChange={(event) => {
                                      const checked = event.target.checked;
                                      setSelection((previous) => {
                                        const next = {
                                          ...previous,
                                          [bookmarkKey]: checked,
                                        };
                                        next[groupKey] =
                                          group.bookmarks.length === 0
                                            ? checked
                                            : bookmarkKeys.some((key) =>
                                                key === bookmarkKey ? checked : next[key] !== false,
                                              );
                                        return next;
                                      });
                                      setTouched((previous) => ({
                                        ...previous,
                                        [bookmarkKey]: true,
                                        [groupKey]: true,
                                      }));
                                    }}
                                  />
                                  <Box minWidth={0} sx={{ flex: 1 }}>
                                    <Stack direction="row" spacing={1} alignItems="center" minWidth={0}>
                                      <Typography variant="body2" noWrap>
                                        {bookmark.title}
                                      </Typography>
                                      {isDuplicate ? (
                                        <Typography variant="caption" color="warning.main" sx={{ flexShrink: 0 }}>
                                          Duplicate
                                        </Typography>
                                      ) : null}
                                    </Stack>
                                    <Typography variant="caption" color="text.secondary" noWrap>
                                      {bookmark.url}
                                    </Typography>
                                  </Box>
                                </Stack>
                              );
                            })}
                            {group.bookmarks.length === 0 ? (
                              <Typography variant="caption" color="text.secondary">
                                Empty group
                              </Typography>
                            ) : null}
                          </Stack>
                        </Stack>
                      </Paper>
                    );
                  })}
                </Stack>
              </Box>
            ))}
          </Paper>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (!payload) {
                return;
              }

              const filteredPayload = filterPayload(payload, selection);

              if (filteredPayload.kind === "page") {
                onImport(
                  {
                    kind: "page",
                    page: {
                      ...filteredPayload.page,
                      title: pageTitle.trim() || filteredPayload.page.title,
                    },
                  },
                  mode,
                );
              } else if (filteredPayload.data.pages.length === 1) {
                onImport(
                  {
                    kind: "data",
                    data: {
                      pages: [
                        {
                          ...filteredPayload.data.pages[0],
                          title: pageTitle.trim() || filteredPayload.data.pages[0].title,
                        },
                      ],
                    },
                  },
                  mode,
                );
              } else {
                onImport(filteredPayload, mode);
              }

              setDialogOpen(false);
            }}
          >
            Import
          </Button>
        </DialogActions>
      </Dialog>

      {error && !dialogOpen ? (
        <Typography color="error" sx={{ mt: 1 }}>
          {error}
        </Typography>
      ) : null}
    </>
  );
}
