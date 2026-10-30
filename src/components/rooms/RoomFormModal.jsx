import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { roomApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const ROOM_TYPES = ['Single', 'Double', 'Deluxe', 'Suite', 'Premium'];
const STATUS_OPTIONS = ['Available', 'Occupied', 'Maintenance'];

const DEFAULT_AMENITIES = [
  'Free Wi-Fi',
  'Air Conditioning',
  'Attached Bathroom',
  'LED TV',
  'Tea/Coffee Maker',
  'Hot Water 24/7',
  'Wardrobe',
  'Room Service',
  'Work Desk',
  'Balcony'
];

export default function RoomFormModal({ isOpen, onClose, room, existingRooms = [], onSuccess }) {
  const { success, error } = useToast();
  const isEditing = Boolean(room);

  const [formData, setFormData] = useState({
    roomNumber: '',
    type: 'Single',
    pricePerNight: '',
    capacity: 2,
    floor: 1,
    status: 'Available',
    image: '',
    description: '',
    amenities: ['Free Wi-Fi', 'Attached Bathroom', 'Air Conditioning'],
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (room) {
      setFormData({
        roomNumber: room.roomNumber || '',
        type: room.type || 'Single',
        pricePerNight: room.pricePerNight || '',
        capacity: room.capacity || 2,
        floor: room.floor || 1,
        status: room.status || 'Available',
        image: room.image || '',
        description: room.description || '',
        amenities: Array.isArray(room.amenities) ? room.amenities : [],
      });
    } else {
      setFormData({
        roomNumber: '',
        type: 'Single',
        pricePerNight: '',
        capacity: 2,
        floor: 1,
        status: 'Available',
        image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80',
        description: '',
        amenities: ['Free Wi-Fi', 'Attached Bathroom', 'Air Conditioning'],
      });
    }
    setErrors({});
  }, [room, isOpen]);

  const validate = () => {
    const newErrors = {};

    if (!formData.roomNumber.trim()) {
      newErrors.roomNumber = 'Room number is required.';
    } else {
      const duplicate = existingRooms.find(
        (r) =>
          r.roomNumber.toString().trim() === formData.roomNumber.toString().trim() &&
          (!isEditing || String(r.id) !== String(room?.id))
      );
      if (duplicate) {
        newErrors.roomNumber = `Room ${formData.roomNumber} already exists.`;
      }
    }

    const price = Number(formData.pricePerNight);
    if (!formData.pricePerNight || isNaN(price) || price <= 0) {
      newErrors.pricePerNight = 'Please enter a valid positive price.';
    }

    const capacity = Number(formData.capacity);
    if (!capacity || capacity < 1 || capacity > 10) {
      newErrors.capacity = 'Capacity must be between 1 and 10.';
    }

    const floor = Number(formData.floor);
    if (!floor || floor < 1) {
      newErrors.floor = 'Please enter a valid floor number.';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Please enter a room description.';
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

  const toggleAmenity = (amenity) => {
    setFormData((prev) => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((a) => a !== amenity)
          : [...prev.amenities, amenity],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        roomNumber: formData.roomNumber.trim(),
        type: formData.type,
        pricePerNight: Number(formData.pricePerNight),
        capacity: Number(formData.capacity),
        floor: Number(formData.floor),
        status: formData.status,
        image: formData.image.trim() || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80',
        description: formData.description.trim(),
        amenities: formData.amenities,
      };

      if (isEditing) {
        await roomApi.update(room.id, { ...room, ...payload });
        success(`Room ${payload.roomNumber} updated.`);
      } else {
        await roomApi.create(payload);
        success(`Room ${payload.roomNumber} added.`);
      }

      onSuccess();
      onClose();
    } catch (err) {
      error(`Failed to save room: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Room ${room?.roomNumber}` : 'Add Room'}
      subtitle="Enter room number, type, pricing, and amenities"
      maxWidth="620px"
    >
      <form onSubmit={handleSubmit} className="form-stack">
        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">
              Room Number <span className="req">*</span>
            </label>
            <input
              type="text"
              name="roomNumber"
              className={`form-input ${errors.roomNumber ? 'input-error' : ''}`}
              placeholder="e.g. 101"
              value={formData.roomNumber}
              onChange={handleChange}
            />
            {errors.roomNumber && <p className="field-error">{errors.roomNumber}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">
              Room Type <span className="req">*</span>
            </label>
            <select
              name="type"
              className="form-select"
              value={formData.type}
              onChange={handleChange}
            >
              {ROOM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-grid-3">
          <div className="form-group">
            <label className="form-label">
              Price Per Night (₹) <span className="req">*</span>
            </label>
            <input
              type="number"
              name="pricePerNight"
              className={`form-input ${errors.pricePerNight ? 'input-error' : ''}`}
              placeholder="e.g. 2500"
              min="1"
              value={formData.pricePerNight}
              onChange={handleChange}
            />
            {errors.pricePerNight && <p className="field-error">{errors.pricePerNight}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">
              Capacity (Guests) <span className="req">*</span>
            </label>
            <input
              type="number"
              name="capacity"
              className={`form-input ${errors.capacity ? 'input-error' : ''}`}
              placeholder="e.g. 2"
              min="1"
              max="10"
              value={formData.capacity}
              onChange={handleChange}
            />
            {errors.capacity && <p className="field-error">{errors.capacity}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">
              Floor <span className="req">*</span>
            </label>
            <input
              type="number"
              name="floor"
              className={`form-input ${errors.floor ? 'input-error' : ''}`}
              placeholder="1"
              min="1"
              value={formData.floor}
              onChange={handleChange}
            />
            {errors.floor && <p className="field-error">{errors.floor}</p>}
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">Availability Status</label>
            <select
              name="status"
              className="form-select"
              value={formData.status}
              onChange={handleChange}
            >
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Image URL</label>
            <input
              type="url"
              name="image"
              className="form-input"
              placeholder="https://..."
              value={formData.image}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            Description <span className="req">*</span>
          </label>
          <textarea
            name="description"
            rows="3"
            className={`form-textarea ${errors.description ? 'input-error' : ''}`}
            placeholder="Room details and furnishings..."
            value={formData.description}
            onChange={handleChange}
          />
          {errors.description && <p className="field-error">{errors.description}</p>}
        </div>

        <div className="form-group">
          <label className="form-label">Amenities</label>
          <div className="amenity-chips-grid">
            {DEFAULT_AMENITIES.map((amenity) => {
              const selected = formData.amenities.includes(amenity);
              return (
                <button
                  type="button"
                  key={amenity}
                  className={`amenity-chip ${selected ? 'selected' : ''}`}
                  onClick={() => toggleAmenity(amenity)}
                >
                  <span className="chip-indicator">{selected ? '✓' : '+'}</span>
                  {amenity}
                </button>
              );
            })}
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
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Room' : 'Add Room'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
