import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

export type TextPromptField = {
  key: string;
  label: string;
  initialValue?: string;
  required?: boolean;
  type?: string;
  autoFocus?: boolean;
  multiline?: boolean;
  minRows?: number;
};

type TextPromptDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  onClose: () => void;
  onSubmit: (values: Record<string, string>) => void;
  fields: TextPromptField[];
};

export default function TextPromptDialog({
  open,
  title,
  description,
  confirmLabel = "Save",
  onClose,
  onSubmit,
  fields,
}: TextPromptDialogProps) {
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      return;
    }

    setValues(
      Object.fromEntries(fields.map((field) => [field.key, field.initialValue ?? ""])),
    );
  }, [fields, open]);

  const submitDisabled = useMemo(
    () => fields.some((field) => field.required && !values[field.key]?.trim()),
    [fields, values],
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <Box
        component="form"
        onSubmit={(event) => {
          event.preventDefault();
          if (submitDisabled) {
            return;
          }

          onSubmit(
            Object.fromEntries(
              Object.entries(values).map(([key, value]) => [key, value.trim()]),
            ),
          );
        }}
      >
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            {description ? <Typography color="text.secondary">{description}</Typography> : null}
            {fields.map((field) => (
              <TextField
                key={field.key}
                label={field.label}
                value={values[field.key] ?? ""}
                type={field.type ?? "text"}
                autoFocus={field.autoFocus}
                required={field.required}
                multiline={field.multiline}
                minRows={field.minRows}
                onChange={(event) =>
                  setValues((previous) => ({
                    ...previous,
                    [field.key]: event.target.value,
                  }))
                }
                fullWidth
              />
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={submitDisabled}>
            {confirmLabel}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
