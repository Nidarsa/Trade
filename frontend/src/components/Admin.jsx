import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FiUsers, 
  FiCheckCircle, 
  FiClock, 
  FiDownload, 
  FiDollarSign,
  FiUserCheck,
  FiAlertCircle,
  FiSearch
} from 'react-icons/fi';
import { FaUserShield } from 'react-icons/fa';
import { MdOutlineBalance, MdHistory } from 'react-icons/md';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, TextField, Alert, CircularProgress, ThemeProvider, createTheme, Paper, InputAdornment, Chip
} from '@mui/material';

// Define a custom yellow theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#ffc107', // Yellow shade
      contrastText: '#000000', // Black for text contrast
    },
    background: {
      paper: '#fff8e1', // Light yellow for Card
    },
    success: {
      main: '#ffca28', // Yellow for success alerts
    },
    error: {
      main: '#d32f2f', // Red for error alerts
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          backgroundColor: '#ffc107', // Yellow button background
          color: '#000000', // Black text
          '&:hover': {
            backgroundColor: '#ffca28', // Brighter yellow on hover
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: '#ffc107', // Yellow border
            },
            '&:hover fieldset': {
              borderColor: '#ffca28', // Brighter yellow on hover
            },
            '&.Mui-focused fieldset': {
              borderColor: '#ffca28', // Brighter yellow when focused
            },
          },
          '& .MuiInputLabel-root': {
            color: '#ffc107', // Yellow label
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#ffca28', // Brighter yellow when focused
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        standardSuccess: {
          backgroundColor: '#ffca28', // Yellow for success alerts
          color: '#000000', // Black text
        },
        standardError: {
          backgroundColor: '#d32f2f', // Red for error alerts
          color: '#ffffff', // White text
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: '#ffc107', // Yellow spinner
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: '#fff8e1', // Light yellow for table headers
          color: '#000000',
          fontWeight: 'bold',
        },
        body: {
          color: '#000000',
        },
      },
    },
  },
});

const AdminDashboard = () => {
  const [pendingSellers, setPendingSellers] = useState([]);
  const [approvalHistory, setApprovalHistory] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [balanceUpdate, setBalanceUpdate] = useState({ userId: '', balance: '' });
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch admin data on mount
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Please log in to access the admin dashboard');
          setLoading(false);
          return;
        }

        // Verify user role
        const userResponse = await axios.get('http://localhost:5000/api/auth/verify', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserRole(userResponse.data.user.role);

        if (userResponse.data.user.role !== 'admin') {
          setError('Only admins can access this dashboard');
          setLoading(false);
          return;
        }

        // Fetch all data in parallel
        const [pendingResponse, historyResponse, usersResponse] = await Promise.all([
          axios.get('http://localhost:5000/api/admin/pending-sellers', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:5000/api/admin/approval-history', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:5000/api/admin/all-users', {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);

        setPendingSellers(pendingResponse.data);
        setApprovalHistory(historyResponse.data);
        setAllUsers(usersResponse.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch admin data');
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  // Approve a seller
  const handleApproveSeller = async (userId) => {
    if (!window.confirm(`Are you sure you want to approve seller ID ${userId}?`)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/admin/approve-seller/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPendingSellers(pendingSellers.filter((seller) => seller.id !== userId));
      const historyResponse = await axios.get('http://localhost:5000/api/admin/approval-history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setApprovalHistory(historyResponse.data);
      
      // Update the user list to reflect the approval
      const usersResponse = await axios.get('http://localhost:5000/api/admin/all-users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllUsers(usersResponse.data);
      
      alert('Seller approved successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve seller');
    }
  };

  // Download document
  const handleDownloadDoc = async (filename) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/admin/download-doc/${filename}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to download document');
    }
  };

  // Update user balance
  const handleBalanceUpdate = async (e) => {
    e.preventDefault();
    if (!balanceUpdate.userId || balanceUpdate.balance === '' || isNaN(balanceUpdate.balance) || balanceUpdate.balance < 0) {
      alert('Please provide a valid user ID and balance');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        'http://localhost:5000/api/balance',
        { userId: parseInt(balanceUpdate.userId), balance: parseFloat(balanceUpdate.balance) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAllUsers(
        allUsers.map((user) =>
          user.id === parseInt(balanceUpdate.userId)
            ? { ...user, balance: parseFloat(balanceUpdate.balance) }
            : user
        )
      );
      setBalanceUpdate({ userId: '', balance: '' });
      alert('Balance updated successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update balance');
    }
  };

  // Filter users based on search term
  const filteredUsers = allUsers.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.toString().includes(searchTerm)
  );

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <Box sx={{ minHeight: '100vh', bgcolor: 'yellow.50', p: 4 }}>
          <Box sx={{ maxWidth: '1280px', mx: 'auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#000000', display: 'flex', alignItems: 'center' }}>
                <FaUserShield style={{ marginRight: '8px', color: '#ffc107' }} />
                Admin Dashboard
              </Typography>
            </Box>
            <Box sx={{ display: 'grid', gap: 4 }}>
              <Card sx={{ bgcolor: 'background.paper' }}>
                <CardContent>
                  <Box sx={{ height: '200px', bgcolor: '#fff8e1', borderRadius: 1 }} />
                </CardContent>
              </Card>
              <Card sx={{ bgcolor: 'background.paper' }}>
                <CardContent>
                  <Box sx={{ height: '200px', bgcolor: '#fff8e1', borderRadius: 1 }} />
                </CardContent>
              </Card>
              <Card sx={{ bgcolor: 'background.paper' }}>
                <CardContent>
                  <Box sx={{ height: '200px', bgcolor: '#fff8e1', borderRadius: 1 }} />
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Box>
      </ThemeProvider>
    );
  }

  if (error || userRole !== 'admin') {
    return (
      <ThemeProvider theme={theme}>
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'yellow.50' }}>
          <Card sx={{ maxWidth: 400, width: '100%', p: 4, bgcolor: 'background.paper', textAlign: 'center' }}>
            <FiAlertCircle style={{ fontSize: '48px', color: '#d32f2f', margin: '0 auto 16px' }} />
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#d32f2f', mb: 2 }}>
              Access Restricted
            </Typography>
            <Typography sx={{ color: '#000000', mb: 4 }}>
              {error || 'Only administrators can access this dashboard'}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => window.location.href = '/login'}
              sx={{ py: 1.5 }}
            >
              Go to Login
            </Button>
          </Card>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: '100vh', bgcolor: 'yellow.50', p: 4 }}>
        <Box sx={{ maxWidth: '1280px', mx: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#000000', display: 'flex', alignItems: 'center' }}>
              <FaUserShield style={{ marginRight: '8px', color: '#ffc107' }} />
              Admin Dashboard
            </Typography>
            <Chip label={`${allUsers.length} total users`} sx={{ bgcolor: '#ffca28', color: '#000000' }} />
          </Box>

          {/* Stats Cards */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 4, mb: 4 }}>
            <Card sx={{ bgcolor: 'background.paper' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ p: 2, bgcolor: '#ffca28', color: '#000000', borderRadius: '50%', mr: 2 }}>
                  <FiUsers size={24} />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: '#000000' }}>Pending Sellers</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{pendingSellers.length}</Typography>
                </Box>
              </CardContent>
            </Card>
            <Card sx={{ bgcolor: 'background.paper' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ p: 2, bgcolor: '#ffca28', color: '#000000', borderRadius: '50%', mr: 2 }}>
                  <FiUserCheck size={24} />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: '#000000' }}>Approved Sellers</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {allUsers.filter(u => u.role === 'seller' && u.approved).length}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
            <Card sx={{ bgcolor: 'background.paper' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ p: 2, bgcolor: '#ffca28', color: '#000000', borderRadius: '50%', mr: 2 }}>
                  <FiDollarSign size={24} />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: '#000000' }}>Total Users Balance</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    ${allUsers.reduce((sum, user) => sum + user.balance, 0).toFixed(2)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Pending Sellers */}
          <Card sx={{ bgcolor: 'background.paper', mb: 4 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#000000', display: 'flex', alignItems: 'center', mb: 1 }}>
                <FiClock style={{ marginRight: '8px', color: '#ffc107' }} />
                Pending Seller Approvals
              </Typography>
              <Typography variant="body2" sx={{ color: '#000000', mb: 2 }}>
                Review and approve new seller applications
              </Typography>
              {pendingSellers.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <FiCheckCircle style={{ fontSize: '32px', color: '#ffca28', marginBottom: '8px' }} />
                  <Typography variant="body1" sx={{ color: '#000000' }}>
                    No pending seller applications
                  </Typography>
                </Box>
              ) : (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>MSME Number</TableCell>
                        <TableCell>Document</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pendingSellers.map((seller) => (
                        <TableRow key={seller.id} hover>
                          <TableCell>{seller.id}</TableCell>
                          <TableCell>{seller.name}</TableCell>
                          <TableCell>{seller.email}</TableCell>
                          <TableCell>{seller.msmeNumber}</TableCell>
                          <TableCell>
                            <Button
                              variant="text"
                              color="primary"
                              startIcon={<FiDownload />}
                              onClick={() => handleDownloadDoc(seller.msmeDoc)}
                            >
                              Download
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="contained"
                              color="primary"
                              startIcon={<FiCheckCircle />}
                              onClick={() => handleApproveSeller(seller.id)}
                            >
                              Approve
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>

          {/* Approval History */}
          <Card sx={{ bgcolor: 'background.paper', mb: 4 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#000000', display: 'flex', alignItems: 'center', mb: 1 }}>
                <MdHistory style={{ marginRight: '8px', color: '#ffc107' }} />
                Approval History
              </Typography>
              <Typography variant="body2" sx={{ color: '#000000', mb: 2 }}>
                Records of all seller approvals
              </Typography>
              {approvalHistory.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <FiAlertCircle style={{ fontSize: '32px', color: '#000000', marginBottom: '8px' }} />
                  <Typography variant="body1" sx={{ color: '#000000' }}>
                    No approval history found
                  </Typography>
                </Box>
              ) : (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Seller</TableCell>
                        <TableCell>Admin</TableCell>
                        <TableCell>Approved At</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {approvalHistory.map((record) => (
                        <TableRow key={record.id} hover>
                          <TableCell>{record.id}</TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{record.seller_name}</Typography>
                              <Typography variant="caption" sx={{ color: '#000000' }}>{record.seller_email}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{record.admin_name}</TableCell>
                          <TableCell>{new Date(record.approved_at).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>

          {/* All Users */}
          <Card sx={{ bgcolor: 'background.paper' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#000000', display: 'flex', alignItems: 'center', mb: 1 }}>
                <FiUsers style={{ marginRight: '8px', color: '#ffc107' }} />
                User Management
              </Typography>
              <Typography variant="body2" sx={{ color: '#000000', mb: 2 }}>
                Manage all system users and balances
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 4 }}>
                <TextField
                  fullWidth
                  label="Search users"
                  placeholder="Search by name, email, or ID"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <FiSearch style={{ color: '#ffc107' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ maxWidth: { sm: '300px' } }}
                />
                <Box component="form" onSubmit={handleBalanceUpdate} sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, flex: 1 }}>
                  <TextField
                    label="User ID"
                    type="number"
                    value={balanceUpdate.userId}
                    onChange={(e) => setBalanceUpdate({ ...balanceUpdate, userId: e.target.value })}
                    required
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    label="New Balance"
                    type="number"
                    value={balanceUpdate.balance}
                    onChange={(e) => setBalanceUpdate({ ...balanceUpdate, balance: e.target.value })}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">$</InputAdornment>
                      ),
                    }}
                    inputProps={{ step: '0.01' }}
                    required
                    sx={{ flex: 1 }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={<MdOutlineBalance />}
                    sx={{ py: 1.5, flexShrink: 0 }}
                  >
                    Update Balance
                  </Button>
                </Box>
              </Box>
              {filteredUsers.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <FiAlertCircle style={{ fontSize: '32px', color: '#000000', marginBottom: '8px' }} />
                  <Typography variant="body1" sx={{ color: '#000000' }}>
                    No users found matching your search
                  </Typography>
                </Box>
              ) : (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>User</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Balance</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id} hover>
                          <TableCell>{user.id}</TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{user.name}</Typography>
                              <Typography variant="caption" sx={{ color: '#000000' }}>{user.email}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={user.role}
                              sx={{
                                bgcolor: user.role === 'admin' ? '#fff8e1' : user.role === 'seller' ? '#ffca28' : '#ffca28',
                                color: '#000000',
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            {user.role === 'seller' ? (
                              <Chip
                                label={user.approved ? 'Approved' : 'Pending'}
                                sx={{
                                  bgcolor: user.approved ? '#ffca28' : '#fff8e1',
                                  color: '#000000',
                                }}
                              />
                            ) : (
                              'N/A'
                            )}
                          </TableCell>
                          <TableCell>${user.balance.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default AdminDashboard;