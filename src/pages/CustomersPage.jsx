import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerApi, bookingApi } from '../services/api';
import CustomerFormModal from '../components/customers/CustomerFormModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { useToast } from '../context/ToastContext';
import {
  Plus,
  Search,
  Mail,
  Phone,
  MapPin,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';

export default function CustomersPage() {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [customers, setCustomers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deletingCustomer, setDeletingCustomer] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchCustomersAndBookings();
  }, []);

  const fetchCustomersAndBookings = async () => {
    setLoading(true);
    try {
      const [customersData, bookingsData] = await Promise.all([
        customerApi.getAll(),
        bookingApi.getAll(),
      ]);
      setCustomers(customersData || []);
      setBookings(bookingsData || []);
    } catch (err) {
      error(`Failed to load customers: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const customerStatsMap = useMemo(() => {
    const map = {};
    bookings.forEach((b) => {
      const cId = String(b.customerId);
      if (!map[cId]) {
        map[cId] = { totalBookings: 0, totalSpend: 0, activeBookings: 0 };
      }
      map[cId].totalBookings += 1;
      if (b.status === 'Confirmed') {
        map[cId].activeBookings += 1;
      }
      if (b.status === 'Confirmed' || b.status === 'Completed') {
        map[cId].totalSpend += Number(b.totalAmount) || 0;
      }
    });
    return map;
  }, [bookings]);

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase().trim();
    return customers.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.city && c.city.toLowerCase().includes(q)) ||
        (c.country && c.country.toLowerCase().includes(q))
    );
  }, [customers, searchQuery]);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (customer) => {
    setEditingCustomer(customer);
    setIsFormOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCustomer) return;
    setIsDeleting(true);
    try {
      await customerApi.delete(deletingCustomer.id);
      success(`Customer "${deletingCustomer.fullName}" deleted.`);
      setDeletingCustomer(null);
      fetchCustomersAndBookings();
    } catch (err) {
      error(`Failed to delete customer: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-actions">
        <div>
          <h2 className="section-heading">Customer Directory</h2>
          <p className="section-subheading">
            Manage customer profiles, contact information, and booking history.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={15} /> Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="filter-control-card">
        <div className="filter-main-row">
          <div className="search-input-wrapper">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by name, email, phone, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
              >
                ×
              </button>
            )}
          </div>
        </div>

        <div className="filter-results-info">
          <span>
            Showing <strong>{filteredCustomers.length}</strong> of <strong>{customers.length}</strong> customers
          </span>
          {searchQuery && (
            <button
              type="button"
              className="filter-reset-link"
              onClick={() => setSearchQuery('')}
            >
              Clear Search
            </button>
          )}
        </div>
      </div>

      {/* Customer Table */}
      {loading ? (
        <LoadingSpinner message="Loading customer records..." />
      ) : filteredCustomers.length === 0 ? (
        <EmptyState
          title="No Customers Found"
          description="No customers match your search query."
          actionLabel="Add Customer"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="table-card">
          <div className="table-responsive">
            <table className="operational-table">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Booking History</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => {
                  const stats = customerStatsMap[String(customer.id)] || {
                    totalBookings: 0,
                    totalSpend: 0,
                    activeBookings: 0,
                  };

                  const initials = customer.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();

                  return (
                    <tr key={customer.id}>
                      <td>
                        <div
                          className="customer-profile-cell"
                          onClick={() => navigate(`/customers/${customer.id}`)}
                        >
                          <div className="customer-avatar-badge">{initials}</div>
                          <div>
                            <span className="customer-full-name">{customer.fullName}</span>
                            <span className="customer-id-tag">ID: #{customer.id}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="contact-link">
                          <Mail size={13} />
                          <span>{customer.email}</span>
                        </div>
                      </td>
                      <td>
                        <div className="contact-link">
                          <Phone size={13} />
                          <span>{customer.phone}</span>
                        </div>
                      </td>
                      <td>
                        <div className="contact-link">
                          <MapPin size={13} />
                          <span>
                            {customer.address ? `${customer.address}, ` : ''}
                            {customer.city ? `${customer.city}, ` : ''}
                            {customer.country || '—'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="stay-count-badge">
                          {stats.totalBookings} booking{stats.totalBookings !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="action-buttons-group">
                          <button
                            type="button"
                            className="action-btn-icon"
                            title="View Customer Details"
                            onClick={() => navigate(`/customers/${customer.id}`)}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            type="button"
                            className="action-btn-icon"
                            title="Edit Customer"
                            onClick={() => handleOpenEdit(customer)}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            className="action-btn-icon danger"
                            title="Delete Customer"
                            onClick={() => setDeletingCustomer(customer)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Form Modal */}
      <CustomerFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        customer={editingCustomer}
        onSuccess={fetchCustomersAndBookings}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingCustomer)}
        onClose={() => setDeletingCustomer(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Customer"
        message={`Are you sure you want to delete customer "${deletingCustomer?.fullName}"?`}
        confirmText="Delete"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
}
