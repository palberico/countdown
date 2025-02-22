// src/components/LoginModal.jsx
import React, { useState } from "react";
import {
  Box,
  Modal,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  IconButton,
} from "@mui/material";
import { useFirebase } from "../components/context/FirebaseContext";

// Icons
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  p: 4,
  outline: "none",
  width: 300,
  borderRadius: 2, // rounding corners
};

function LoginModal({ open, onClose }) {
  const { signIn } = useFirebase();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      await signIn(email, password); // Email/Password login
      onClose(); // close the modal after successful login
    } catch (err) {
      console.error(err);
      setError(err.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <Modal open={open} onClose={!loading ? onClose : undefined}>
      <Box sx={modalStyle}>
        <Typography variant="h6" mb={2}>
          Please Log In
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          label="Email"
          fullWidth
          sx={{ mb: 2 }}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label="Password"
          type={showPassword ? "text" : "password"}
          fullWidth
          sx={{ mb: 2 }}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          InputProps={{
            endAdornment: (
              <IconButton onClick={toggleShowPassword} edge="end">
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            ),
          }}
        />

        {loading ? (
          <CircularProgress />
        ) : (
          <Button variant="contained" onClick={handleSubmit} fullWidth>
            Log In
          </Button>
        )}
      </Box>
    </Modal>
  );
}

export default LoginModal;
