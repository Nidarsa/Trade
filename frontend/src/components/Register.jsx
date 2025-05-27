import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { 
  TextField, Button, Typography, Alert, Card, CardContent, Select, MenuItem, InputLabel, FormControl, CircularProgress, Box, ThemeProvider, createTheme 
} from '@mui/material';
import { FaUser, FaEnvelope, FaLock, FaPhone, FaHome, FaIdCard, FaUserTag } from 'react-icons/fa';

// Define a custom yellow theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#ffc107', // Yellow shade matching navbar
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
    MuiSelect: {
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
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: '#ffc107', // Yellow label
          '&.Mui-focused': {
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
  },
});

const Register = () => {
  const { setAuth } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    role: 'buyer',
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      
      setAuth({ token: data.token, user: data.user });
      localStorage.setItem('token', data.token);

      if (formData.role === 'seller') {
        navigate('/seller-register');
      } else {
        setSuccess('Registration successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <div className="min-h-screen flex items-center justify-center bg-yellow-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card sx={{ maxWidth: 800, width: '100%', p: 8, boxShadow: 3, backgroundColor: theme.palette.background.paper }}>
          <CardContent>
            <Typography variant="h4" sx={{ textAlign: 'center', fontWeight: 'bold', color: '#000000' }}>
              SuperMarketplace Registration
            </Typography>
            <Typography sx={{ mt: 2, textAlign: 'center', color: '#000000' }}>
              Already have an account?{' '}
              <a href="/login" className="font-medium text-yellow-600 hover:text-yellow-700">
                Sign in here
              </a>
            </Typography>

            {error && <Alert severity="error" sx={{ mt: 4, mb: 4 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mt: 4, mb: 4 }}>{success}</Alert>}

            <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  fullWidth
                  label="Full Name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                        <FaUser style={{ color: '#ffc107' }} />
                      </Box>
                    ),
                  }}
                />
                <TextField
                  fullWidth
                  label="Username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="johndoe123"
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                        <FaIdCard style={{ color: '#ffc107' }} />
                      </Box>
                    ),
                  }}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                        <FaEnvelope style={{ color: '#ffc107' }} />
                      </Box>
                    ),
                  }}
                />
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                        <FaLock style={{ color: '#ffc107' }} />
                      </Box>
                    ),
                  }}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 123-4567"
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                        <FaPhone style={{ color: '#ffc107' }} />
                      </Box>
                    ),
                  }}
                />
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  type="text"
                  required
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Main St, City"
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                        <FaHome style={{ color: '#ffc107' }} />
                      </Box>
                    ),
                  }}
                />
              </div>
              <FormControl fullWidth>
                <InputLabel id="role-label">Account Type</InputLabel>
                <Select
                  labelId="role-label"
                  id="role"
                  name="role"
                  required
                  value={formData.role}
                  onChange={handleChange}
                  label="Account Type"
                  startAdornment={
                    <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                      <FaUserTag style={{ color: '#ffc107' }} />
                    </Box>
                  }
                >
                  <MenuItem value="buyer">Buyer</MenuItem>
                  <MenuItem value="seller">Seller</MenuItem>
                </Select>
              </FormControl>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={isLoading}
                sx={{ mt: 4, py: 1.5 }}
                startIcon={isLoading ? <CircularProgress size={20} /> : null}
              >
                {isLoading ? 'Processing...' : 'Register'}
                {/* Yellow spinner */}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </ThemeProvider>
  );
};

export default Register;