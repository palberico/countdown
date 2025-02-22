// src/EventSetupModal.jsx
import React, { useState } from "react";
import { Box, Modal, Typography, TextField, Button } from "@mui/material";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  p: {
    xs: 2, // extra-small padding on mobile
    sm: 4, // bigger padding on larger screens
  },
  outline: "none",
  borderRadius: 2,
  width: {
    xs: "90vw", // 90% of viewport width on mobile
    sm: 400, // fixed width on small+ screens
  },
  maxWidth: "95vw", // just in case
};

function EventSetupModal({ open, onClose, onSave }) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const handleSave = () => {
    if (name && date) {
      const combinedTime = time || "00:00";
      const isoString = `${date}T${combinedTime}:00`;

      onSave({ name, date: isoString });
      onClose();
      setName("");
      setDate("");
      setTime("");
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle}>
        <Typography variant="h6" mb={2}>
          Add/Edit Event
        </Typography>
        <TextField
          label="Event Name"
          variant="outlined"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          label="Event Date"
          type="date"
          InputLabelProps={{ shrink: true }}
          variant="outlined"
          fullWidth
          value={date}
          onChange={(e) => setDate(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          label="Event Time"
          type="time"
          InputLabelProps={{ shrink: true }}
          variant="outlined"
          fullWidth
          value={time}
          onChange={(e) => setTime(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button variant="contained" onClick={handleSave} fullWidth>
          Save
        </Button>
      </Box>
    </Modal>
  );
}

export default EventSetupModal;
