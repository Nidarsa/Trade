import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Typography, Alert, Button, Card, CardContent, Box,
  ThemeProvider, createTheme 
} from '@mui/material';
import { FaShoppingCart, FaTrash, FaCreditCard } from 'react-icons/fa';

// Define a custom yellow theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#ffc107', // Yellow shade matching navbar
      contrastText: '#000000', // Black for text contrast
    },
    background: {
      paper: '#fff8e1', // Light yellow for Card and TableContainer
    },
    success: {
      main: '#ffca28', // Brighter yellow for success alerts
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
        outlinedError: {
          borderColor: '#ffc107', // Yellow border for Remove button
          color: '#ffc107', // Yellow text
          '&:hover': {
            borderColor: '#ffca28', // Brighter yellow on hover
            backgroundColor: '#fff8e1', // Light yellow background on hover
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        standardSuccess: {
          backgroundColor: '#ffca28', // Yellow for success alerts
          color: '#000000', // Black text for contrast
        },
        standardError: {
          backgroundColor: '#d32f2f', // Red for error alerts
          color: '#ffffff', // White text
        },
      },
    },
  },
});

const Cart = () => {
  const { auth } = useContext(AuthContext);
  const [cartItems, setCartItems] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/cart', {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch cart');
        setCartItems(data);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchCart();
  }, [auth.token]);

  const handleRemoveItem = async (itemId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/cart/${itemId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to remove item');
      setCartItems(cartItems.filter((item) => item.id !== itemId));
      setSuccess('Item removed from cart');
      setError(null);
    } catch (err) {
      setError(err.message);
      setSuccess(null);
    }
  };

  const handlePayment = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/payment/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ cartItems }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Payment failed');
      setSuccess('Payment processed successfully');
      setCartItems([]);
      setError(null);
    } catch (err) {
      setError(err.message);
      setSuccess(null);
    }
  };

  // Calculate total price
  const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2);

  return (
    <ThemeProvider theme={theme}>
      <div className="min-h-screen bg-yellow-50 py-12">
        <div className="container mx-auto px-6">
          <Card sx={{ boxShadow: 3, backgroundColor: theme.palette.background.paper }}>
            <CardContent sx={{ p: 8 }}>
              <div className="flex items-center gap-3 mb-8">
                <FaShoppingCart style={{ fontSize: '2.5rem', color: '#ffc107' }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#000000' }}>
                  Your SuperMarketplace Cart
                </Typography>
              </div>

              {error && <Alert severity="error" sx={{ mb: 6 }}>{error}</Alert>}
              {success && <Alert severity="success" sx={{ mb: 6 }}>{success}</Alert>}

              {cartItems.length === 0 ? (
                <Typography variant="h6" sx={{ textAlign: 'center', color: '#000000' }}>
                  Your cart is empty.
                </Typography>
              ) : (
                <>
                  <TableContainer component={Paper} sx={{ boxShadow: 'none', backgroundColor: theme.palette.background.paper }}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#fff8e1' }}>
                          <TableCell sx={{ fontWeight: '600', color: '#000000' }}>Image</TableCell>
                          <TableCell sx={{ fontWeight: '600', color: '#000000' }}>Description</TableCell>
                          <TableCell sx={{ fontWeight: '600', color: '#000000' }}>Price</TableCell>
                          <TableCell sx={{ fontWeight: '600', color: '#000000' }}>Quantity</TableCell>
                          <TableCell sx={{ fontWeight: '600', color: '#000000' }}>Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {cartItems.map((item) => (
                          <TableRow key={item.id} sx={{ '&:hover': { backgroundColor: '#fff8e1' } }}>
                            <TableCell>
                              <img 
                                src={item.image} 
                                alt={item.description} 
                                style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '4px' }} 
                              />
                            </TableCell>
                            <TableCell sx={{ color: '#000000' }}>{item.description}</TableCell>
                            <TableCell sx={{ color: '#000000' }}>${item.price.toFixed(2)}</TableCell>
                            <TableCell sx={{ color: '#000000' }}>{item.quantity}</TableCell>
                            <TableCell>
                              {/* Remove button with yellow trash icon */}
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                onClick={() => handleRemoveItem(item.id)}
                                startIcon={<FaTrash style={{ color: '#ffc107' }} />}
                              >
                                Remove
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Box sx={{ mt: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: '600', color: '#000000' }}>
                      Total: ${totalPrice}
                    </Typography>
                    {/* Proceed to Payment button with yellow styling */}
                    <Button
                      variant="contained"
                      color="primary"
                      size="large"
                      onClick={handlePayment}
                      sx={{ py: 1.5, px: 6 }}
                      startIcon={<FaCreditCard style={{ color: '#000000' }} />}
                    >
                      Proceed to Payment
                    </Button>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default Cart;