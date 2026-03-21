import { useState, type ReactNode } from "react";
import {
  Box,
  Button,
  FormControl,
  IconButton,
  Menu,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import VerticalAlignTopRoundedIcon from "@mui/icons-material/VerticalAlignTopRounded";

type HeaderProps = {
  heading: string;
  pages: string[];
  active: number;
  onPageChange: (index: number) => void;
  columns: number;
  onColumnsChange: (value: number) => void;
  editMode: boolean;
  setEditMode: (value: boolean) => void;
  dark: boolean;
  setDark: (value: boolean) => void;
  onExport: () => void;
  onAddPage: () => void;
  onRenamePage: () => void;
  onDeletePage: () => void;
  onEditPageTheme: () => void;
  onUsePageTitle: () => void;
  onSetCustomHeader: () => void;
  importControls: ReactNode;
};

export default function Header({
  heading,
  pages,
  active,
  onPageChange,
  columns,
  onColumnsChange,
  editMode,
  setEditMode,
  dark,
  setDark,
  onExport,
  onAddPage,
  onRenamePage,
  onDeletePage,
  onEditPageTheme,
  onUsePageTitle,
  onSetCustomHeader,
  importControls,
}: HeaderProps) {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  return (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      <Stack
        direction={{ xs: "column", lg: "row" }}
        spacing={1.5}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", lg: "center" }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.25}
          alignItems={{ xs: "stretch", sm: "center" }}
          sx={{ minWidth: 0, flex: 1 }}
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
            <Box sx={{ minWidth: 0, pr: { lg: 1 } }}>
              <Typography variant="h4" sx={{ fontSize: { xs: "1.8rem", md: "2.15rem" } }} noWrap>
                {heading}
              </Typography>
            </Box>
            {editMode ? (
              <Stack direction="row" spacing={0.5} alignItems="center">
                <IconButton size="small" onClick={onRenamePage} aria-label="Rename page">
                  <EditRoundedIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={onDeletePage}
                  disabled={pages.length <= 1}
                  aria-label="Delete page"
                >
                  <DeleteOutlineRoundedIcon fontSize="small" />
                </IconButton>
              </Stack>
            ) : null}
          </Stack>

          {!editMode ? (
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
              sx={{ minWidth: 0, flex: 1 }}
            >
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <Select value={active} onChange={(event) => onPageChange(Number(event.target.value))}>
                  {pages.map((page, index) => (
                    <MenuItem key={`${page}-${index}`} value={index}>
                      {page}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ minWidth: 0 }}>
                {pages.map((page, index) => (
                  <Button
                    key={`${page}-${index}-button`}
                    variant={index === active ? "contained" : "outlined"}
                    size="small"
                    onClick={() => onPageChange(index)}
                  >
                    {page}
                  </Button>
                ))}
              </Stack>
            </Stack>
          ) : null}
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end" flexWrap="wrap">
          {editMode && (
            <FormControl size="small" sx={{ minWidth: 88 }}>
              <Select
                value={columns}
                onChange={(event) => onColumnsChange(Number(event.target.value))}
              >
                {[1, 2, 3, 4, 5, 6].map((count) => (
                  <MenuItem key={count} value={count}>
                    {count} cols
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <IconButton
            aria-label="Open settings"
            onClick={(event) => setMenuAnchor(event.currentTarget)}
            sx={{ border: "1px solid", borderColor: "divider" }}
          >
            <MoreVertRoundedIcon />
          </IconButton>
        </Stack>
      </Stack>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem
          onClick={() => {
            setEditMode(!editMode);
            setMenuAnchor(null);
          }}
        >
          <EditRoundedIcon fontSize="small" sx={{ mr: 1 }} />
          {editMode ? "Exit edit mode" : "Enter edit mode"}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setDark(!dark);
            setMenuAnchor(null);
          }}
        >
          {dark ? (
            <LightModeRoundedIcon fontSize="small" sx={{ mr: 1 }} />
          ) : (
            <DarkModeRoundedIcon fontSize="small" sx={{ mr: 1 }} />
          )}
          {dark ? "Light mode" : "Dark mode"}
        </MenuItem>
        <MenuItem
          onClick={() => {
            onEditPageTheme();
            setMenuAnchor(null);
          }}
        >
          <PaletteRoundedIcon fontSize="small" sx={{ mr: 1 }} />
          Page theme
        </MenuItem>
        <MenuItem
          onClick={() => {
            onSetCustomHeader();
            setMenuAnchor(null);
          }}
        >
          <VerticalAlignTopRoundedIcon fontSize="small" sx={{ mr: 1 }} />
          Set custom header text
        </MenuItem>
        <MenuItem
          onClick={() => {
            onUsePageTitle();
            setMenuAnchor(null);
          }}
        >
          Use page title in header
        </MenuItem>
        {importControls}
        {editMode && (
          <MenuItem
            onClick={() => {
              onAddPage();
              setMenuAnchor(null);
            }}
          >
            <AddRoundedIcon fontSize="small" sx={{ mr: 1 }} />
            Add page
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            onExport();
            setMenuAnchor(null);
          }}
        >
          Export JSON
        </MenuItem>
      </Menu>
    </Box>
  );
}
