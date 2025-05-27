import React, { useContext, useState } from 'react';
import { AuthContext } from '../App';
import { Container, Typography, TextField, Button, Box, Paper, ThemeProvider, createTheme } from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

// Define a custom yellow theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#ffc107', // Yellow shade matching navbar
      contrastText: '#000000', // Black for text contrast
    },
    background: {
      paper: '#fff8e1', // Light yellow for Paper, similar to yellow-50
    },
    success: {
      main: '#ffca28', // Brighter yellow for success messages
    },
    error: {
      main: '#d32f2f', // Keep red for errors
    },
  },
  components: {
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
  },
});

const Balance = () => {
  const { auth, updateBalance } = useContext(AuthContext);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');

  const handleAddFunds = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/balance/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ amount: parseFloat(amount) }),
      });
      
      const data = await response.json();
      if (response.ok) {
        updateBalance(data.newBalance);
        setMessage(`Successfully added $${amount} to your balance`);
      } else {
        setMessage(data.message || 'Failed to add funds');
      }
    } catch (error) {
      setMessage('An error occurred while adding funds');
    }
  };

  const handleWithdrawFunds = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/balance/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ amount: parseFloat(amount) }),
      });
      
      const data = await response.json();
      if (response.ok) {
        updateBalance(data.newBalance);
        setMessage(`Successfully withdrew $${amount} from your balance`);
      } else {
        setMessage(data.message || 'Failed to withdraw funds');
      }
    } catch (error) {
      setMessage('An error occurred while withdrawing funds');
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ p: 4, mt: 4, backgroundColor: theme.palette.background.paper }}>
          <Box display="flex" alignItems="center" mb={3}>
            <AccountBalanceWalletIcon fontSize="large" style={{ color: '#ffc107' }} /> {/* Yellow icon */}
            <Typography variant="h4" component="h1" sx={{ ml: 2, color: '#000000' }}>
              Your SuperMarketplace Balance
            </Typography>
          </Box>
          
          <Typography variant="h5" sx={{ mb: 4, color: '#000000' }}>
            Current Balance: <strong>${auth.user?.balance?.toFixed(2) || '0.00'}</strong>
          </Typography>
          
          {auth.user.role === 'buyer' && (
            <>
              <Typography variant="h6" sx={{ mt: 4, mb: 2, color: '#000000' }}>
                Add Funds
              </Typography>
              <Box display="flex" alignItems="center">
                {/* TextField for adding funds with yellow icon */}
                <TextField
                  type="number"
                  label="Amount"
                  variant="outlined"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  InputProps={{
                    startAdornment: <AttachMoneyIcon style={{ color: '#ffc107' }} />,
                  }}
                  sx={{ flexGrow: 1 }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  sx={{ ml: 4, py: 2 }}
                  onClick={handleAddFunds}
                >
                  Add Funds
                </Button>
              </Box>
            </>
          )}
          
          {auth.user.role === 'seller' && (
            <>
              <Typography variant="h6" sx={{ mt: 4, mb: 2, color: '#000000' }}>
                Withdraw Funds
              </Typography>
              <Box display="flex" alignItems="center">
                {/* TextField for withdrawing funds with yellow icon */}
                <TextField
                  type="number"
                  label="Amount"
                  variant="outlined"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  InputProps={{
                    startAdornment: <AttachMoneyIcon style={{ color: '#ffc107' }} />,
                  }}
                  sx={{ flexGrow: 1 }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  sx={{ ml: 4, py: 2 }}
                  onClick={handleWithdrawFunds}
                >
                  Withdraw
                </Button>
              </Box>
            </>
          )}
          
          {message && (
            <Typography
              sx={{
                mt: 3,
                color: message.includes('Success') ? theme.palette.success.main : theme.palette.error.main,
              }}
            >
              {message}
            </Typography>
          )}
        </Paper>
      </Container>
    </ThemeProvider>
  );
};

export default Balance;