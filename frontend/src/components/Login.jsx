import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { 
  TextField, Button, Typography, Alert, Card, CardContent, CircularProgress, Box, ThemeProvider, createTheme 
} from '@mui/material';
import { FaUser, FaLock, FaSignInAlt } from 'react-icons/fa';

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

const Login = () => {
  const { setAuth } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      setAuth({ token: data.token, user: data.user });
      localStorage.setItem('token', data.token);
      navigate(data.user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <div className="min-h-screen flex items-center justify-center bg-yellow-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card sx={{ maxWidth: 400, width: '100%', p: 4, boxShadow: 3, backgroundColor: theme.palette.background.paper }}>
          <CardContent>
            <Typography variant="h4" sx={{ textAlign: 'center', fontWeight: 'bold', color: '#000000' }}>
              SuperMarketplace Login
            </Typography>
            <Typography sx={{ mt: 2, textAlign: 'center', color: '#000000' }}>
              Don't have an account?{' '}
              <a href="/register" className="font-medium text-yellow-600 hover:text-yellow-700">
                Register here
              </a>
            </Typography>

            {error && <Alert severity="error" sx={{ mt: 4, mb: 4 }}>{error}</Alert>}

            <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-4">
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
                      <FaUser style={{ color: '#ffc107' }} />
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
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    Remember me
                  </label>
                </div>
                <div className="text-sm">
                  <a href="/forgot-password" className="font-medium text-yellow-600 hover:text-yellow-700">
                    Forgot your password?
                  </a>
                </div>
              </div>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={isLoading}
                sx={{ mt: 4, py: 1.5 }}
                startIcon={isLoading ? <CircularProgress size={20} /> : <FaSignInAlt />}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </ThemeProvider>
  );
};

export default Login;