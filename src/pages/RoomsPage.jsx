import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { roomApi } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import { StatusBadge, RoomTypeBadge } from '../components/common/Badge';
import RoomCard from '../components/rooms/RoomCard';
import RoomFormModal from '../components/rooms/RoomFormModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { useToast } from '../context/ToastContext';
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Edit,
  Trash2,
  Eye,
  Users
} from 'lucide-react';

const ROOM_TYPES = ['All Types', 'Single', 'Double', 'Deluxe', 'Suite', 'Premium'];
const STATUS_FILTERS = ['All Statuses', 'Available', 'Occupied', 'Maintenance'];
const SORT_OPTIONS = [
  { value: 'roomAsc', label: 'Room Number (Ascending)' },
  { value: 'roomDesc', label: 'Room Number (Descending)' },
  { value: 'priceAsc', label: 'Price: Low to High' },
  { value: 'priceDesc', label: 'Price: High to Low' },
];

export default function RoomsPage() {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & display mode
  const [viewMode, setViewMode] = useState('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [sortBy, setSortBy] = useState('roomAsc');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [deletingRoom, setDeletingRoom] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const data = await roomApi.getAll();
      setRooms(data || []);
    } catch (err) {
      error(`Failed to fetch rooms: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredRooms = useMemo(() => {
    return rooms
      .filter((room) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchNum = room.roomNumber.toString().toLowerCase().includes(q);
          const matchType = room.type.toLowerCase().includes(q);
          const matchDesc = (room.description || '').toLowerCase().includes(q);
          if (!matchNum && !matchType && !matchDesc) return false;
        }

        if (typeFilter !== 'All Types' && room.type.toLowerCase() !== typeFilter.toLowerCase()) {
          return false;
        }

        if (statusFilter !== 'All Statuses' && room.status.toLowerCase() !== statusFilter.toLowerCase()) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'priceAsc') return a.pricePerNight - b.pricePerNight;
        if (sortBy === 'priceDesc') return b.pricePerNight - a.pricePerNight;
        if (sortBy === 'roomDesc') return b.roomNumber.localeCompare(a.roomNumber, undefined, { numeric: true });
        return a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true });
      });
  }, [rooms, searchQuery, typeFilter, statusFilter, sortBy]);

  const handleOpenAdd = () => {
    setEditingRoom(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (room) => {
    setEditingRoom(room);
    setIsFormOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingRoom) return;
    setIsDeleting(true);
    try {
      await roomApi.delete(deletingRoom.id);
      success(`Room ${deletingRoom.roomNumber} has been deleted.`);
      setDeletingRoom(null);
      fetchRooms();
    } catch (err) {
      error(`Failed to delete room: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header-actions">
        <div>
          <h2 className="section-heading">Rooms Inventory</h2>
          <p className="section-subheading">
            Manage hotel rooms, nightly rates, capacity, and current availability status.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={15} /> Add Room
        </button>
      </div>

      {/* Control Bar: Search, Filters, Sorters, View Toggle */}
      <div className="filter-control-card">
        <div className="filter-main-row">
          <div className="search-input-wrapper">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by room number, type, or description..."
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

          <div className="filter-select-wrapper">
            <select
              className="form-select filter-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              {ROOM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-select-wrapper">
            <select
              className="form-select filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-select-wrapper">
            <select
              className="form-select filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="view-mode-toggle">
            <button
              type="button"
              className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
              aria-label="Table View"
            >
              <List size={15} />
            </button>
            <button
              type="button"
              className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Card View"
              aria-label="Card View"
            >
              <LayoutGrid size={15} />
            </button>
          </div>
        </div>

        <div className="filter-results-info">
          <span>
            Showing <strong>{filteredRooms.length}</strong> of <strong>{rooms.length}</strong> rooms
          </span>
          {(searchQuery || typeFilter !== 'All Types' || statusFilter !== 'All Statuses') && (
            <button
              type="button"
              className="filter-reset-link"
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('All Types');
                setStatusFilter('All Statuses');
                setSortBy('roomAsc');
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <LoadingSpinner message="Loading rooms..." />
      ) : filteredRooms.length === 0 ? (
        <EmptyState
          title="No Rooms Found"
          description="No rooms match your search query or filter selection."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearchQuery('');
            setTypeFilter('All Types');
            setStatusFilter('All Statuses');
          }}
        />
      ) : viewMode === 'table' ? (
        <div className="table-card">
          <div className="table-responsive">
            <table className="operational-table">
              <thead>
                <tr>
                  <th>Room Number</th>
                  <th>Room Type</th>
                  <th>Capacity</th>
                  <th>Price Per Night</th>
                  <th>Availability</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRooms.map((room) => (
                  <tr key={room.id}>
                    <td>
                      <div className="chamber-cell" onClick={() => navigate(`/rooms/${room.id}`)}>
                        <img
                          src={room.image}
                          alt={room.roomNumber}
                          className="table-chamber-thumb"
                        />
                        <div>
                          <span className="chamber-name">Room {room.roomNumber}</span>
                          <span className="chamber-id">Floor {room.floor}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <RoomTypeBadge type={room.type} />
                    </td>
                    <td>
                      <span className="capacity-badge">
                        <Users size={12} /> {room.capacity} guest{room.capacity > 1 ? 's' : ''}
                      </span>
                    </td>
                    <td>
                      <span className="price-bold">{formatCurrency(room.pricePerNight)}</span>
                    </td>
                    <td>
                      <StatusBadge status={room.status} />
                    </td>
                    <td className="text-right">
                      <div className="action-buttons-group">
                        <button
                          type="button"
                          className="action-btn-icon"
                          title="View Room Details"
                          onClick={() => navigate(`/rooms/${room.id}`)}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          className="action-btn-icon"
                          title="Edit Room"
                          onClick={() => handleOpenEdit(room)}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          type="button"
                          className="action-btn-icon danger"
                          title="Delete Room"
                          onClick={() => setDeletingRoom(room)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rooms-cards-grid">
          {filteredRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onEdit={handleOpenEdit}
              onDelete={setDeletingRoom}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Room Modal */}
      <RoomFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        room={editingRoom}
        existingRooms={rooms}
        onSuccess={fetchRooms}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingRoom)}
        onClose={() => setDeletingRoom(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Room"
        message={`Are you sure you want to delete Room ${deletingRoom?.roomNumber} (${deletingRoom?.type})?`}
        confirmText="Delete"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
}
