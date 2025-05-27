import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Card, CardContent, TextField, Button, Alert, CircularProgress, Typography, Box,
  ThemeProvider, createTheme 
} from '@mui/material';
import { FaPlusCircle } from 'react-icons/fa';

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
      main: '#ffca28', // Yellow for error alerts (aligned with Product.jsx)
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

const AddProduct = () => {
  const [formData, setFormData] = useState({
    image: '',
    description: '',
    price: '',
    quantity: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSeller, setIsSeller] = useState(null);
  const navigate = useNavigate();

  // Verify user is an approved seller on mount
  useEffect(() => {
    const verifyUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Please log in as a seller to add products');
          setIsSeller(false);
          return;
        }
        const response = await axios.get('http://localhost:5000/api/auth/verify', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.user.role !== 'seller') {
          setError('Only sellers can add products');
          setIsSeller(false);
        } else {
          setIsSeller(true);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to verify user');
        setIsSeller(false);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
        }
      }
    };
    verifyUser();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  // Validate and submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { image, description, price, quantity } = formData;

    // Client-side validation
    if (!image || !description || !price || !quantity) {
      setError('All fields are required');
      return;
    }
    const priceNum = parseFloat(price);
    const quantityNum = parseInt(quantity, 10);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Price must be a positive number');
      return;
    }
    if (isNaN(quantityNum) || quantityNum <= 0) {
      setError('Quantity must be a positive integer');
      return;
    }
    // Basic URL validation
    try {
      new URL(image);
    } catch {
      setError('Image must be a valid URL');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/product/add',
        { image, description, price: priceNum, quantity: quantityNum },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Product added successfully');
      setFormData({ image: '', description: '', price: '', quantity: '' });
      navigate('/products'); // Redirect to products page
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add product');
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        setIsSeller(false);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <div className="min-h-screen bg-yellow-50 py-12"> {/* Changed to bg-yellow-50 */}
        <div className="container mx-auto px-6">
          <div className="mb-8 flex items-center gap-3">
            <FaPlusCircle style={{ fontSize: '2.5rem', color: '#ffc107' }} /> {/* Yellow plus icon */}
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#000000' }}>
              Add New SuperMarketplace Product {/* Added SuperMarketplace branding */}
            </Typography>
          </div>

          {isSeller === null ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <CircularProgress /> {/* Yellow spinner */}
              <Typography sx={{ ml: 2, color: '#000000' }}>Verifying user...</Typography>
            </Box>
          ) : isSeller === false ? (
            <Alert severity="error" sx={{ mb: 6 }}>{error}</Alert>
          ) : (
            <Card sx={{ maxWidth: 600, mx: 'auto', boxShadow: 3, backgroundColor: theme.palette.background.paper }}> {/* Light yellow card */}
              <CardContent sx={{ p: 6 }}>
                {error && <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>}

                <form onSubmit={handleSubmit} noValidate>
                  {/* Image URL input with yellow styling */}
                  <TextField
                    fullWidth
                    margin="normal"
                    id="image"
                    name="image"
                    label="Image URL"
                    value={formData.image}
                    onChange={handleChange}
                    placeholder="https://example.com/image.jpg"
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                          <svg
                            className="h-5 w-5 text-yellow-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </Box>
                      ),
                    }}
                  />
                  {/* Description input with yellow styling */}
                  <TextField
                    fullWidth
                    margin="normal"
                    id="description"
                    name="description"
                    label="Description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Product description"
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                          <svg
                            className="h-5 w-5 text-yellow-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </Box>
                      ),
                    }}
                  />
                  {/* Price input with yellow styling */}
                  <TextField
                    fullWidth
                    margin="normal"
                    id="price"
                    name="price"
                    label="Price ($)"
                    type="number"
                    value={formData.price}
                    onChange={handleChange}
                    inputProps={{ step: '0.01', min: '0.01' }}
                    placeholder="10.99"
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                          <svg
                            className="h-5 w-5 text-yellow-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </Box>
                      ),
                    }}
                  />
                  {/* Quantity input with yellow styling */}
                  <TextField
                    fullWidth
                    margin="normal"
                    id="quantity"
                    name="quantity"
                    label="Quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={handleChange}
                    inputProps={{ min: '1' }}
                    placeholder="100"
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                          <svg
                            className="h-5 w-5 text-yellow-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                            />
                          </svg>
                        </Box>
                      ),
                    }}
                  />
                  {/* Add Product button with yellow styling */}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={loading}
                      startIcon={<FaPlusCircle style={{ color: '#000000' }} />} // Black icon for contrast
                    >
                      {loading ? 'Adding...' : 'Add Product'}
                    </Button>
                  </Box>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ThemeProvider>
  );
};

export default AddProduct;