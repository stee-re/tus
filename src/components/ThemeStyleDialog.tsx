import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { findThemePreset, GROUP_THEME_PRESETS } from "../themePresets";
import type { GroupStyle } from "../types";

type ThemeStyleDialogProps = {
  open: boolean;
  title: string;
  draftStyle: GroupStyle;
  onClose: () => void;
  onChange: (style: GroupStyle) => void;
  onReset: () => void;
  onSave: () => void;
};

export default function ThemeStyleDialog({
  open,
  title,
  draftStyle,
  onClose,
  onChange,
  onReset,
  onSave,
}: ThemeStyleDialogProps) {
  const activePresetId = findThemePreset(draftStyle)?.id ?? "custom";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent sx={{ display: "grid", gap: 2, pt: 1.5 }}>
        <FormControl fullWidth>
          <Select
            displayEmpty
            value={activePresetId}
            onChange={(event) => {
              const nextPreset = GROUP_THEME_PRESETS.find(
                (preset) => preset.id === event.target.value,
              );

              if (nextPreset) {
                onChange(nextPreset.style);
              }
            }}
          >
            <MenuItem value="custom">Custom</MenuItem>
            {GROUP_THEME_PRESETS.map((preset) => (
              <MenuItem key={preset.id} value={preset.id}>
                {preset.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Stack spacing={1}>
          <Typography variant="caption" color="text.secondary">
            Preset palette
          </Typography>
          <Box
            sx={{
              display: "grid",
              gap: 1,
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            }}
          >
            {GROUP_THEME_PRESETS.map((preset) => (
              <Button
                key={preset.id}
                variant={activePresetId === preset.id ? "contained" : "outlined"}
                onClick={() => onChange(preset.style)}
                sx={{
                  justifyContent: "flex-start",
                  textTransform: "none",
                  borderRadius: "5px",
                  px: 1,
                  py: 0.75,
                  color: preset.style.textColor,
                  backgroundColor: activePresetId === preset.id ? preset.style.cardColor : "transparent",
                  borderColor: preset.style.tileColor,
                  "&:hover": {
                    backgroundColor: preset.style.cardColor,
                    borderColor: preset.style.tileColor,
                  },
                }}
              >
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <Stack direction="row" spacing={0.4}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "999px",
                        backgroundColor: preset.style.cardColor,
                        border: "1px solid rgba(0,0,0,0.18)",
                      }}
                    />
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "999px",
                        backgroundColor: preset.style.tileColor,
                        border: "1px solid rgba(0,0,0,0.18)",
                      }}
                    />
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "999px",
                        backgroundColor: preset.style.textColor,
                        border: "1px solid rgba(0,0,0,0.18)",
                      }}
                    />
                  </Stack>
                  <Typography variant="body2" noWrap>
                    {preset.name}
                  </Typography>
                </Stack>
              </Button>
            ))}
          </Box>
        </Stack>

        <TextField
          label="Card color"
          type="color"
          value={draftStyle.cardColor}
          onChange={(event) => onChange({ ...draftStyle, cardColor: event.target.value })}
          fullWidth
        />
        <TextField
          label="Bookmark tile color"
          type="color"
          value={draftStyle.tileColor}
          onChange={(event) => onChange({ ...draftStyle, tileColor: event.target.value })}
          fullWidth
        />
        <TextField
          label="Text color"
          type="color"
          value={draftStyle.textColor}
          onChange={(event) => onChange({ ...draftStyle, textColor: event.target.value })}
          fullWidth
        />
      </DialogContent>
      <DialogActions sx={{ justifyContent: "space-between", px: 3, pb: 2 }}>
        <Button onClick={onReset}>Reset</Button>
        <Stack direction="row" spacing={1}>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="contained" onClick={onSave}>
            Save
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
