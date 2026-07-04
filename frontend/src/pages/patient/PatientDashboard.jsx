import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { getMyAppointments, cancelAppointment, createReview } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import {
  Calendar, Clock, MapPin, Star, X, FileText, ChevronRight,
  CheckCircle, AlertCircle, RotateCcw, Plus
} from 'lucide-react';

const STATUS_CONFIG = {
  pending_payment: { label: 'Pending Payment', class: 'badge-pending', icon: Clock },
  confirmed: { label: 'Confirmed', class: 'badge-confirmed', icon: CheckCircle },
  completed: { label: 'Completed', class: 'badge-completed', icon: CheckCircle },
  cancelled: { label: 'Cancelled', class: 'badge-cancelled', icon: X },
  refunded: { label: 'Refunded', class: 'badge-cancelled', icon: RotateCcw },
  no_show: { label: 'No Show', class: 'badge-cancelled', icon: AlertCircle },
};

const AppointmentCard = ({ appt, onCancel, onReview }) => {
  const config = STATUS_CONFIG[appt.status] || STATUS_CONFIG.confirmed;
  const Icon = config.icon;
  const isPast = new Date(appt.date) < new Date();
  const navigate = useNavigate();

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-xl font-bold text-primary-700">{appt.doctor?.name?.charAt(0)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-gray-900">Dr. {appt.doctor?.name}</h3>
              <p className="text-primary-600 text-sm font-medium">{appt.doctor?.specialization?.[0]}</p>
            </div>
            <span className={config.class}>
              <Icon className="w-3 h-3 inline mr-1" />{config.label}
            </span>
          </div>

          <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary-400" />
              {format(new Date(appt.date + 'T00:00:00'), 'dd MMM yyyy')}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary-400" />
              {appt.startTime} – {appt.endTime}
            </div>
            {appt.doctor?.address?.city && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary-400" />
                {appt.doctor.address.city}
              </div>
            )}
          </div>

          {appt.doctorNotes && (
            <div className="mt-3 bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
              <FileText className="w-4 h-4 inline mr-1" />
              <strong>Doctor's Notes:</strong> {appt.doctorNotes}
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-4">
            {appt.status === 'confirmed' && (
              <button onClick={() => onCancel(appt)} className="text-sm text-red-500 hover:text-red-700 font-medium border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                Cancel Appointment
              </button>
            )}
            {appt.status === 'completed' && (
              <button onClick={() => onReview(appt)} className="flex items-center gap-1.5 text-sm text-yellow-600 font-medium border border-yellow-200 px-3 py-1.5 rounded-lg hover:bg-yellow-50 transition-colors">
                <Star className="w-3.5 h-3.5" /> Write Review
              </button>
            )}
            <button onClick={() => navigate(`/doctors/${appt.doctor?._id}`)}
              className="flex items-center gap-1 text-sm text-primary-600 font-medium hover:underline">
              View Doctor <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PatientDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, [activeTab]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const statusMap = { upcoming: 'confirmed', past: 'completed', all: undefined };
      const res = await getMyAppointments({ status: statusMap[activeTab], limit: 20 });
      setAppointments(res.data.appointments);
    } catch { setAppointments([]); }
    finally { setLoading(false); }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelAppointment(cancelModal._id, { reason: cancelReason });
      toast.success('Appointment cancelled. Refund will be processed.');
      setCancelModal(null);
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel.');
    } finally { setCancelling(false); }
  };

  const handleReview = async () => {
    try {
      await createReview({ appointmentId: reviewModal._id, ...reviewData });
      toast.success('Review submitted!');
      setReviewModal(null);
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review.');
    }
  };

  const TABS = [
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'past', label: 'Completed' },
    { id: 'all', label: 'All' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome back, {user?.name?.split(' ')[0]}!</p>
          </div>
          <button onClick={() => navigate('/doctors')} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Book Appointment
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Appointments', value: appointments.length, color: 'text-primary-600' },
            { label: 'Upcoming', value: appointments.filter(a => a.status === 'confirmed').length, color: 'text-green-600' },
            { label: 'Completed', value: appointments.filter(a => a.status === 'completed').length, color: 'text-blue-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card text-center">
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
              <p className="text-gray-500 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
          {TABS.map(({ id, label }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === id ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Appointments */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="card h-28 animate-pulse bg-gray-100" />)}
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-20 card">
            <Calendar className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-400">No appointments yet</h3>
            <p className="text-gray-300 mt-2 mb-6">Book your first appointment with a doctor</p>
            <button onClick={() => navigate('/doctors')} className="btn-primary mx-auto">
              Find Doctors
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appt) => (
              <AppointmentCard
                key={appt._id}
                appt={appt}
                onCancel={(a) => { setCancelModal(a); setCancelReason(''); }}
                onReview={(a) => { setReviewModal(a); setReviewData({ rating: 5, comment: '' }); }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      {cancelModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Cancel Appointment</h2>
            <p className="text-gray-500 text-sm mb-5">
              Cancelling more than 24 hours before: full refund. Within 24 hours: 50% refund.
            </p>
            <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
              rows={3} className="input-field resize-none mb-4" placeholder="Reason for cancellation (optional)..." />
            <div className="flex gap-3">
              <button onClick={() => setCancelModal(null)} className="btn-secondary flex-1">Keep Appointment</button>
              <button onClick={handleCancel} disabled={cancelling} className="btn-danger flex-1">
                {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Rate Your Experience</h2>
            <p className="text-gray-500 text-sm mb-5">with Dr. {reviewModal.doctor?.name}</p>
            <div className="flex gap-2 mb-4 justify-center">
              {[1,2,3,4,5].map((star) => (
                <button key={star} onClick={() => setReviewData({ ...reviewData, rating: star })}>
                  <Star className={`w-9 h-9 transition-colors ${star <= reviewData.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                </button>
              ))}
            </div>
            <textarea value={reviewData.comment} onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
              rows={3} className="input-field resize-none mb-4" placeholder="Share your experience (optional)..." />
            <div className="flex gap-3">
              <button onClick={() => setReviewModal(null)} className="btn-secondary flex-1">Skip</button>
              <button onClick={handleReview} className="btn-primary flex-1">Submit Review</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
