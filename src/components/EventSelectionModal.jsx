// src/EventSelectionModal.jsx
import React from "react";
import { Box, Modal, Typography, List, ListItem, ListItemButton } from "@mui/material";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  p: { xs: 2, sm: 4 },
  outline: "none",
  borderRadius: 2,
  width: { xs: "90vw", sm: 400 },
  maxWidth: "95vw",
};

function EventSelectionModal({ open, onClose, events, onSelectEvent }) {
  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle}>
        <Typography variant="h6" mb={2}>
          Select Countdown
        </Typography>
        <List>
          {events.map((eventItem) => (
            <ListItem key={eventItem.id || eventItem.name} disablePadding>
              <ListItemButton
                onClick={() => {
                  onSelectEvent(eventItem);
                  onClose();
                }}
              >
                <Box>
                  <Typography variant="body1">
                    {eventItem.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(eventItem.date).toLocaleDateString()}
                  </Typography>
                </Box>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Modal>
  );
}

export default EventSelectionModal;
