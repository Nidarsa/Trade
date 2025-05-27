import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Card, CardContent, CardActions, Typography, Alert, Button, TextField, CircularProgress, Box,
  ThemeProvider, createTheme 
} from '@mui/material';
import { FaShoppingCart, FaBoxOpen } from 'react-icons/fa';

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
    error: {
      main: '#ffca28', // Yellow for error alerts (aligned with success in Cart.jsx)
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
        standardError: {
          backgroundColor: '#ffca28', // Yellow for error alerts
          color: '#000000', // Black text for contrast
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

const Product = () => {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState({});
  const [quantities, setQuantities] = useState({});

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to view products');
        return;
      }
      const response = await axios.get('http://localhost:5000/api/product', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(response.data);
      setError('');
      const initialQuantities = response.data.reduce((acc, product) => {
        acc[product.id] = 1;
        return acc;
      }, {});
      setQuantities(initialQuantities);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
        localStorage.removeItem('token');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch products');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (productId, value) => {
    const quantity = parseInt(value, 10);
    if (isNaN(quantity) || quantity < 1) {
      setError(`Quantity for product ID ${productId} must be at least 1`);
      return;
    }
    const product = products.find((p) => p.id === productId);
    if (quantity > product.quantity) {
      setError(`Cannot select ${quantity} items. Only ${product.quantity} available.`);
      return;
    }
    setQuantities((prev) => ({ ...prev, [productId]: quantity }));
    setError('');
  };

  const addToCart = async (productId) => {
    try {
      setCartLoading((prev) => ({ ...prev, [productId]: true }));
      const token = localStorage.getItem('token');
      const quantity = quantities[productId] || 1;
      const product = products.find((p) => p.id === productId);
      if (quantity > product.quantity) {
        setError(`Cannot add ${quantity} items. Only ${product.quantity} available.`);
        return;
      }
      await axios.post(
        'http://localhost:5000/api/cart/add',
        { productId, quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setError('');
      alert('Product added to cart');
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
        localStorage.removeItem('token');
      } else {
        setError(err.response?.data?.message || 'Failed to add product to cart');
      }
    } finally {
      setCartLoading((prev) => ({ ...prev, [productId]: false }));
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <div className="min-h-screen bg-yellow-50 py-12"> {/* Changed to bg-yellow-50 */}
        <div className="container mx-auto px-6">
          <div className="mb-8 flex items-center gap-3">
            <FaBoxOpen style={{ fontSize: '2.5rem', color: '#ffc107' }} /> {/* Yellow box icon */}
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#000000' }}>
              SuperMarketplace Products {/* Added SuperMarketplace branding */}
            </Typography>
          </div>

          {error && <Alert severity="error" sx={{ mb: 6 }}>{error}</Alert>}

          {loading ? (
            <Box className="flex justify-center items-center">
              <CircularProgress /> {/* Yellow spinner */}
            </Box>
          ) : products.length === 0 ? (
            <Typography variant="h6" sx={{ textAlign: 'center', color: '#000000' }}>
              No products available.
            </Typography>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card 
                  key={product.id} 
                  sx={{ 
                    boxShadow: 3, 
                    backgroundColor: theme.palette.background.paper, // Light yellow card
                    '&:hover': { boxShadow: 6 } // Enhanced hover effect
                  }}
                >
                  <CardContent sx={{ p: 6 }}>
                    <img
                      src={product.image || 'https://via.placeholder.com/150'}
                      alt={product.description}
                      style={{ width: '100%', height: '192px', objectFit: 'cover', borderRadius: '4px', marginBottom: '16px' }}
                    />
                    <Typography variant="h6" sx={{ fontWeight: '600', color: '#000000', mb: 2 }}>
                      {product.description || 'Unknown Product'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#000000', mb: 2 }}>
                      Price: ${product.price.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#000000', mb: 4 }}>
                      Available: {product.quantity}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ p: 6, pt: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {/* Quantity input with yellow styling */}
                    <TextField
                      type="number"
                      size="small"
                      label="Quantity"
                      value={quantities[product.id] || 1}
                      onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                      inputProps={{ min: 1, max: product.quantity }}
                      sx={{ width: '96px' }}
                    />
                    {/* Add to Cart button with yellow styling */}
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => addToCart(product.id)}
                      disabled={cartLoading[product.id]}
                      startIcon={<FaShoppingCart style={{ color: '#000000' }} />} // Black icon for contrast
                    >
                      {cartLoading[product.id] ? 'Adding...' : 'Add to Cart'}
                    </Button>
                  </CardActions>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </ThemeProvider>
  );
};

export default Product;