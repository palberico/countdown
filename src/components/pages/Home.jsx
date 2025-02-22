// src/pages/Home.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  IconButton,
  Typography,
  Backdrop,
  CircularProgress,
  Snackbar,
  Alert,
  Button,
} from "@mui/material";
import EventSelectionModal from "../EventSelectionModal";
import EventSetupModal from "../EventSetupModal";
import CountdownDisplay from "../CountdownDisplay";
import LoginModal from "../LoginModal";

import { useFirebase } from "../context/FirebaseContext";
import { collection, getDocs, addDoc } from "firebase/firestore";

// Icons
import AddIcon from "@mui/icons-material/Add";
import ListIcon from "@mui/icons-material/List";

function Home() {
  const { db, user, logout } = useFirebase(); // <-- get logout function
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [selectionModalOpen, setSelectionModalOpen] = useState(false);
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // Loading & notifications
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const showNotification = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        let fetchedEvents = [];
        if (!db) {
          // No Firestore: use local mock
          fetchedEvents = [
            { id: "1", name: "Cruise", date: "2025-04-01T00:00:00" },
            { id: "2", name: "Disneyland", date: "2025-05-15T10:30:00" },
          ];
          showNotification("Loaded mock events (no Firestore).");
        } else {
          const querySnapshot = await getDocs(collection(db, "events"));
          querySnapshot.forEach((doc) => {
            fetchedEvents.push({ id: doc.id, ...doc.data() });
          });
          showNotification("Events loaded successfully from Firestore!");
        }

        // Filter out past events if desired
        const now = new Date();
        const upcomingEvents = fetchedEvents.filter(
          (ev) => new Date(ev.date) >= now
        );

        // Sort by soonest date
        upcomingEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
        setEvents(upcomingEvents);

        // Default to earliest
        if (upcomingEvents.length > 0) {
          setSelectedEvent(upcomingEvents[0]);
        } else {
          setSelectedEvent(null);
        }
      } catch (error) {
        console.error(error);
        showNotification("Error fetching events!", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [db]);

  // Add Event (check login)
  const handleOpenEventSetup = () => {
    if (!user) {
      setLoginModalOpen(true);
    } else {
      setSetupModalOpen(true);
    }
  };

  // If user logs in, open event modal
  const handleLoginModalClose = () => {
    setLoginModalOpen(false);
    if (user) {
      setSetupModalOpen(true);
    }
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
  };

  const handleSaveEvent = async (eventData) => {
    setLoading(true);
    try {
      if (!db) {
        // local approach
        const newEvent = {
          id: `${events.length + 1}`,
          ...eventData,
        };
        const newEvents = [...events, newEvent];
        newEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
        setEvents(newEvents);
        setSelectedEvent(newEvents[0]);
        showNotification("Event added (local)!");
      } else {
        // Firestore
        const docRef = await addDoc(collection(db, "events"), eventData);
        const newEvent = { id: docRef.id, ...eventData };
        const newEvents = [...events, newEvent];

        // Re-sort
        newEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
        setEvents(newEvents);
        setSelectedEvent(newEvents[0]);
        showNotification("Event saved to Firestore!");
      }
    } catch (error) {
      console.error(error);
      showNotification("Error saving event!", "error");
    } finally {
      setLoading(false);
    }
  };

  const getTargetDate = () => {
    if (!selectedEvent) return new Date();
    return new Date(selectedEvent.date);
  };

  // Handler for logging out
  const handleLogout = async () => {
    try {
      await logout();
      showNotification("Logged out successfully!");
    } catch (err) {
      console.error(err);
      showNotification("Error during logout.", "error");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      {/* LOGOUT BUTTON (only if logged in) */}
      {user && (
        <Button
          variant="outlined"
          size="small"
          onClick={handleLogout}
          sx={{ position: "absolute", top: 20, right: 20 }}
        >
          Log Out
        </Button>
      )}

        {/* Event Name */}
        <Typography variant="h4" mb={2}>
          {selectedEvent ? selectedEvent.name : "No Event Selected"}
        </Typography>

      {/* BIG COUNTDOWN (70% screen width) */}
      {selectedEvent && (
        <Box
        sx={{
          width: {
            xs: "90vw",  // 90% width on mobile
            sm: "70vw",  // 70% on small+ screens
          },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <CountdownDisplay targetDate={getTargetDate()} />
      </Box>
      
      )}

      {/* Hidden Access Point - Bottom Right */}
      <IconButton
        onClick={() => setSelectionModalOpen(true)}
        sx={{
          position: "absolute",
          bottom: 20,
          right: 20,
          opacity: 0.2,
          "&:hover": { opacity: 1 },
        }}
      >
        <ListIcon />
      </IconButton>

      {/* Hidden Access Point - Bottom Left */}
      <IconButton
        onClick={handleOpenEventSetup}
        sx={{
          position: "absolute",
          bottom: 20,
          left: 20,
          opacity: 0.2,
          "&:hover": { opacity: 1 },
        }}
      >
        <AddIcon />
      </IconButton>

      {/* Modals */}
      <EventSelectionModal
        open={selectionModalOpen}
        onClose={() => setSelectionModalOpen(false)}
        events={events}
        onSelectEvent={handleSelectEvent}
      />
      <EventSetupModal
        open={setupModalOpen}
        onClose={() => setSetupModalOpen(false)}
        onSave={handleSaveEvent}
      />
      <LoginModal open={loginModalOpen} onClose={handleLoginModalClose} />

      {/* Loading Spinner */}
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      {/* Notification Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Home;
