// src/EventSelectionModal.jsx
import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  TextField,
  Stack,
} from "@mui/material";
import ListItemButton from "@mui/material/ListItemButton";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export default function EventSelectionModal({
  open,
  onClose,
  events,
  onSelectEvent,
  currentUserUid,   // string or null
  onEdit,           // (id, { name, date }) => Promise<void>
  onDelete,         // (id) => Promise<void>
}) {
  const [editing, setEditing] = useState(null); // { id, name, date, createdBy }
  const [formName, setFormName] = useState("");
  const [formDate, setFormDate] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const sorted = useMemo(() => {
    const copy = [...(events || [])];
    copy.sort((a, b) => new Date(a.date) - new Date(b.date));
    return copy;
  }, [events]);

  const startEdit = (evt) => {
    setEditing(evt);
    setFormName(evt.name || "");
    // Build datetime-local value in local time, yyyy-MM-ddTHH:mm
    const d = new Date(evt.date);
    const pad = (n) => String(n).padStart(2, "0");
    const local = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setFormDate(local);
  };

  const submitEdit = async () => {
    if (!editing) return;
    // Keep UTC with Z to avoid shifting by timezone
    const isoUtc = new Date(formDate).toISOString();
    await onEdit?.(editing.id, { name: formName, date: isoUtc });
    setEditing(null);
  };

  const cancelEdit = () => setEditing(null);

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    await onDelete?.(confirmDeleteId);
    setConfirmDeleteId(null);
  };

  const handleSelect = (evt) => {
    onSelectEvent?.(evt);
    onClose?.();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Select an event</DialogTitle>

      <DialogContent dividers>
        <List dense>
          {sorted.map((evt) => {
            const isOwner = !!currentUserUid && evt.createdBy === currentUserUid;

            return (
              <ListItem
                key={evt.id}
                disablePadding
                secondaryAction={
                  isOwner ? (
                    <>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEdit(evt);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        edge="end"
                        size="small"
                        sx={{ ml: 1 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(evt.id);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </>
                  ) : null
                }
              >
                <ListItemButton onClick={() => handleSelect(evt)}>
                  <ListItemText
                    primary={evt.name}
                    secondary={new Date(evt.date).toLocaleString()}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>

      {/* Edit dialog */}
      <Dialog open={!!editing} onClose={cancelEdit} fullWidth maxWidth="sm">
        <DialogTitle>Edit event</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              fullWidth
            />
            <TextField
              label="Date and time"
              type="datetime-local"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              helperText="Local time"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelEdit}>Cancel</Button>
          <Button onClick={submitEdit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Delete this event</DialogTitle>
        <DialogContent dividers>
          This can’t be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}

