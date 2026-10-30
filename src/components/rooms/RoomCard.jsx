import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge, RoomTypeBadge } from '../common/Badge';
import { formatCurrency } from '../../utils/formatters';
import { Users, Edit, Trash2, Eye } from 'lucide-react';

export default function RoomCard({ room, onEdit, onDelete }) {
  const navigate = useNavigate();

  return (
    <div className="room-card">
      <div className="room-card-image-wrap">
        <img
          src={room.image}
          alt={`Room ${room.roomNumber}`}
          className="room-card-image"
          loading="lazy"
        />
        <div className="room-card-status-overlay">
          <StatusBadge status={room.status} />
        </div>
        <div className="room-card-type-overlay">
          <RoomTypeBadge type={room.type} />
        </div>
      </div>

      <div className="room-card-body">
        <div className="room-card-header">
          <div>
            <h3 className="room-card-number">Room {room.roomNumber}</h3>
            <span className="room-card-floor">Floor {room.floor}</span>
          </div>
          <div className="room-card-price">
            <span className="price-val">{formatCurrency(room.pricePerNight)}</span>
            <span className="price-unit">/night</span>
          </div>
        </div>

        <p className="room-card-description">{room.description}</p>

        <div className="room-card-amenities">
          {Array.isArray(room.amenities) &&
            room.amenities.slice(0, 3).map((a, i) => (
              <span key={i} className="amenity-tag">
                {a}
              </span>
            ))}
          {Array.isArray(room.amenities) && room.amenities.length > 3 && (
            <span className="amenity-tag-more">+{room.amenities.length - 3} more</span>
          )}
        </div>

        <div className="room-card-footer">
          <div className="room-card-meta">
            <span className="meta-info">
              <Users size={12} /> Max {room.capacity}
            </span>
          </div>

          <div className="room-card-actions">
            <button
              type="button"
              className="action-btn-icon"
              title="View Details"
              onClick={() => navigate(`/rooms/${room.id}`)}
            >
              <Eye size={14} />
            </button>
            <button
              type="button"
              className="action-btn-icon"
              title="Edit Room"
              onClick={() => onEdit(room)}
            >
              <Edit size={14} />
            </button>
            <button
              type="button"
              className="action-btn-icon danger"
              title="Delete Room"
              onClick={() => onDelete(room)}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
