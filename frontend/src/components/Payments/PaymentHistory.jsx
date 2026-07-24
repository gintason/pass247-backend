import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, success, pending, failed
  const [sortOrder, setSortOrder] = useState('desc'); // desc, asc
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      const response = await api.get('/api/payments/history/');
      setPayments(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      toast.error('Failed to load payment history');
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'success':
        return <span className="badge bg-success">Success</span>;
      case 'pending':
        return <span className="badge bg-warning text-dark">Pending</span>;
      case 'failed':
        return <span className="badge bg-danger">Failed</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'success':
        return <i className="bi bi-check-circle-fill text-success"></i>;
      case 'pending':
        return <i className="bi bi-hourglass-split text-warning"></i>;
      case 'failed':
        return <i className="bi bi-x-circle-fill text-danger"></i>;
      default:
        return <i className="bi bi-question-circle text-secondary"></i>;
    }
  };

  const filteredPayments = payments
    .filter(p => filter === 'all' || p.status === filter)
    .sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  const stats = {
    total: payments.reduce((sum, p) => sum + (p.status === 'success' ? p.amount : 0), 0),
    count: payments.filter(p => p.status === 'success').length,
    pending: payments.filter(p => p.status === 'pending').length,
    failed: payments.filter(p => p.status === 'failed').length
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-history-container py-5">
      <div className="container">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-md-8">
            <h2 className="fw-bold mb-2" style={{ color: '#4400ff' }}>
              <i className="bi bi-receipt me-2"></i>
              Payment History
            </h2>
            <p className="text-muted">View all your past transactions and subscription details</p>
          </div>
          <div className="col-md-4 text-md-end">
            <Link to="/payment-plans" className="btn btn-primary">
              <i className="bi bi-plus-circle me-2"></i>
              New Subscription
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="row g-4 mb-4">
          <div className="col-md-3 col-6">
            <div className="card bg-primary text-white border-0 shadow">
              <div className="card-body">
                <h6 className="text-white-50 mb-2">Total Spent</h6>
                <h3 className="mb-0">{formatCurrency(stats.total)}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="card bg-success text-white border-0 shadow">
              <div className="card-body">
                <h6 className="text-white-50 mb-2">Successful</h6>
                <h3 className="mb-0">{stats.count}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="card bg-warning text-dark border-0 shadow">
              <div className="card-body">
                <h6 className="text-dark-50 mb-2">Pending</h6>
                <h3 className="mb-0">{stats.pending}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="card bg-danger text-white border-0 shadow">
              <div className="card-body">
                <h6 className="text-white-50 mb-2">Failed</h6>
                <h3 className="mb-0">{stats.failed}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card border-0 shadow mb-4">
          <div className="card-body">
            <div className="row align-items-center">
              <div className="col-md-4 mb-3 mb-md-0">
                <label className="form-label fw-bold mb-2">Filter by Status</label>
                <div className="btn-group w-100">
                  <button 
                    className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setFilter('all')}
                  >
                    All
                  </button>
                  <button 
                    className={`btn ${filter === 'success' ? 'btn-success' : 'btn-outline-success'}`}
                    onClick={() => setFilter('success')}
                  >
                    Success
                  </button>
                  <button 
                    className={`btn ${filter === 'pending' ? 'btn-warning' : 'btn-outline-warning'}`}
                    onClick={() => setFilter('pending')}
                  >
                    Pending
                  </button>
                  <button 
                    className={`btn ${filter === 'failed' ? 'btn-danger' : 'btn-outline-danger'}`}
                    onClick={() => setFilter('failed')}
                  >
                    Failed
                  </button>
                </div>
              </div>
              <div className="col-md-4 offset-md-4">
                <label className="form-label fw-bold mb-2">Sort by Date</label>
                <div className="btn-group w-100">
                  <button 
                    className={`btn ${sortOrder === 'desc' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setSortOrder('desc')}
                  >
                    <i className="bi bi-sort-down me-2"></i>
                    Newest First
                  </button>
                  <button 
                    className={`btn ${sortOrder === 'asc' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setSortOrder('asc')}
                  >
                    <i className="bi bi-sort-up me-2"></i>
                    Oldest First
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment List */}
        {filteredPayments.length === 0 ? (
          <div className="card border-0 shadow text-center p-5">
            <i className="bi bi-receipt display-1 text-muted mb-3"></i>
            <h5>No payment history found</h5>
            <p className="text-muted mb-4">
              {filter !== 'all' 
                ? `No ${filter} payments found.` 
                : "You haven't made any payments yet."}
            </p>
            <Link to="/payment-plans" className="btn btn-primary">
              View Plans
            </Link>
          </div>
        ) : (
          <div className="card border-0 shadow">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3">Plan</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Expiry Date</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filteredPayments.map((payment, index) => (
                      <motion.tr 
                        key={payment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ delay: index * 0.05 }}
                        className={selectedPayment === payment.id ? 'table-active' : ''}
                      >
                        <td className="px-4 py-3">
                          <div>
                            <div>{formatDate(payment.created_at)}</div>
                            <small className="text-muted">
                              {new Date(payment.created_at).toLocaleTimeString()}
                            </small>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-monospace small">
                            {payment.reference}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="fw-bold">{payment.plan_name || 'Premium'}</span>
                        </td>
                        <td className="px-4 py-3 fw-bold">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="d-flex align-items-center">
                            {getStatusIcon(payment.status)}
                            <span className="ms-2">
                              {getStatusBadge(payment.status)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {payment.expiry_date ? (
                            <div>
                              <div>{new Date(payment.expiry_date).toLocaleDateString()}</div>
                              {new Date(payment.expiry_date) > new Date() ? (
                                <small className="text-success">Active</small>
                              ) : (
                                <small className="text-danger">Expired</small>
                              )}
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button 
                            className="btn btn-sm btn-outline-primary me-2"
                            onClick={() => setSelectedPayment(
                              selectedPayment === payment.id ? null : payment.id
                            )}
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          {payment.status === 'success' && (
                            <button 
                              className="btn btn-sm btn-outline-success"
                              onClick={() => {
                                navigator.clipboard.writeText(payment.reference);
                                toast.success('Reference copied to clipboard');
                              }}
                            >
                              <i className="bi bi-files"></i>
                            </button>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Payment Details Modal (simplified inline) */}
            {selectedPayment && (
              <motion.div 
                className="border-top p-4 bg-light"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <div className="row">
                  <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold mb-0">Payment Details</h6>
                      <button 
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setSelectedPayment(null)}
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                    </div>
                    <div className="row">
                      {payments.find(p => p.id === selectedPayment) && (
                        <>
                          <div className="col-md-3">
                            <small className="text-muted d-block">Payment Method</small>
                            <span>Card Payment via Paystack</span>
                          </div>
                          <div className="col-md-3">
                            <small className="text-muted d-block">Transaction ID</small>
                            <span className="font-monospace">
                              {payments.find(p => p.id === selectedPayment).reference}
                            </span>
                          </div>
                          <div className="col-md-3">
                            <small className="text-muted d-block">Payment Date</small>
                            <span>
                              {formatDate(payments.find(p => p.id === selectedPayment).created_at)}
                            </span>
                          </div>
                          <div className="col-md-3">
                            <small className="text-muted d-block">Status</small>
                            <span>
                              {getStatusBadge(payments.find(p => p.id === selectedPayment).status)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Download Options */}
        {filteredPayments.length > 0 && (
          <div className="text-end mt-4">
            <button className="btn btn-outline-secondary me-2">
              <i className="bi bi-download me-2"></i>
              Download CSV
            </button>
            <button className="btn btn-outline-secondary">
              <i className="bi bi-printer me-2"></i>
              Print
            </button>
          </div>
        )}
      </div>

      {/* Custom Styles */}
      <style>{`
        .payment-history-container {
          background-color: #f8f9fa;
          min-height: 100vh;
        }
        .table > :not(caption) > * > * {
          padding: 1rem 0.5rem;
        }
        .font-monospace {
          font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Consolas', monospace;
        }
      `}</style>
    </div>
  );
};

export default PaymentHistory;