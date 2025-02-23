// src/components/EventSetupModal.jsx
import React, { useState } from "react";
import { Box, Modal, Typography, TextField, Button } from "@mui/material";

// Day.js + plugins for time zone handling
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

// New Time Zone Select component
import TimeZoneSelect from "./TimeZoneSelect";

// MATCHES the styling from LoginModal:
const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  p: 4,
  outline: "none",
  width: 300,       // same as in LoginModal
  borderRadius: 2,  // rounding corners
};

function EventSetupModal({ open, onClose, onSave }) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  // Default to "America/Los_Angeles" for a California cruise
  const [tz, setTz] = useState("America/Los_Angeles");

  const handleSave = () => {
    if (name && date) {
      // Combine date + time into a local string, e.g. "2025-04-04 10:00"
      const combinedTime = time || "00:00";
      const dateString = `${date} ${combinedTime}`;

      // Parse it in the chosen time zone
      const dateTz = dayjs.tz(dateString, tz);

      // Convert to UTC, format as ISO
      const dateUtc = dateTz.utc();
      const isoString = dateUtc.format(); // e.g. "2025-04-04T17:00:00Z"

      onSave({ name, date: isoString });
      onClose();

      // Reset fields
      setName("");
      setDate("");
      setTime("");
      setTz("America/Los_Angeles"); // or keep previous selection
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

        {/* Time Zone Dropdown */}
        <TimeZoneSelect value={tz} onChange={setTz} />

        <Button variant="contained" onClick={handleSave} fullWidth sx={{ mt: 2 }}>
          Save
        </Button>
      </Box>
    </Modal>
  );
}

export default EventSetupModal;
