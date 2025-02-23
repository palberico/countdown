// src/CountdownDisplay.jsx
import React, { useEffect } from "react";
import useCountdown from "../components/hooks/useCountdown";
import { Box, Typography } from "@mui/material";

function CountdownDisplay({ targetDate, eventId, countdownMode, onCountdownFinish }) {
  const timeLeft = useCountdown(targetDate);

  useEffect(() => {
    if (timeLeft <= 0 && eventId && onCountdownFinish) {
      onCountdownFinish(eventId);
    }
  }, [timeLeft, eventId, onCountdownFinish]);

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
              xs: "8vh",
              sm: "8vh",
            },
          }}
        >
          It's here!
        </Typography>
      </Box>
    );
  }

  // Convert ms -> time units
  const totalSeconds = Math.floor(timeLeft / 1000);
  const secs = totalSeconds % 60;
  const mins = Math.floor((totalSeconds / 60) % 60);
  const hrs = Math.floor((totalSeconds / 3600) % 24);
  const days = Math.floor(totalSeconds / 86400);

  // If < 1 day left, ALWAYS show h/m/s
  if (days < 1) {
    // hours / minutes / seconds
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
              xs: "20vh",
              sm: "35vh",
            },
            lineHeight: 1,
            margin: 0,
            padding: 0,
          }}
        >
          {hrs}h {mins}m {secs}s
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

  // If 1 day or more
  if (countdownMode === "days") {
    // Show days
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
              xs: "30vh",
              sm: "60vh",
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
    // countdownMode === "hms" => convert entire time to hours + min + sec
    // totalHours = days*24 + hrs
    const totalHours = days * 24 + hrs;
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
              xs: "20vh",
              sm: "25vh",
            },
            lineHeight: 1,
            margin: 0,
            padding: 0,
          }}
        >
          {totalHours}h {mins}m {secs}s
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
