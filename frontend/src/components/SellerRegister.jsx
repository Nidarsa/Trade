import React, { useState, useContext } from 'react';
import { AuthContext } from '../App';
import { TextField, Button, Typography, Alert, Card, CardContent, ThemeProvider, createTheme } from '@mui/material';
import { Person, Business, LocationOn, CreditCard, AccountBalance, UploadFile } from '@mui/icons-material';

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
  },
});

const SellerRegister = () => {
  const { auth } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    userId: auth.user?.id || '',
    msmeNumber: '',
    address: '',
    adharNumber: '',
    accountNumber: '',
    msmeDoc: null,
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    if (e.target.name === 'msmeDoc') {
      setFormData({ ...formData, msmeDoc: e.target.files[0] });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('userId', formData.userId);
    data.append('msmeNumber', formData.msmeNumber);
    data.append('address', formData.address);
    data.append('adharNumber', formData.adharNumber);
    data.append('accountNumber', formData.accountNumber);
    data.append('msmeDoc', formData.msmeDoc);

    try {
      const res = await fetch('http://localhost:5000/api/seller/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
        body: data,
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Seller registration failed');
      setSuccess('Seller details submitted. Awaiting approval.');
      setFormData({
        userId: auth.user?.id || '',
        msmeNumber: '',
        address: '',
        adharNumber: '',
        accountNumber: '',
        msmeDoc: null,
      });
      setError(null);
    } catch (err) {
      setError(err.message);
      setSuccess(null);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <div className="flex justify-center items-center min-h-screen bg-yellow-50"> {/* Changed to bg-yellow-50 */}
        <Card sx={{ maxWidth: 800, width: '100%', boxShadow: 3, backgroundColor: theme.palette.background.paper }}> {/* Light yellow card */}
          <CardContent sx={{ p: 6 }}>
            <Typography variant="h4" sx={{ textAlign: 'center', mb: 6, fontWeight: 'bold', color: '#000000' }}>
              SuperMarketplace Seller Registration {/* Added SuperMarketplace branding */}
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 4 }}>{success}</Alert>}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* User ID input with yellow styling */}
              <div className="flex items-center gap-2">
                <Person sx={{ color: '#ffc107' }} /> {/* Yellow icon */}
                <TextField
                  fullWidth
                  label="User ID"
                  name="userId"
                  type="number"
                  value={formData.userId}
                  onChange={handleChange}
                  required
                  variant="outlined"
                />
              </div>
              {/* MSME Number input with yellow styling */}
              <div className="flex items-center gap-2">
                <Business sx={{ color: '#ffc107' }} /> {/* Yellow icon */}
                <TextField
                  fullWidth
                  label="MSME Number"
                  name="msmeNumber"
                  value={formData.msmeNumber}
                  onChange={handleChange}
                  required
                  variant="outlined"
                />
              </div>
              {/* Address input with yellow styling */}
              <div className="flex items-center gap-2">
                <LocationOn sx={{ color: '#ffc107' }} /> {/* Yellow icon */}
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  variant="outlined"
                />
              </div>
              {/* Aadhar Number input with yellow styling */}
              <div className="flex items-center gap-2">
                <CreditCard sx={{ color: '#ffc107' }} /> {/* Yellow icon */}
                <TextField
                  fullWidth
                  label="Aadhar Number"
                  name="adharNumber"
                  value={formData.adharNumber}
                  onChange={handleChange}
                  required
                  variant="outlined"
                />
              </div>
              {/* Account Number input with yellow styling */}
              <div className="flex items-center gap-2">
                <AccountBalance sx={{ color: '#ffc107' }} /> {/* Yellow icon */}
                <TextField
                  fullWidth
                  label="Account Number"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  required
                  variant="outlined"
                />
              </div>
              {/* File input with yellow styling */}
              <div className="flex items-center gap-2">
                <UploadFile sx={{ color: '#ffc107' }} /> {/* Yellow icon */}
                <input
                  type="file"
                  name="msmeDoc"
                  accept=".pdf,.doc,.docx"
                  onChange={handleChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100" /* Yellow file input */
                  required
                />
              </div>
              {/* Submit button with yellow styling */}
              <div className="col-span-1 md:col-span-2 mt-4">
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  sx={{ py: 1.5, fontSize: '1.1rem' }}
                >
                  Submit
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </ThemeProvider>
  );
};

export default SellerRegister;