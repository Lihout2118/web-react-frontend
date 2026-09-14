import { useContext, useEffect, useRef, useState } from "react";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import { DataGrid } from "@mui/x-data-grid";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { UserContext } from "./context/UserContext";

const API_URL = import.meta.env.VITE_API_URL;

export default function UserManagement() {
  const { user } = useContext(UserContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const isInit = useRef(false);

  // Change Password Dialog state
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Add User Dialog state
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [addError, setAddError] = useState("");

  // Feedback Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const showNotification = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/user`, {
        method: "GET",
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.userList || []);
      } else {
        const errData = await response.json().catch(() => ({}));
        showNotification(errData.message || "Failed to load users", "error");
      }
    } catch (error) {
      console.error("Error loading users:", error);
      showNotification("Network error loading users", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isInit.current) return;
    isInit.current = true;
    if (user?.username === "admin") {
      loadUsers();
    }
  }, [user]);

  // Open password dialog for a specific user
  const handleOpenPasswordDialog = (targetUser) => {
    setSelectedUser(targetUser);
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
    setOpenPasswordDialog(true);
  };

  const handleClosePasswordDialog = () => {
    setOpenPasswordDialog(false);
    setSelectedUser(null);
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
  };

  // Submit Password Change
  const handleChangePassword = async () => {
    if (!newPassword || newPassword.trim().length === 0) {
      setPasswordError("Password cannot be empty");
      return;
    }
    if (newPassword.length < 4) {
      setPasswordError("Password must be at least 4 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/user/${selectedUser._id}/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        showNotification(`Password for ${selectedUser.username} updated successfully!`, "success");
        handleClosePasswordDialog();
      } else {
        setPasswordError(data.message || "Failed to update password");
      }
    } catch (error) {
      console.error("Change password error:", error);
      setPasswordError("Network error changing password");
    }
  };

  // Submit Add User
  const handleAddUser = async () => {
    if (!newUsername || !newEmail || !newUserPassword) {
      setAddError("All fields are required");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username: newUsername,
          email: newEmail,
          password: newUserPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showNotification("User created successfully!", "success");
        setOpenAddDialog(false);
        setNewUsername("");
        setNewEmail("");
        setNewUserPassword("");
        setAddError("");
        loadUsers();
      } else {
        setAddError(data.message || "Failed to create user");
      }
    } catch (error) {
      console.error("Create user error:", error);
      setAddError("Network error creating user");
    }
  };

  // Non-admin check
  if (user?.username !== "admin") {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Access Denied: Only Administrator can access User Management.
      </Alert>
    );
  }

  const columns = [
    { field: "username", headerName: "Username", flex: 2 },
    { field: "email", headerName: "Email", flex: 3 },
    {
      field: "actions",
      headerName: "Actions",
      sortable: false,
      filterable: false,
      flex: 2,
      renderCell: (params) => {
        return (
          <Button
            variant="outlined"
            size="small"
            color="primary"
            startIcon={<VpnKeyIcon />}
            onClick={() => handleOpenPasswordDialog(params.row)}
          >
            Change Password
          </Button>
        );
      },
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4 px-1">
        <Typography variant="h6">User Management</Typography>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => {
            setAddError("");
            setOpenAddDialog(true);
          }}
        >
          Add User
        </Button>
      </div>

      <DataGrid
        rows={users}
        columns={columns}
        getRowId={(row) => row._id}
        loading={loading}
        autoHeight
        initialState={{
          pagination: { paginationModel: { pageSize: 5 } },
        }}
        pageSizeOptions={[5, 10, 25]}
      />

      {/* Change Password Dialog */}
      <Dialog open={openPasswordDialog} onClose={handleClosePasswordDialog} fullWidth maxWidth="xs">
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
            Updating password for user: <strong>{selectedUser?.username}</strong> ({selectedUser?.email})
          </Typography>

          {passwordError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {passwordError}
            </Alert>
          )}

          <div className="flex flex-col gap-3">
            <TextField
              required
              fullWidth
              type="password"
              label="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoFocus
            />
            <TextField
              required
              fullWidth
              type="password"
              label="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePasswordDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleChangePassword}>
            Update Password
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog
        open={openAddDialog}
        onClose={() => {
          setOpenAddDialog(false);
          setAddError("");
        }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          {addError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {addError}
            </Alert>
          )}
          <div className="flex flex-col gap-3 mt-1">
            <TextField
              required
              fullWidth
              label="Username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
            />
            <TextField
              required
              fullWidth
              type="email"
              label="Email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
            <TextField
              required
              fullWidth
              type="password"
              label="Password"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddUser}>
            Create User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Toast */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}

