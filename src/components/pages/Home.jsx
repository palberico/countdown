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

  // Events and selection state
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Modal controls
  const [selectionModalOpen, setSelectionModalOpen] = useState(false);
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // Loading & notifications
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  // Confetti & Deletion state
  const [finishedEventId, setFinishedEventId] = useState(null);
  const [confettiEventId, setConfettiEventId] = useState(null);
  const [confettiTimeoutId, setConfettiTimeoutId] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false); // New state to control confetti visibility

  // Countdown view mode
  const [countdownMode, setCountdownMode] = useState("days");

  // Helper: Show a notification
  const showNotification = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };
  const handleCloseSnackbar = () => setSnackbarOpen(false);

  // ============================
  // ===== FETCH EVENTS =========
  // ============================
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        let fetchedEvents = [];
        if (!db) {
          fetchedEvents = [
            { id: "1", name: "Cruise", date: "2025-04-01T00:00:00" },
            { id: "2", name: "Disneyland", date: "2025-05-15T10:30:00" },
          ];
        } else {
          const querySnapshot = await getDocs(collection(db, "events"));
          querySnapshot.forEach((docSnap) => {
            fetchedEvents.push({ id: docSnap.id, ...docSnap.data() });
          });
        }
        fetchedEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
        setEvents(fetchedEvents);
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

  // ============================
  // ===== LOGIN / LOGOUT =======
  // ============================
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

  // ============================
  // ===== ADD / SAVE EVENT =====
  // ============================
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
        const newEvent = { id: `${events.length + 1}`, ...eventData };
        const newEvents = [...events, newEvent].sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        );
        setEvents(newEvents);
        setSelectedEvent(newEvents[0]);
        showNotification("Event added (local)!");
      } else {
        const docRef = await addDoc(collection(db, "events"), eventData);
        const newEvent = { id: docRef.id, ...eventData };
        const newEvents = [...events, newEvent].sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        );
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

  // ============================
  // ===== SELECT EVENT =========
  // ============================
  const handleSelectEvent = (event) => {
    if (confettiEventId && confettiEventId !== event.id) {
      setShowConfetti(false); // Stop confetti if switching events
      setConfettiEventId(null);
    }
    setCountdownMode("days");
    setSelectedEvent(event);
  };

  // ============================
  // ===== TOGGLE COUNTDOWN VIEW =
  // ============================
  const handleEventNameClick = () => {
    if (!selectedEvent) return;
    const distanceMs = new Date(selectedEvent.date).getTime() - Date.now();
    const daysLeft = Math.floor(distanceMs / (1000 * 60 * 60 * 24));
    if (daysLeft < 1) return;
    setCountdownMode((prev) => (prev === "days" ? "hms" : "days"));
  };

  // ============================
  // === CONFETTI & DELETION LOGIC =
  // ============================
  const handleCountdownFinish = (eventId) => {
    if (!finishedEventId) {
      setFinishedEventId(eventId);
      setConfettiEventId(eventId);
      setShowConfetti(true); // Start confetti
      const timer = setTimeout(() => {
        setShowConfetti(false); // Stop confetti
        deleteEventById(eventId);
        setFinishedEventId(null);
        setConfettiTimeoutId(null);
        setConfettiEventId(null);
      }, 60000);
      setConfettiTimeoutId(timer);
    }
  };

  const deleteEventById = async (eventId) => {
    try {
      if (db) {
        await deleteDoc(doc(db, "events", eventId));
      }
      setEvents((prev) => {
        const updated = prev.filter((e) => e.id !== eventId);
        if (selectedEvent && selectedEvent.id === eventId) {
          if (updated.length > 0) {
            updated.sort((a, b) => new Date(a.date) - new Date(b.date));
            setSelectedEvent(updated[0]);
          } else {
            setSelectedEvent(null);
          }
        }
        return updated;
      });
    } catch (err) {
      console.error("Error deleting event:", err);
    }
  };

  useEffect(() => {
    if (selectedEvent) {
      const distance = new Date(selectedEvent.date).getTime() - Date.now();
      if (distance <= 0 && !finishedEventId) {
        handleCountdownFinish(selectedEvent.id);
      }
    }
    return () => {
      if (confettiTimeoutId) {
        clearTimeout(confettiTimeoutId);
        setShowConfetti(false); // Ensure confetti stops on cleanup
      }
    };
  }, [selectedEvent, finishedEventId, confettiTimeoutId]);

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
      {/* Conditional Confetti */}
      {showConfetti && confettiEventId ? (
        <Confetti style={{ pointerEvents: "none" }} run={true} recycle={true} />
      ) : null}

      {/* EVENT NAME */}
      <Typography
        variant="h4"
        sx={{ mt: 6, mb: -2, cursor: "pointer", userSelect: "none" }}
        onClick={handleEventNameClick}
      >
        {selectedEvent ? selectedEvent.name : "No Event Selected"}
      </Typography>

      {/* COUNTDOWN */}
      {selectedEvent && (
        <Box
          sx={{
            width: { xs: "90vw", sm: "70vw" },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <CountdownDisplay
            targetDate={getTargetDate()}
            eventId={selectedEvent.id}
            countdownMode={countdownMode}
            onCountdownFinish={handleCountdownFinish}
          />
        </Box>
      )}

      {/* BOTTOM CONTROLS */}
      <Box
        sx={{
          position: "absolute",
          bottom: 20,
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          px: 2,
        }}
      >
        {/* ADD EVENT */}
        <IconButton
          onClick={handleOpenEventSetup}
          sx={{ opacity: 0.2, "&:hover": { opacity: 1 } }}
        >
          <AddIcon />
        </IconButton>

        {/* LOGOUT */}
        {user && (
          <Button variant="outlined" size="small" onClick={handleLogout}>
            Log Out
          </Button>
        )}

        {/* EVENT SELECTION */}
        <IconButton
          onClick={() => setSelectionModalOpen(true)}
          sx={{ opacity: 0.2, "&:hover": { opacity: 1 } }}
        >
          <ListIcon />
        </IconButton>
      </Box>

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

      {/* LOADING SPINNER */}
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      {/* SNACKBAR */}
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