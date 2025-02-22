// src/components/TimeZoneSelect.jsx
import React from "react";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";

const US_TIMEZONES = [
  { label: "Pacific", value: "America/Los_Angeles" },
  { label: "Mountain", value: "America/Denver" },
  { label: "Central", value: "America/Chicago" },
  { label: "Eastern", value: "America/New_York" },
  { label: "Alaska", value: "America/Anchorage" },
  { label: "Hawaii", value: "Pacific/Honolulu" },
];

function TimeZoneSelect({ value, onChange }) {
  return (
    <FormControl fullWidth>
      <InputLabel id="tz-label">Event Time Zone</InputLabel>
      <Select
        labelId="tz-label"
        value={value}
        label="Event Time Zone"
        onChange={(e) => onChange(e.target.value)}
      >
        {US_TIMEZONES.map((tz) => (
          <MenuItem key={tz.value} value={tz.value}>
            {tz.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default TimeZoneSelect;
