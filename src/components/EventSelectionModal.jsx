// src/EventSelectionModal.jsx
import React from "react";
import { Box, Modal, Typography, List, ListItem, ListItemButton } from "@mui/material";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  p: {
    xs: 2, // smaller padding on extra-small (mobile) screens
    sm: 4, // larger padding on small+ screens
  },
  outline: "none",
  borderRadius: 2,  // Rounded corners
  width: {
    xs: "90vw",      // 90% viewport width on mobile
    sm: 400,         // fixed width on small+ screens
  },
  maxWidth: "95vw",  // ensure it doesn't exceed screen width on small devices
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
                {eventItem.name}
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Modal>
  );
}

export default EventSelectionModal;
