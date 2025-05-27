import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../App';
import axios from 'axios';
import {
  Card, CardContent, CardActions, Typography, Alert, Button, CircularProgress, Box
} from '@mui/material';
import {
  FaShoppingCart, FaChartLine, FaShieldAlt, FaExchangeAlt, FaHeadset, FaBox,
  FaTags, FaUserTie, FaBuilding, FaShippingFast, FaHandshake, FaWarehouse,
  FaFileInvoiceDollar, FaQuestionCircle
} from 'react-icons/fa';

const Home = () => {
  const { auth } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState({});

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = auth.token;
      if (!token) {
        setError('Please log in to view featured products');
        return;
      }
      const response = await axios.get('http://localhost:5000/api/product', {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Limit to 4 products for homepage showcase
      setProducts(response.data.slice(0, 4));
      setError('');
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch featured products');
      }
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId) => {
    try {
      setCartLoading((prev) => ({ ...prev, [productId]: true }));
      const token = auth.token;
      if (!token) {
        setError('Please log in to add products to cart');
        return;
      }
      await axios.post(
        'http://localhost:5000/api/cart/add',
        { productId, quantity: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setError('');
      alert('Product added to cart');
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError(err.response?.data?.message || 'Failed to add product to cart');
      }
    } finally {
      setCartLoading((prev) => ({ ...prev, [productId]: false }));
    }
  };

  // Enhanced Business Statistics
  const businessStats = [
    { value: '50,000+', label: 'Products Available', icon: <FaBox className="text-4xl text-yellow-600" /> },
    { value: '1,000+', label: 'Verified Suppliers', icon: <FaBuilding className="text-4xl text-yellow-600" /> },
    { value: '99%', label: 'Order Fulfillment Rate', icon: <FaChartLine className="text-4xl text-yellow-600" /> },
    { value: '12h', label: 'Avg. Dispatch Time', icon: <FaShippingFast className="text-4xl text-yellow-600" /> }
  ];

  // Expanded Business Solutions
  const solutions = [
    {
      title: "Bulk Purchasing",
      description: "Access exclusive volume discounts and flexible payment terms for large-scale procurement.",
      icon: <FaTags className="text-5xl text-yellow-600 mb-4" />
    },
    {
      title: "Corporate Accounts",
      description: "Enjoy dedicated account management, customized reporting, and priority support.",
      icon: <FaUserTie className="text-5xl text-yellow-600 mb-4" />
    },
    {
      title: "Vendor Partnerships",
      description: "Expand your reach by joining our network of trusted suppliers with streamlined onboarding.",
      icon: <FaHandshake className="text-5xl text-yellow-600 mb-4" />
    },
    {
      title: "Inventory Management",
      description: "Optimize stock levels with real-time insights and automated reordering tools.",
      icon: <FaWarehouse className="text-5xl text-yellow-600 mb-4" />
    }
  ];

  // FAQ Section
  const faqs = [
    {
      question: "What types of businesses can use SuperMarketplace?",
      answer: "SuperMarketplace caters to businesses of all sizes, from startups to large enterprises, across industries like retail, manufacturing, and hospitality."
    },
    {
      question: "How do I become a supplier on SuperMarketplace?",
      answer: "Register as a seller on SuperMarketplace, submit your business details and documentation, and our team will review your application within 48 hours."
    },
    {
      question: "What payment terms are available?",
      answer: "SuperMarketplace offers flexible terms including Net 30, Net 60, and custom arrangements for qualified accounts."
    }
  ];

  return (
    <div className="business-homepage bg-yellow-50">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-300 text-black py-24">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
            SuperMarketplace Solutions
          </h1>
          <p className="text-xl md:text-2xl mb-10 max-w-4xl mx-auto">
            Simplify procurement with SuperMarketplace, connecting you to verified suppliers and exclusive deals.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            {!auth.token ? (
              <>
                <a
                  href="/register"
                  className="bg-black text-yellow-300 px-10 py-4 rounded-full font-semibold text-lg hover:bg-gray-800 transition flex items-center justify-center gap-3 shadow-lg"
                >
                  <FaUserTie /> Create Account
                </a>
                <a
                  href="/login"
                  className="border-2 border-black text-black px-10 py-4 rounded-full font-semibold text-lg hover:bg-yellow-400 hover:text-black transition flex items-center justify-center gap-3"
                >
                  <FaShieldAlt /> Login
                </a>
              </>
            ) : (
              <a
                href="/products"
                className="bg-black text-yellow-300 px-10 py-4 rounded-full font-semibold text-lg hover:bg-gray-800 transition flex items-center justify-center gap-3 shadow-lg"
              >
                <FaShoppingCart /> Explore SuperMarketplace
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Value Proposition */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose SuperMarketplace?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Empower your business with robust tools and reliable partnerships.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-yellow-50 p-8 rounded-xl shadow-md hover:shadow-lg transition text-center">
              <FaChartLine className="text-6xl text-yellow-600 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Cost Savings</h3>
              <p className="text-gray-600">
                Unlock tiered pricing and bulk discounts to maximize your procurement budget.
              </p>
            </div>
            <div className="bg-yellow-50 p-8 rounded-xl shadow-md hover:shadow-lg transition text-center">
              <FaShieldAlt className="text-6xl text-yellow-600 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Trusted Network</h3>
              <p className="text-gray-600">
                Partner with vetted suppliers for consistent quality and reliability.
              </p>
            </div>
            <div className="bg-yellow-50 p-8 rounded-xl shadow-md hover:shadow-lg transition text-center">
              <FaExchangeAlt className="text-6xl text-yellow-600 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Flexible Payments</h3>
              <p className="text-gray-600">
                Choose from multiple payment terms tailored to your cash flow needs.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Business Statistics */}
      <div className="py-20 bg-yellow-100">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {businessStats.map((stat, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-md text-center">
                <div className="mb-6">{stat.icon}</div>
                <h3 className="text-4xl font-bold text-gray-900 mb-3">{stat.value}</h3>
                <p className="text-lg text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Business Solutions */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Comprehensive Business Solutions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tailored services to streamline your operations and drive growth.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {solutions.map((solution, index) => (
              <div key={index} className="bg-yellow-50 p-8 rounded-xl hover:bg-yellow-100 transition text-center">
                {solution.icon}
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{solution.title}</h3>
                <p className="text-gray-600">{solution.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Products */}
      <div className="py-20 bg-yellow-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Featured Products
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover our top products available for immediate purchase.
            </p>
          </div>

          {error && <Alert severity="error" className="mb-6">{error}</Alert>}

          {loading ? (
            <Box className="flex justify-center items-center">
              <CircularProgress />
            </Box>
          ) : products.length === 0 ? (
            <Typography variant="h6" className="text-center text-gray-600">
              No featured products available.
            </Typography>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product, index) => (
                <Card
                  key={product.id}
                  className={`shadow-md hover:shadow-lg transition bg-yellow-50`}
                >
                  <CardContent className="p-6">
                    <img
                      src={product.image || 'https://via.placeholder.com/150'}
                      alt={product.description}
                      className="w-full h-48 object-cover rounded-md mb-4"
                    />
                    <Typography variant="h6" className="font-semibold text-gray-800 mb-2">
                      {product.description || 'Unknown Product'}
                    </Typography>
                    <Typography variant="body2" className="text-gray-600 mb-4">
                      Price: ${product.price.toFixed(2)}
                    </Typography>
                  </CardContent>
                  <CardActions className="p-6 pt-0">
                    <Button
                      variant="contained"
                      className="bg-yellow-600 hover:bg-yellow-700"
                      onClick={() => addToCart(product.id)}
                      disabled={cartLoading[product.id] || !auth.token}
                      startIcon={<FaShoppingCart />}
                    >
                      {cartLoading[product.id] ? 'Adding...' : 'Add to Cart'}
                    </Button>
                  </CardActions>
                </Card>
              ))}
            </div>
          )}
          <div className="text-center mt-10">
            <a
              href="/products"
              className="bg-black text-yellow-300 px-8 py-3 rounded-full font-semibold text-lg hover:bg-gray-800 transition inline-flex items-center gap-3"
            >
              <FaShoppingCart /> View All Products
            </a>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-20 bg-yellow-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get answers to common questions about SuperMarketplace.
            </p>
          </div>
          <div className="space-y-6 max-w-3xl mx-auto">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-3">
                  <FaQuestionCircle className="text-yellow-600" /> {faq.question}
                </h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-20 bg-gradient-to-r from-yellow-500 to-yellow-300 text-black">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Transform Your Procurement with SuperMarketplace
          </h2>
          <p className="text-xl mb-10 max-w-3xl mx-auto">
            Connect with our team to discover how SuperMarketplace can optimize your supply chain and boost efficiency.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <a
              href="/contact"
              className="bg-black text-yellow-300 px-10 py-4 rounded-full font-semibold text-lg hover:bg-gray-800 transition flex items-center justify-center gap-3 shadow-lg"
            >
              <FaFileInvoiceDollar /> Request a Demo
            </a>
            <a
              href="tel:+1234567890"
              className="border-2 border-black text-black px-10 py-4 rounded-full font-semibold text-lg hover:bg-yellow-400 hover:text-black transition flex items-center justify-center gap-3"
            >
              <FaHeadset /> Call Sales: (123) 456-7890
            </a>
          </div>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <h3 className="text-center text-gray-500 mb-10 text-lg font-semibold uppercase">
            Trusted by Industry Leaders
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-center">
                <img
                  src={`https://via.placeholder.com/150x60?text=Company+${i}`}
                  alt={`Company ${i}`}
                  className="h-12 object-contain grayscale hover:grayscale-0 transition"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;