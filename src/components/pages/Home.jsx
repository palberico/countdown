// src/pages/Home.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
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
  updateDoc,
} from "firebase/firestore";

import AddIcon from "@mui/icons-material/Add";
import ListIcon from "@mui/icons-material/List";

import Confetti from "react-confetti";
import { getEventPhase } from "../utils/time";

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

  // Confetti and deletion scheduling
  const [showConfetti, setShowConfetti] = useState(false);
  const deleteTimerRef = useRef(null);

  // Countdown view mode
  const [countdownMode, setCountdownMode] = useState("days");

  // Helper: Show a notification
  const showNotification = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };
  const handleCloseSnackbar = () => setSnackbarOpen(false);

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        let fetchedEvents = [];
        if (!db) {
          fetchedEvents = [
            { id: "1", name: "Cruise", date: "2025-04-01T00:00:00", createdBy: "demo" },
            { id: "2", name: "Disneyland", date: "2025-05-15T10:30:00", createdBy: "demo" },
          ];
        } else {
          const querySnapshot = await getDocs(collection(db, "events"));
          querySnapshot.forEach((docSnap) => {
            fetchedEvents.push({ id: docSnap.id, ...docSnap.data() });
          });
        }

        // Remove any items more than 6 hours past the end, but only if owned by the current user
        const now = Date.now();
        const keep = [];
        const toDelete = [];

        for (const e of fetchedEvents) {
          const phase = getEventPhase(e.date, now).phase;
          if (phase === "expired") {
            if (user?.uid && e.createdBy === user.uid) {
              toDelete.push(e.id);
            }
            // Always hide expired items from view
          } else {
            keep.push(e);
          }
        }

        if (db && toDelete.length > 0) {
          await Promise.allSettled(
            toDelete.map((id) => deleteDoc(doc(db, "events", id)))
          );
        }

        keep.sort((a, b) => new Date(a.date) - new Date(b.date));
        setEvents(keep);
        setSelectedEvent(keep.length ? keep[0] : null);
      } catch (error) {
        console.error(error);
        showNotification("Error fetching events!", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
    // Re-run when user changes so ownership cleanup applies correctly
  }, [db, user]);

  // Login / logout
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

  // Add / save event
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
        const newEvent = { id: `${events.length + 1}`, ...eventData, createdBy: user?.uid || "demo" };
        const newEvents = [...events, newEvent].sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        );
        setEvents(newEvents);
        setSelectedEvent(newEvents[0]);
        showNotification("Event added (local)!");
      } else {
        const payload = { ...eventData, createdBy: user.uid };
        const docRef = await addDoc(collection(db, "events"), payload);
        const newEvent = { id: docRef.id, ...payload };
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

  // Select event
  const handleSelectEvent = (event) => {
    if (deleteTimerRef.current) {
      clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = null;
    }
    setShowConfetti(false);

    setCountdownMode("days");
    setSelectedEvent(event);
  };

  // Toggle countdown view
  const handleEventNameClick = () => {
    if (!selectedEvent) return;
    const distanceMs = new Date(selectedEvent.date).getTime() - Date.now();
    const daysLeft = Math.floor(distanceMs / (1000 * 60 * 60 * 24));
    if (daysLeft < 1) return;
    setCountdownMode((prev) => (prev === "days" ? "hms" : "days"));
  };

  // Delete helper with ownership check
  const deleteEventById = async (eventId) => {
    try {
      const target = events.find((e) => e.id === eventId);
      if (!target) return;
      if (!user || target.createdBy !== user.uid) {
        showNotification("You can only delete events you created", "error");
        return;
      }

      if (db) {
        await deleteDoc(doc(db, "events", eventId));
      }
      setEvents((prev) => {
        const updated = prev.filter((e) => e.id !== eventId);
        updated.sort((a, b) => new Date(a.date) - new Date(b.date));
        if (selectedEvent && selectedEvent.id === eventId) {
          setSelectedEvent(updated[0] || null);
        }
        return updated;
      });
      showNotification("Event deleted");
    } catch (err) {
      console.error("Error deleting event:", err);
      showNotification("Delete failed", "error");
    }
  };

  // Edit helper with ownership check
  const handleUpdateEvent = async (eventId, updates) => {
    try {
      const target = events.find((e) => e.id === eventId);
      if (!target) return;
      if (!user || target.createdBy !== user.uid) {
        showNotification("You can only edit events you created", "error");
        return;
      }

      if (db) {
        await updateDoc(doc(db, "events", eventId), {
          name: updates.name,
          date: updates.date,
        });
      }

      setEvents((prev) => {
        const updated = prev.map((e) =>
          e.id === eventId ? { ...e, name: updates.name, date: updates.date } : e
        );
        updated.sort((a, b) => new Date(a.date) - new Date(b.date));
        // Keep selection sensible
        if (selectedEvent) {
          const newSel = updated.find((e) => e.id === selectedEvent.id) || updated[0] || null;
          setSelectedEvent(newSel);
        }
        return updated;
      });
      showNotification("Event updated");
    } catch (err) {
      console.error("Error updating event:", err);
      showNotification("Update failed", "error");
    }
  };

  // Countdown finished callback from CountdownDisplay
  const handleCountdownFinish = (eventId) => {
    if (!selectedEvent || selectedEvent.id !== eventId) return;

    const { phase, remainingMs } = getEventPhase(selectedEvent.date, Date.now());
    if (phase !== "celebrate") return;

    setShowConfetti(true);

    if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    deleteTimerRef.current = setTimeout(async () => {
      setShowConfetti(false);
      // Only the owner’s client will be allowed to delete. Others will just stop seeing it.
      await deleteEventById(eventId);
      deleteTimerRef.current = null;
    }, Math.max(0, remainingMs));
  };

  // Keep celebration and deletion logic correct on load and when changing events
  useEffect(() => {
    if (deleteTimerRef.current) {
      clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = null;
    }
    setShowConfetti(false);

    if (!selectedEvent) return;

    const now = Date.now();
    const { phase, remainingMs } = getEventPhase(selectedEvent.date, now);

    if (phase === "celebrate") {
      setShowConfetti(true);
      deleteTimerRef.current = setTimeout(async () => {
        setShowConfetti(false);
        await deleteEventById(selectedEvent.id);
        deleteTimerRef.current = null;
      }, remainingMs);
    }

    if (phase === "expired") {
      // Hide immediately. Delete only if owner, handled inside deleteEventById
      deleteEventById(selectedEvent.id);
    }

    return () => {
      if (deleteTimerRef.current) {
        clearTimeout(deleteTimerRef.current);
        deleteTimerRef.current = null;
      }
      setShowConfetti(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEvent]);

  // Hide fully expired items from any view
  const visibleEvents = useMemo(() => {
    const now = Date.now();
    return events.filter((e) => getEventPhase(e.date, now).phase !== "expired");
  }, [events]);

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
      {showConfetti ? (
        <Confetti style={{ pointerEvents: "none" }} run={true} recycle={true} />
      ) : null}

      <Typography
        variant="h4"
        sx={{ mt: 6, mb: -2, cursor: "pointer", userSelect: "none" }}
        onClick={handleEventNameClick}
      >
        {selectedEvent ? selectedEvent.name : "No Event Selected"}
      </Typography>

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
        <IconButton
          onClick={handleOpenEventSetup}
          sx={{ opacity: 0.2, "&:hover": { opacity: 1 } }}
        >
          <AddIcon />
        </IconButton>

        {user && (
          <Button variant="outlined" size="small" onClick={handleLogout}>
            Log Out
          </Button>
        )}

        <IconButton
          onClick={() => setSelectionModalOpen(true)}
          sx={{ opacity: 0.2, "&:hover": { opacity: 1 } }}
        >
          <ListIcon />
        </IconButton>
      </Box>

      <EventSelectionModal
        open={selectionModalOpen}
        onClose={() => setSelectionModalOpen(false)}
        events={visibleEvents}
        onSelectEvent={handleSelectEvent}
        currentUserUid={user?.uid || null}
        onEdit={handleUpdateEvent}
        onDelete={deleteEventById}
      />
      <EventSetupModal
        open={setupModalOpen}
        onClose={() => setSetupModalOpen(false)}
        onSave={handleSaveEvent}
      />
      <LoginModal open={loginModalOpen} onClose={handleLoginModalClose} />

      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

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
