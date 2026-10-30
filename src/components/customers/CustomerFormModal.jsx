import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { customerApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function CustomerFormModal({ isOpen, onClose, customer, onSuccess }) {
  const { success, error } = useToast();
  const isEditing = Boolean(customer);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (customer) {
      setFormData({
        fullName: customer.fullName || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        city: customer.city || '',
        country: customer.country || '',
      });
    } else {
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: '',
      });
    }
    setErrors({});
  }, [customer, isOpen]);

  const validate = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required.';
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = 'Enter at least 3 characters.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Enter a valid email address.';
    }

    const phoneClean = formData.phone.replace(/[\s()-]/g, '');
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required.';
    } else if (phoneClean.length < 8) {
      newErrors.phone = 'Enter a valid phone number.';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required.';
    }
    if (!formData.country.trim()) {
      newErrors.country = 'Country is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        country: formData.country.trim(),
      };

      if (isEditing) {
        await customerApi.update(customer.id, {
          ...customer,
          ...payload,
        });
        success(`Customer "${payload.fullName}" updated.`);
      } else {
        const newCustomer = {
          ...payload,
          createdAt: new Date().toISOString().split('T')[0],
        };
        await customerApi.create(newCustomer);
        success(`Customer "${payload.fullName}" added.`);
      }

      onSuccess();
      onClose();
    } catch (err) {
      error(`Failed to save customer: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Customer: ${customer?.fullName}` : 'Add New Customer'}
      subtitle="Enter customer contact details"
      maxWidth="560px"
    >
      <form onSubmit={handleSubmit} className="form-stack">
        <div className="form-group">
          <label className="form-label">
            Full Name <span className="req">*</span>
          </label>
          <input
            type="text"
            name="fullName"
            className={`form-input ${errors.fullName ? 'input-error' : ''}`}
            placeholder="e.g. Ramesh Kumar"
            value={formData.fullName}
            onChange={handleChange}
          />
          {errors.fullName && <p className="field-error">{errors.fullName}</p>}
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">
              Email Address <span className="req">*</span>
            </label>
            <input
              type="email"
              name="email"
              className={`form-input ${errors.email ? 'input-error' : ''}`}
              placeholder="ramesh@example.com"
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && <p className="field-error">{errors.email}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">
              Phone Number <span className="req">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              className={`form-input ${errors.phone ? 'input-error' : ''}`}
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={handleChange}
            />
            {errors.phone && <p className="field-error">{errors.phone}</p>}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Address</label>
          <input
            type="text"
            name="address"
            className="form-input"
            placeholder="e.g. 123 Main Street"
            value={formData.address}
            onChange={handleChange}
          />
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">
              City <span className="req">*</span>
            </label>
            <input
              type="text"
              name="city"
              className={`form-input ${errors.city ? 'input-error' : ''}`}
              placeholder="e.g. Hyderabad"
              value={formData.city}
              onChange={handleChange}
            />
            {errors.city && <p className="field-error">{errors.city}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">
              Country <span className="req">*</span>
            </label>
            <input
              type="text"
              name="country"
              className={`form-input ${errors.country ? 'input-error' : ''}`}
              placeholder="e.g. India"
              value={formData.country}
              onChange={handleChange}
            />
            {errors.country && <p className="field-error">{errors.country}</p>}
          </div>
        </div>

        <div className="modal-actions-bar">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Customer' : 'Add Customer'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
