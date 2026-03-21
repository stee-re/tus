import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Container,
  CssBaseline,
  Fab,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  ThemeProvider,
  Typography,
  createTheme,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { ConfirmDialogProvider, useConfirm } from "./components/ConfirmDialogProvider";
import Header from "./components/Header";
import Importer, { type ImportMode, type ImportPayload } from "./components/Importer";
import PageView from "./components/PageView";
import TextPromptDialog, { type TextPromptField } from "./components/TextPromptDialog";
import ThemeStyleDialog from "./components/ThemeStyleDialog";
import { createEmptyPage, getDefaultStyleForMode, getPageHeading, normalizeData } from "./data";
import type { Data, GroupStyle, Page } from "./types";
import { ACTIVE_PAGE_KEY, STORAGE_KEY, THEME_KEY } from "./types";

const defaultData: Data = {
  pages: [createEmptyPage()],
};

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const safeHex =
    normalized.length === 3
      ? normalized
          .split("")
          .map((value) => `${value}${value}`)
          .join("")
      : normalized;

  const value = Number.parseInt(safeHex, 16);

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0"))
    .join("")}`;
}

function mixColors(base: string, accent: string, weight: number) {
  const from = hexToRgb(base);
  const to = hexToRgb(accent);

  return rgbToHex(
    from.r + (to.r - from.r) * weight,
    from.g + (to.g - from.g) * weight,
    from.b + (to.b - from.b) * weight,
  );
}

function rgba(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function derivePageChrome(style: GroupStyle, mode: "light" | "dark") {
  return {
    background:
      mode === "dark"
        ? mixColors(style.cardColor, "#000000", 0.28)
        : mixColors(style.cardColor, "#ffffff", 0.6),
    surface:
      mode === "dark"
        ? mixColors(style.tileColor, "#000000", 0.18)
        : mixColors(style.tileColor, "#ffffff", 0.42),
    mutedText: rgba(style.textColor, 0.72),
    border: rgba(style.textColor, mode === "dark" ? 0.24 : 0.16),
    primary: mixColors(style.tileColor, style.textColor, mode === "dark" ? 0.22 : 0.12),
  };
}

function loadData(): Data {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeData(JSON.parse(raw)) : defaultData;
  } catch {
    return defaultData;
  }
}

type AppDialogState =
  | {
      kind: "add-page";
      title: string;
      confirmLabel: string;
      fields: TextPromptField[];
    }
  | {
      kind: "rename-page";
      title: string;
      confirmLabel: string;
      fields: TextPromptField[];
    }
  | {
      kind: "header-text";
      title: string;
      confirmLabel: string;
      fields: TextPromptField[];
    }
  | {
      kind: "add-group";
      title: string;
      confirmLabel: string;
      fields: TextPromptField[];
    }
  | null;

function AppContent() {
  const [data, setData] = useState<Data>(loadData);
  const [activePage, setActivePage] = useState<number>(() => {
    const raw = localStorage.getItem(ACTIVE_PAGE_KEY);
    const parsed = raw === null ? 0 : Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  });
  const [editMode, setEditMode] = useState(false);
  const [query, setQuery] = useState("");
  const [dark, setDark] = useState<boolean>(() => localStorage.getItem(THEME_KEY) === "dark");
  const [pageThemeDialogOpen, setPageThemeDialogOpen] = useState(false);
  const [draftPageStyle, setDraftPageStyle] = useState<GroupStyle>(() =>
    getDefaultStyleForMode(localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light"),
  );
  const [dialogState, setDialogState] = useState<AppDialogState>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const confirm = useConfirm();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    setActivePage((current) => Math.min(current, data.pages.length - 1));
  }, [data.pages.length]);

  useEffect(() => {
    localStorage.setItem(ACTIVE_PAGE_KEY, String(Math.max(0, activePage)));
  }, [activePage]);

  useEffect(() => {
    if (editMode) {
      return;
    }

    searchInputRef.current?.focus();
    searchInputRef.current?.select();
  }, [activePage, editMode]);

  useEffect(() => {
    if (editMode && query) {
      setQuery("");
    }
  }, [editMode, query]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "f" && (event.ctrlKey || event.metaKey)) {
        if (editMode) {
          return;
        }

        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editMode]);

  const active = data.pages[activePage] ?? defaultData.pages[0];
  const resolvedPageStyle = active.style ?? getDefaultStyleForMode(dark ? "dark" : "light");
  const pageChrome = useMemo(
    () => derivePageChrome(resolvedPageStyle, dark ? "dark" : "light"),
    [dark, resolvedPageStyle],
  );

  const results = useMemo(() => {
    if (!query) {
      return null;
    }

    const lower = query.toLowerCase();
    return active.groups.flatMap((group) =>
      group.bookmarks.filter((bookmark) => bookmark.title.toLowerCase().includes(lower)),
    );
  }, [active.groups, query]);

  const existingUrls = useMemo(
    () =>
      data.pages.flatMap((page) =>
        page.groups.flatMap((group) => group.bookmarks.map((bookmark) => bookmark.url)),
      ),
    [data.pages],
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: dark ? "dark" : "light",
          primary: {
            main: pageChrome.primary,
          },
          text: {
            primary: resolvedPageStyle.textColor,
            secondary: pageChrome.mutedText,
          },
          background: {
            default: pageChrome.background,
            paper: pageChrome.surface,
          },
          divider: pageChrome.border,
        },
        shape: {
          borderRadius: 5,
        },
        typography: {
          fontFamily: '"Inter", "Segoe UI", sans-serif',
          h4: {
            fontWeight: 800,
            letterSpacing: "-0.04em",
          },
        },
        components: {
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: "none",
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              outlined: {
                borderColor: pageChrome.border,
              },
            },
          },
        },
      }),
    [dark, pageChrome, resolvedPageStyle.textColor],
  );

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "bookmarks.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const updateActivePage = (updater: (page: Page) => void) => {
    setData((previous) => {
      const copy = structuredClone(previous);
      updater(copy.pages[activePage]);
      return copy;
    });
  };

  const handleImport = (payload: ImportPayload, mode: ImportMode) => {
    setData((previous) => {
      const copy = structuredClone(previous);

      if (payload.kind === "page") {
        if (mode === "overwrite") {
          copy.pages = [payload.page];
          setActivePage(0);
        } else if (mode === "merge") {
          copy.pages[activePage].groups.push(...payload.page.groups);
        } else {
          copy.pages.push(payload.page);
          setActivePage(copy.pages.length - 1);
        }

        return copy;
      }

      if (mode === "overwrite") {
        copy.pages = payload.data.pages;
        setActivePage(0);
      } else if (mode === "merge") {
        const mergedGroups = payload.data.pages.flatMap((page) => page.groups);
        copy.pages[activePage].groups.push(...mergedGroups);
      } else {
        copy.pages.push(...payload.data.pages);
        setActivePage(copy.pages.length - payload.data.pages.length);
      }

      return copy;
    });
  };

  const handleDialogSubmit = (values: Record<string, string>) => {
    if (!dialogState) {
      return;
    }

    if (dialogState.kind === "add-page") {
      setData((previous) => {
        const copy = structuredClone(previous);
        copy.pages.push(createEmptyPage(values.title));
        return copy;
      });
      setActivePage(data.pages.length);
    } else if (dialogState.kind === "rename-page") {
      updateActivePage((page) => {
        page.title = values.title;
      });
    } else if (dialogState.kind === "header-text") {
      updateActivePage((page) => {
        page.header = {
          mode: "custom",
          text: values.text,
        };
      });
    } else if (dialogState.kind === "add-group") {
      updateActivePage((page) => {
        page.groups.push({
          type: "group",
          title: values.title,
          bookmarks: [],
        });
      });
    }

    setDialogState(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100%",
          bgcolor: "background.default",
          color: "text.primary",
          py: { xs: 2, md: 3 },
        }}
      >
        <Container maxWidth="xl">
          <Importer
            existingUrls={existingUrls}
            onImport={handleImport}
            renderTrigger={({ openHtmlImport, openJsonImport }) => (
              <Header
                heading={editMode ? active.title : getPageHeading(active)}
                pages={data.pages.map((page) => page.title)}
                active={activePage}
                onPageChange={setActivePage}
                columns={active.columns}
                onColumnsChange={(value) => {
                  updateActivePage((page) => {
                    page.columns = value;
                  });
                }}
                editMode={editMode}
                setEditMode={setEditMode}
                dark={dark}
                setDark={setDark}
                onExport={exportJson}
                onAddPage={() => {
                  setDialogState({
                    kind: "add-page",
                    title: "Add page",
                    confirmLabel: "Add page",
                    fields: [
                      {
                        key: "title",
                        label: "Page title",
                        initialValue: `Page ${data.pages.length + 1}`,
                        required: true,
                        autoFocus: true,
                      },
                    ],
                  });
                }}
                onRenamePage={() => {
                  setDialogState({
                    kind: "rename-page",
                    title: "Rename page",
                    confirmLabel: "Save",
                    fields: [
                      {
                        key: "title",
                        label: "Page title",
                        initialValue: active.title,
                        required: true,
                        autoFocus: true,
                      },
                    ],
                  });
                }}
                onDeletePage={async () => {
                  if (data.pages.length <= 1) {
                    return;
                  }

                  const confirmed = await confirm({
                    title: `Delete "${active.title}"?`,
                    description: "This page and all of its groups and bookmarks will be removed.",
                    confirmLabel: "Delete",
                    confirmColor: "error",
                  });

                  if (!confirmed) {
                    return;
                  }

                  setData((previous) => {
                    const copy = structuredClone(previous);
                    copy.pages.splice(activePage, 1);
                    return copy;
                  });
                  setActivePage((current) => Math.max(0, current - 1));
                }}
                onEditPageTheme={() => {
                  setDraftPageStyle(active.style ?? getDefaultStyleForMode(dark ? "dark" : "light"));
                  setPageThemeDialogOpen(true);
                }}
                onUsePageTitle={() => {
                  updateActivePage((page) => {
                    page.header = {
                      mode: "page-title",
                      text: "",
                    };
                  });
                }}
                onSetCustomHeader={() => {
                  setDialogState({
                    kind: "header-text",
                    title: "Set header text",
                    confirmLabel: "Save",
                    fields: [
                      {
                        key: "text",
                        label: "Header text",
                        initialValue: active.header.mode === "custom" ? active.header.text : active.title,
                        required: true,
                        autoFocus: true,
                      },
                    ],
                  });
                }}
                importControls={
                  <>
                    <Typography sx={{ px: 2, pt: 1, pb: 0.5 }} variant="caption" color="text.secondary">
                      Import
                    </Typography>
                    <MenuItem onClick={openJsonImport}>Import JSON</MenuItem>
                    <MenuItem onClick={openHtmlImport}>Import browser bookmarks</MenuItem>
                  </>
                }
              />
            )}
          />

          <Box
            sx={{
              mt: 2,
              display: "grid",
              justifyItems: "center",
              gap: 1,
            }}
          >
            <TextField
              id="search"
              placeholder={editMode ? "Search is disabled in edit mode" : "Search bookmarks"}
              value={editMode ? "" : query}
              inputRef={searchInputRef}
              disabled={editMode}
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
              sx={{
                width: "100%",
                maxWidth: 560,
                "& .MuiOutlinedInput-root": {
                  color: resolvedPageStyle.textColor,
                  backgroundColor: rgba(resolvedPageStyle.cardColor, dark ? 0.32 : 0.48),
                  borderRadius: "6px",
                  "& fieldset": {
                    borderColor: pageChrome.border,
                  },
                  "&:hover fieldset": {
                    borderColor: rgba(resolvedPageStyle.textColor, 0.28),
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: pageChrome.primary,
                  },
                },
                "& .MuiInputBase-input::placeholder": {
                  color: pageChrome.mutedText,
                  opacity: 1,
                },
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon sx={{ color: pageChrome.mutedText }} />
                    </InputAdornment>
                  ),
                  endAdornment: query ? (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="Clear search"
                        edge="end"
                        onClick={() => setQuery("")}
                        sx={{ color: pageChrome.mutedText }}
                      >
                        <ClearRoundedIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : undefined,
                },
              }}
              onKeyDown={(event) => {
                if (editMode) {
                  return;
                }

                if (event.key === "Escape") {
                  event.preventDefault();
                  setQuery("");
                  return;
                }

                if (event.key === "Enter" && results && results.length > 0) {
                  event.preventDefault();
                  window.location.href = results[0].url;
                }
              }}
            />
            {!!query && (
              <Typography variant="body2" sx={{ color: pageChrome.mutedText }}>
                {results?.length === 1
                  ? "1 match. Press Enter to open it."
                  : `${results?.length ?? 0} matches`}
              </Typography>
            )}
          </Box>

          <Box sx={{ mt: 2.5 }}>
            <PageView
              page={active}
              pageIndex={activePage}
              editMode={editMode}
              inheritedStyle={resolvedPageStyle}
              query={query}
              setData={setData}
            />
          </Box>
        </Container>

        {editMode && (
          <Stack
            direction="row"
            spacing={1.25}
            sx={{
              position: "fixed",
              right: { xs: 16, md: 24 },
              bottom: { xs: 16, md: 24 },
              zIndex: theme.zIndex.fab,
            }}
          >
            <Fab
              color="secondary"
              variant="extended"
              onClick={() =>
                setDialogState({
                  kind: "add-group",
                  title: "Add group",
                  confirmLabel: "Add group",
                  fields: [
                    {
                      key: "title",
                      label: "Group title",
                      initialValue: `Group ${active.groups.length + 1}`,
                      required: true,
                      autoFocus: true,
                    },
                  ],
                })
              }
              sx={{ fontWeight: 700, borderRadius: "5px" }}
            >
              <AddRoundedIcon sx={{ mr: 1 }} />
              Group
            </Fab>
            <Fab
              color="primary"
              variant="extended"
              onClick={() => setEditMode(false)}
              sx={{ fontWeight: 700, borderRadius: "5px" }}
            >
              <SaveRoundedIcon sx={{ mr: 1 }} />
              Save
            </Fab>
          </Stack>
        )}
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
        open={pageThemeDialogOpen}
        title="Page theme"
        draftStyle={draftPageStyle}
        onClose={() => setPageThemeDialogOpen(false)}
        onChange={setDraftPageStyle}
        onReset={() => {
          updateActivePage((page) => {
            delete page.style;
          });
          setDraftPageStyle(getDefaultStyleForMode(dark ? "dark" : "light"));
          setPageThemeDialogOpen(false);
        }}
        onSave={() => {
          updateActivePage((page) => {
            page.style = { ...draftPageStyle };
          });
          setPageThemeDialogOpen(false);
        }}
      />
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <ConfirmDialogProvider>
      <AppContent />
    </ConfirmDialogProvider>
  );
}
