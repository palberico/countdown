// src/CountdownDisplay.jsx
import React from "react";
import useCountdown from "../components/hooks/useCountdown";
import { Box, Typography } from "@mui/material";

function CountdownDisplay({ targetDate }) {
  const timeLeft = useCountdown(targetDate);

  if (timeLeft <= 0) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        sx={{ height: "80vh", width: "100%" }}
      >
        <Typography
          variant="h2"
          sx={{
            fontSize: {
              xs: "8vh", // extra-small screens
              sm: "8vh", // small screens and up
            },
          }}
        >
          It's here!
        </Typography>
      </Box>
    );
  }

  // Convert milliseconds into time units
  const totalSeconds = Math.floor(timeLeft / 1000);
  const minutes = Math.floor((totalSeconds / 60) % 60);
  const hours = Math.floor((totalSeconds / 3600) % 24);
  const days = Math.floor(totalSeconds / 86400);

  if (days >= 1) {
    // Show Days
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        sx={{ height: "80vh", width: "100%", overflow: "hidden" }}
      >
        <Typography
          sx={{
            fontSize: {
              xs: "30vh", // mobile: slightly smaller
              sm: "60vh", // larger screens
            },
            lineHeight: 1,
            margin: 0,
            padding: 0,
          }}
        >
          {days}
        </Typography>
        <Typography
          sx={{
            fontSize: {
              xs: "4vh",
              sm: "4vh",
            },
            lineHeight: 1,
          }}
        >
          {days === 1 ? "Day" : "Days"}
        </Typography>
      </Box>
    );
  } else {
    // Under 1 day => show hours/minutes (smaller than days)
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        sx={{ height: "80vh", width: "100%", overflow: "hidden" }}
      >
        <Typography
          sx={{
            fontSize: {
              xs: "20vh", // reduced for mobile
              sm: "35vh", // reduced for larger screens
            },
            lineHeight: 1,
            margin: 0,
            padding: 0,
          }}
        >
          {hours}h {minutes}m
        </Typography>
        <Typography
          sx={{
            fontSize: {
              xs: "4vh",
              sm: "4vh",
            },
            lineHeight: 1,
          }}
        >
          Left
        </Typography>
      </Box>
    );
  }
}

export default CountdownDisplay;
