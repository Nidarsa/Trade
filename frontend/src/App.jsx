import React, { useState, useEffect, createContext } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Home from './components/Home';
import Products from './components/Products';
import AddProduct from './components/AddProduct';
import Cart from './components/Cart';
import Login from './components/Login';
import Register from './components/Register';
import SellerRegister from './components/SellerRegister';
import Orders from './components/Orders';
import Balance from './components/Balance';
import Admin from './components/Admin';

// Material UI Components
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Container, 
  Box, 
  Badge,
  CssBaseline,
  ThemeProvider,
  createTheme
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import HomeIcon from '@mui/icons-material/Home';
import StoreIcon from '@mui/icons-material/Store';
import ListAltIcon from '@mui/icons-material/ListAlt';
import LoginIcon from '@mui/icons-material/Login';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import LogoutIcon from '@mui/icons-material/Logout';
import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket';

// Bootstrap CSS


// Custom Theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#4a148c', // Deep purple
    },
    secondary: {
      main: '#ff6f', // Amber
    },
    background: {
      default: '#f5f5f5', // Light gray
    },
  },
});

// Create Auth Context
export const AuthContext = createContext();

const App = () => {
  const [auth, setAuth] = useState({
    token: null,
    user: null,
  });

  // Check for stored token on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('http://localhost:5000/api/auth/verify', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            setAuth({ token, user: data.user });
          } else {
            localStorage.removeItem('token');
          }
        })
        .catch((err) => {
          console.error('Token verification failed:', err);
          localStorage.removeItem('token');
        });
    }
  }, []);

  const updateBalance = (newBalance) => {
    setAuth(prevAuth => ({
      ...prevAuth,
      user: {
        ...prevAuth.user,
        balance: newBalance
      }
    }));
  };

  const logout = () => {
    setAuth({ token: null, user: null });
    localStorage.removeItem('token');
  };

  const ProtectedRoute = ({ children, allowedRoles }) => {
    const navigate = useNavigate();
    if (!auth.token || !auth.user || (allowedRoles && !allowedRoles.includes(auth.user.role))) {
      navigate('/login');
      return null;
    }
    return children;
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthContext.Provider value={{ auth, setAuth, logout, updateBalance }}>
        <BrowserRouter>
          {/* Enhanced Navbar with Yellow Background */}
          <AppBar 
            position="static" 
            style={{ 
              background: 'linear-gradient(135deg, #ffc107 0%, #ffca28 100%)', // Yellow gradient
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              marginBottom: '30px'
            }}
          >
            <Container maxWidth="xl">
              <Toolbar disableGutters style={{ justifyContent: 'space-between' }}>
                {/* Brand Logo with Animation */}
                <Box style={{ display: 'flex', alignItems: 'center' }}>
                  <StoreIcon style={{ marginRight: '10px', fontSize: '32px', color: '#000' }} /> {/* Shop icon with black color */}
                  <Typography
                    variant="h6"
                    noWrap
                    component={Link}
                    to="/"
                    style={{
                      fontWeight: 700,
                      letterSpacing: '.1rem',
                      color: '#000', // Black for contrast
                      textDecoration: 'none',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
                      transition: 'all 0.3s ease',
                      ':hover': {
                        transform: 'scale(1.02)'
                      }
                    }}
                    className="text-decoration-none"
                  >
                    SuperMarketplace
                  </Typography>
                </Box>

                {/* Navigation Links with Hover Effects */}
                <Box style={{ display: 'flex', gap: '15px' }}>
                  <Button
                    component={Link}
                    to="/"
                    color="inherit"
                    startIcon={<HomeIcon style={{ color: '#000' }} />}
                    style={{
                      color: '#000',
                      fontWeight: 600,
                      transition: 'all 0.3s ease',
                      ':hover': {
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    Home
                  </Button>

                  <Button
                    component={Link}
                    to="/products"
                    color="inherit"
                    startIcon={<ShoppingBasketIcon style={{ color: '#000' }} />} // Changed to ShoppingBasketIcon
                    style={{
                      color: '#000',
                      fontWeight: 600,
                      transition: 'all 0.3s ease',
                      ':hover': {
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    Products
                  </Button>

                  {auth.user?.role === 'seller' && (
                    <Button
                      component={Link}
                      to="/add-product"
                      color="inherit"
                      startIcon={<AddCircleOutlineIcon style={{ color: '#000' }} />}
                      style={{
                        color: '#000',
                        fontWeight: 600,
                        transition: 'all 0.3s ease',
                        ':hover': {
                          backgroundColor: 'rgba(0,0,0,0.1)',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      Add Product
                    </Button>
                  )}

                  {auth.user?.role === 'buyer' && (
                    <Button
                      component={Link}
                      to="/cart"
                      color="inherit"
                      startIcon={<ShoppingCartIcon style={{ color: '#000' }} />}
                      style={{
                        color: '#000',
                        fontWeight: 600,
                        transition: 'all 0.3s ease',
                        ':hover': {
                          backgroundColor: 'rgba(0,0,0,0.1)',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      Cart
                    </Button>
                  )}

                  {(auth.user?.role === 'buyer' || auth.user?.role === 'seller') && (
                    <Button
                      component={Link}
                      to="/orders"
                      color="inherit"
                      startIcon={<ListAltIcon style={{ color: '#000' }} />}
                      style={{
                        color: '#000',
                        fontWeight: 600,
                        transition: 'all 0.3s ease',
                        ':hover': {
                          backgroundColor: 'rgba(0,0,0,0.1)',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      Orders
                    </Button>
                  )}

                  {(auth.user?.role === 'buyer') && (
                    <Button
                      component={Link}
                      to="/balance"
                      color="inherit"
                      startIcon={<AccountBalanceWalletIcon style={{ color: '#000' }} />}
                      style={{
                        color: '#000',
                        fontWeight: 600,
                        transition: 'all 0.3s ease',
                        ':hover': {
                          backgroundColor: 'rgba(0,0,0,0.1)',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                     
                      Balance
                    </Button>
                  )}

                  {auth.user?.role === 'admin' && (
                    <Button
                      component={Link}
                      to="/admin"
                      color="inherit"
                      startIcon={<AdminPanelSettingsIcon style={{ color: '#000' }} />}
                      style={{
                        color: '#000',
                        fontWeight: 600,
                        transition: 'all 0.3s ease',
                        ':hover': {
                          backgroundColor: 'rgba(0,0,0,0.1)',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      Admin
                    </Button>
                  )}
                </Box>

                {/* Auth Buttons with Dropdown for Mobile */}
                <Box style={{ display: 'flex', gap: '10px' }}>
                  {!auth.token ? (
                    <div className="btn-group">
                      <Button
                        component={Link}
                        to="/login"
                        variant="outlined"
                        startIcon={<LoginIcon style={{ color: '#000' }} />}
                        style={{
                          color: '#000',
                          borderColor: '#000',
                          fontWeight: 600,
                          ':hover': {
                            backgroundColor: 'rgba(0,0,0,0.2)',
                            borderColor: '#000'
                          }
                        }}
                        className="me-2"
                      >
                        Login
                      </Button>
                      <Button
                        component={Link}
                        to="/register"
                        variant="contained"
                        startIcon={<HowToRegIcon />}
                        style={{
                          backgroundColor: '#ff6f00',
                          fontWeight: 600,
                          ':hover': {
                            backgroundColor: '#e65100'
                          }
                        }}
                      >
                        Register
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={logout}
                      variant="outlined"
                      startIcon={<LogoutIcon style={{ color: '#000' }} />}
                      style={{
                        color: '#000',
                        borderColor: '#000',
                        fontWeight: 600,
                        ':hover': {
                          backgroundColor: 'rgba(0,0,0,0.2)',
                          borderColor: '#000'
                        }
                      }}
                    >
                      Logout
                    </Button>
                  )}
                </Box>
              </Toolbar>
            </Container>
          </AppBar>

          {/* Main Content with Gradient Background */}
          <div style={{
            minHeight: 'calc(100vh - 120px)',
            background: 'linear-gradient(to bottom, #f5f7fa 0%, #e4e8eb 100%)',
            padding: '20px 0'
          }}>
            <Container maxWidth="xl" style={{ padding: '20px' }}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route
                  path="/add-product"
                  element={
                    <ProtectedRoute allowedRoles={['seller']}>
                      <AddProduct />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/cart"
                  element={
                    <ProtectedRoute allowedRoles={['buyer']}>
                      <Cart />
                    </ProtectedRoute>
                  }
                />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                  path="/seller-register"
                  element={<SellerRegister />}
                />
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute allowedRoles={['buyer', 'seller']}>
                      <Orders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/balance"
                  element={
                    <ProtectedRoute allowedRoles={['buyer']}>
                      <Balance />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <Admin />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Container>
          </div>

          {/* Footer with Bootstrap */}
          <footer className="bg-dark text-white py-4 mt-4">
            <Container>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <h5 className="text-warning">SuperMarketplace</h5>
                  <p>Your one-stop shop for all your needs.</p>
                </div>
                <div className="col-md-4 mb-3">
                  <h5>Quick Links</h5>
                  <ul className="list-unstyled">
                    <li><Link to="/" className="text-white text-decoration-none">Home</Link></li>
                    <li><Link to="/products" className="text-white text-decoration-none">Products</Link></li>
                    <li><Link to="/login" className="text-white text-decoration-none">Login</Link></li>
                  </ul>
                </div>
                <div className="col-md-4 mb-3">
                  <h5>Contact Us</h5>
                  <address>
                    <p>Email: info@supermarketplace.com</p>
                    <p>Phone: (123) 456-7890</p>
                  </address>
                </div>
              </div>
              <hr className="bg-light" />
              <div className="text-center">
                <p className="mb-0">© {new Date().getFullYear()} SuperMarketplace. All rights reserved.</p>
              </div>
            </Container>
          </footer>
        </BrowserRouter>
      </AuthContext.Provider>
    </ThemeProvider>
  );
};

export default App;