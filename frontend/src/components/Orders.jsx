import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaBox, FaSyncAlt, FaShippingFast, FaMoneyBillWave, FaInfoCircle } from 'react-icons/fa';
import { FiPackage } from 'react-icons/fi';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState({});
  const [userRole, setUserRole] = useState(null);
  const [statusForm, setStatusForm] = useState({});

  const paymentStatuses = ['pending', 'completed', 'failed', 'canceled'];
  const deliveryStatuses = ['pending', 'shipped', 'delivered', 'canceled'];

  useEffect(() => {
    const verifyUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Please log in to view your orders');
          return;
        }
        const response = await axios.get('http://localhost:5000/api/auth/verify', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserRole(response.data.user.role);
        fetchOrders();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to verify user');
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
        }
      }
    };
    verifyUser();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(response.data);
      setError('');
      const initialStatusForm = response.data.reduce((acc, order) => ({
        ...acc,
        [order.id]: {
          paymentStatus: order.paymentStatus || 'pending',
          deliveryStatus: order.deliveryStatus || 'pending', // Default to 'pending' if undefined
        },
      }), {});
      setStatusForm(initialStatusForm);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
        localStorage.removeItem('token');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch orders');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId) => {
    const { paymentStatus, deliveryStatus } = statusForm[orderId] || {};
    if (!paymentStatus || !deliveryStatus) {
      setError('Please select valid statuses');
      return;
    }
    try {
      setUpdateLoading((prev) => ({ ...prev, [orderId]: true }));
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/orders/update-status/${orderId}`,
        { paymentStatus, deliveryStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? { ...order, paymentStatus, deliveryStatus }
            : order
        )
      );
      setSuccess(`Order ${orderId} status updated successfully`);
      setError('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order status');
      setTimeout(() => setError(''), 3000);
    } finally {
      setUpdateLoading((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const handleStatusChange = (orderId, field, value) => {
    setStatusForm((prev) => ({
      ...prev,
      [orderId]: { ...prev[orderId], [field]: value },
    }));
    setError('');
    setSuccess('');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-200 text-yellow-800';
      case 'failed':
      case 'canceled':
        return 'bg-red-100 text-red-800';
      case 'shipped':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-yellow-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FiPackage className="text-3xl text-yellow-600" />
            <h1 className="text-2xl font-bold text-gray-900">SuperMarketplace Order Management</h1>
          </div>
          {/* Refresh button with yellow hover and focus ring */}
          <button
            onClick={fetchOrders}
            className="flex items-center space-x-1 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
          >
            <FaSyncAlt className={`${loading ? 'animate-spin' : ''} text-yellow-600`} />
            <span>Refresh</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-md bg-yellow-100 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">{success}</h3>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
          </div>
        ) : !userRole ? (
          <div className="text-center py-20 text-gray-600">
            Verifying user...
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <FiPackage className="mx-auto h-12 w-12 text-yellow-600" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No orders found</h3>
            <p className="mt-1 text-sm text-gray-500">You haven't placed any orders yet.</p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-yellow-100">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Details
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <FaShippingFast className="mr-1 text-yellow-600" />
                        Delivery
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <FaMoneyBillWave className="mr-1 text-yellow-600" />
                        Payment
                      </div>
                    </th>
                    {userRole === 'seller' && (
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-yellow-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img
                              className="h-10 w-10 rounded-md object-cover"
                              src={order.image || 'https://via.placeholder.com/40'}
                              alt={order.description}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {order.description || 'Unknown Product'}
                            </div>
                            <div className="text-sm text-gray-500">ID: {order.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${(order.total || order.price * order.quantity || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {userRole === 'seller' ? (
                          <select
                            value={statusForm[order.id]?.deliveryStatus || order.deliveryStatus || 'pending'}
                            onChange={(e) => handleStatusChange(order.id, 'deliveryStatus', e.target.value)}
                            disabled={updateLoading[order.id]}
                            className={`${getStatusColor(statusForm[order.id]?.deliveryStatus || order.deliveryStatus || 'pending')} text-xs font-medium px-2.5 py-0.5 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500`}
                          >
                            {deliveryStatuses.map((status) => (
                              <option key={status} value={status}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className={`${getStatusColor(order.deliveryStatus || 'pending')} text-xs font-medium px-2.5 py-0.5 rounded-full`}>
                            {(order.deliveryStatus || 'pending').charAt(0).toUpperCase() + (order.deliveryStatus || 'pending').slice(1)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {userRole === 'seller' ? (
                          <select
                            value={statusForm[order.id]?.paymentStatus || order.paymentStatus || 'pending'}
                            onChange={(e) => handleStatusChange(order.id, 'paymentStatus', e.target.value)}
                            disabled={updateLoading[order.id]}
                            className={`${getStatusColor(statusForm[order.id]?.paymentStatus || order.paymentStatus || 'pending')} text-xs font-medium px-2.5 py-0.5 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500`}
                          >
                            {paymentStatuses.map((status) => (
                              <option key={status} value={status}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className={`${getStatusColor(order.paymentStatus || 'pending')} text-xs font-medium px-2.5 py-0.5 rounded-full`}>
                            {(order.paymentStatus || 'pending').charAt(0).toUpperCase() + (order.paymentStatus || 'pending').slice(1)}
                          </span>
                        )}
                      </td>
                      {userRole === 'seller' && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => updateOrderStatus(order.id)}
                            disabled={updateLoading[order.id]}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                          >
                            {updateLoading[order.id] ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Updating
                              </>
                            ) : (
                              <>
                                <FaSyncAlt className="-ml-1 mr-2 h-4 w-4" />
                                Update
                              </>
                            )}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;