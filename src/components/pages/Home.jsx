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
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

// Icons
import AddIcon from "@mui/icons-material/Add";
import ListIcon from "@mui/icons-material/List";

// Confetti
import Confetti from "react-confetti";

function Home() {
  const { db, user, logout } = useFirebase();

  // Events + Selected
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Modals
  const [selectionModalOpen, setSelectionModalOpen] = useState(false);
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // Loading & Notifications
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  // Confetti
  const [confettiEventId, setConfettiEventId] = useState(null);
  const [confettiTimeoutId, setConfettiTimeoutId] = useState(null);

  // Helper: Show a notification
  const showNotification = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };
  const handleCloseSnackbar = () => setSnackbarOpen(false);

  // =========================
  // ========== FETCH =========
  // =========================
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        let fetchedEvents = [];
        if (!db) {
          // No Firestore: mock data
          fetchedEvents = [
            { id: "1", name: "Cruise", date: "2025-04-01T00:00:00" },
            { id: "2", name: "Disneyland", date: "2025-05-15T10:30:00" },
          ];
          showNotification("Loaded mock events (no Firestore).");
        } else {
          const querySnapshot = await getDocs(collection(db, "events"));
          querySnapshot.forEach((docSnap) => {
            fetchedEvents.push({ id: docSnap.id, ...docSnap.data() });
          });
          showNotification("Events loaded successfully from Firestore!");
        }

        // Sort by soonest date
        fetchedEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

        setEvents(fetchedEvents);
        // Default to earliest
        setSelectedEvent(fetchedEvents.length ? fetchedEvents[0] : null);
      } catch (error) {
        console.error(error);
        showNotification("Error fetching events!", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [db]);

  // =========================
  // ========== LOGIN/LOGOUT =
  // =========================
  const handleLoginModalClose = () => {
    setLoginModalOpen(false);
    if (user) {
      setSetupModalOpen(true);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      showNotification("Logged out successfully!");
    } catch (err) {
      console.error(err);
      showNotification("Error during logout.", "error");
    }
  };

  // =========================
  // ========== ADD EVENT ====
  // =========================
  const handleOpenEventSetup = () => {
    if (!user) {
      setLoginModalOpen(true);
    } else {
      setSetupModalOpen(true);
    }
  };

  const handleSaveEvent = async (eventData) => {
    setLoading(true);
    try {
      if (!db) {
        // Local
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

  // =========================
  // ========== SELECT EVENT =
  // =========================
  const handleSelectEvent = (event) => {
    // If there's an active confetti for a different event, stop it
    if (confettiEventId && confettiEventId !== event.id) {
      if (confettiTimeoutId) {
        clearTimeout(confettiTimeoutId);
        setConfettiTimeoutId(null);
      }
      // Delete old finished event
      deleteEventById(confettiEventId);
      // Stop confetti
      setConfettiEventId(null);
    }
    // Now select the new event
    setSelectedEvent(event);
  };

  // =========================
  // ========== CONFETTI + DELETE LOGIC
  // =========================
  const startConfetti = (eventId) => {
    if (confettiEventId) return; // already celebrating

    setConfettiEventId(eventId);

    // 1-minute timer
    const timer = setTimeout(() => {
      deleteEventById(eventId);
      setConfettiEventId(null);
      setConfettiTimeoutId(null);
    }, 60000);

    setConfettiTimeoutId(timer);
  };

  const deleteEventById = async (eventId) => {
    try {
      if (db) {
        await deleteDoc(doc(db, "events", eventId));
      }
      setEvents((prev) => {
        const updated = prev.filter((e) => e.id !== eventId);
        if (!updated.length) {
          setSelectedEvent(null);
          return [];
        }
        updated.sort((a, b) => new Date(a.date) - new Date(b.date));
        setSelectedEvent(updated[0]);
        return updated;
      });
    } catch (err) {
      console.error("Error deleting event:", err);
    }
  };

  // If user loads and event is already past time, confetti triggers
  useEffect(() => {
    if (selectedEvent) {
      const distance = new Date(selectedEvent.date).getTime() - Date.now();
      if (distance <= 0 && !confettiEventId) {
        startConfetti(selectedEvent.id);
      }
    }
    return () => {
      if (confettiTimeoutId) clearTimeout(confettiTimeoutId);
    };
  }, [selectedEvent, confettiEventId, confettiTimeoutId]);

  // Called by CountdownDisplay if timeLeft <= 0
  const handleCountdownFinish = (eventId) => {
    startConfetti(eventId);
  };

  // Helper for selected date
  const getTargetDate = () => {
    if (!selectedEvent) return new Date();
    return new Date(selectedEvent.date);
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
      {/* If confettiEventId has a value, we mount Confetti; otherwise, we unmount it */}
      {confettiEventId ? (
        <Confetti
          style={{ pointerEvents: "none" }}
          run={true}
          recycle={true}
        />
      ) : null}

      {/* LOGOUT (only if logged in) */}
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

      {/* Countdown */}
      {selectedEvent && (
        <Box
          sx={{
            width: {
              xs: "90vw",
              sm: "70vw",
            },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <CountdownDisplay
            targetDate={getTargetDate()}
            eventId={selectedEvent.id}
            onCountdownFinish={handleCountdownFinish}
          />
        </Box>
      )}

      {/* Bottom Right => Event Selection */}
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

      {/* Bottom Left => Add Event */}
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
