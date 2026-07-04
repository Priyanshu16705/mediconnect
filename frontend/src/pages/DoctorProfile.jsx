import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, addDays } from 'date-fns';
import toast from 'react-hot-toast';
import {
  getDoctorById, getDoctorSlots, initiateBooking, verifyPayment, getDoctorReviews
} from '../api';
import { useAuth } from '../contexts/AuthContext';
import {
  MapPin, Star, Clock, IndianRupee, Award, CheckCircle, Calendar,
  ChevronLeft, ChevronRight, User, Phone, AlertCircle, X
} from 'lucide-react';

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

// Generate next 7 days for date picker
const getNext7Days = () =>
  Array.from({ length: 7 }, (_, i) => {
    const d = addDays(new Date(), i);
    return { date: format(d, 'yyyy-MM-dd'), label: format(d, 'EEE'), day: format(d, 'd'), month: format(d, 'MMM') };
  });

const SESSION_COLORS = {
  morning: 'bg-amber-50 border-amber-200 text-amber-700',
  afternoon: 'bg-orange-50 border-orange-200 text-orange-700',
  evening: 'bg-purple-50 border-purple-200 text-purple-700',
  night: 'bg-indigo-50 border-indigo-200 text-indigo-700',
};

const DoctorProfile = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingModal, setBookingModal] = useState(false);
  const [paying, setPaying] = useState(false);
  const [patientDetails, setPatientDetails] = useState({ name: '', phone: '', age: '', gender: '', symptoms: '' });

  const days = getNext7Days();

  useEffect(() => {
    getDoctorById(id)
      .then((r) => {
        setDoctor(r.data.doctor);
        setReviews(r.data.reviews);
      })
      .catch(() => navigate('/doctors'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!doctor) return;
    setSlotsLoading(true);
    getDoctorSlots(id, selectedDate)
      .then((r) => setSlots(r.data.slots))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [id, selectedDate, doctor]);

  // Pre-fill patient details from logged-in user
  useEffect(() => {
    if (user && user.role === 'patient') {
      setPatientDetails((p) => ({ ...p, name: user.name || '', phone: user.phone || '' }));
    }
  }, [user]);

  const handleBook = () => {
    if (!user) { toast.error('Please log in to book an appointment.'); navigate('/login'); return; }
    if (user.role !== 'patient') { toast.error('Only patients can book appointments.'); return; }
    if (!selectedSlot) { toast.error('Please select a time slot.'); return; }
    setBookingModal(true);
  };

  const handlePayment = async () => {
    if (!patientDetails.name || !patientDetails.phone) {
      toast.error('Please fill in your name and phone number.');
      return;
    }

    const loaded = await loadRazorpay();
    if (!loaded) { toast.error('Payment gateway failed to load. Please refresh.'); return; }

    setPaying(true);
    try {
      // Step 1: Create booking + get Razorpay order
      const res = await initiateBooking({
        doctorId: id,
        slotId: selectedSlot._id,
        date: selectedDate,
        patientDetails,
      });

      const { appointment, razorpayOrder } = res.data;

      // Step 2: Open Razorpay checkout
      const options = {
        key: razorpayOrder.key,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'MediConnect',
        description: `Appointment with Dr. ${doctor.name}`,
        order_id: razorpayOrder.id,
        prefill: {
          name: patientDetails.name,
          contact: patientDetails.phone,
          email: user.email,
        },
        theme: { color: '#2563eb' },
        handler: async (paymentResponse) => {
          try {
            // Step 3: Verify payment on server
            const verRes = await verifyPayment({
              razorpayOrderId: paymentResponse.razorpay_order_id,
              razorpayPaymentId: paymentResponse.razorpay_payment_id,
              razorpaySignature: paymentResponse.razorpay_signature,
              appointmentId: appointment._id,
            });
            toast.success('🎉 Appointment confirmed! Check your dashboard.');
            navigate('/patient/dashboard');
          } catch {
            toast.error('Payment verification failed. Please contact support.');
          }
        },
        modal: {
          ondismiss: async () => {
            // Release slot if user dismisses without paying
            try { await cancelAppointment(appointment._id, { reason: 'Payment dismissed by user' }); } catch {}
            toast('Payment cancelled. Slot released.', { icon: 'ℹ️' });
            setPaying(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => {
        toast.error('Payment failed. Please try again.');
        setPaying(false);
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed. Please try again.');
      setPaying(false);
    }
  };

  // Group slots by session
  const slotsBySession = slots.reduce((acc, slot) => {
    const s = slot.session || 'morning';
    if (!acc[s]) acc[s] = [];
    acc[s].push(slot);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10 animate-pulse">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 card h-64 bg-gray-100" />
          <div className="card h-96 bg-gray-100" />
        </div>
      </div>
    );
  }

  if (!doctor) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Doctor Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Card */}
            <div className="card">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="w-28 h-28 bg-gradient-to-br from-primary-100 to-primary-300 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <span className="text-5xl font-bold text-primary-700">{doctor.name.charAt(0)}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">Dr. {doctor.name}</h1>
                      <p className="text-primary-600 font-semibold">{doctor.specialization?.join(' · ')}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-full">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-bold text-gray-800">{doctor.rating?.toFixed(1) || '—'}</span>
                      <span className="text-gray-500 text-sm">({doctor.totalReviews} reviews)</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-primary-500" />
                      <span>{doctor.experience} years experience</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-primary-500" />
                      <span>{doctor.clinicName || 'Private Clinic'}, {doctor.address?.city}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {doctor.specialization?.map((s) => (
                      <span key={s} className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-xs font-semibold">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* About */}
            {doctor.about && (
              <div className="card">
                <h2 className="text-lg font-bold text-gray-900 mb-3">About</h2>
                <p className="text-gray-600 leading-relaxed">{doctor.about}</p>
              </div>
            )}

            {/* Qualifications */}
            {doctor.qualifications?.length > 0 && (
              <div className="card">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Qualifications</h2>
                <div className="space-y-3">
                  {doctor.qualifications.map((q, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-gray-800">{q.degree}</p>
                        <p className="text-gray-500 text-sm">{q.institution}{q.year ? `, ${q.year}` : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="card">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Patient Reviews</h2>
              {reviews.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No reviews yet.</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div key={r._id} className="border-b border-gray-50 pb-4 last:border-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-gray-600">{r.patient?.name?.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{r.patient?.name}</p>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                      {r.comment && <p className="text-gray-600 text-sm pl-12">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Booking Panel */}
          <div className="lg:col-span-1">
            <div className="card sticky top-24">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <span className="text-3xl font-bold text-gray-900">₹{doctor.consultationFee}</span>
                  <span className="text-gray-400 text-sm"> / visit</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">
                  <Clock className="w-4 h-4" />
                  {doctor.slotDurationMinutes} min
                </div>
              </div>

              {/* Date Picker */}
              <h3 className="font-bold text-gray-700 mb-3 text-sm">Select Date</h3>
              <div className="grid grid-cols-4 gap-2 mb-5">
                {days.map(({ date, label, day, month }) => (
                  <button
                    key={date}
                    onClick={() => { setSelectedDate(date); setSelectedSlot(null); }}
                    className={`flex flex-col items-center p-2 rounded-xl border-2 text-center transition-all ${
                      selectedDate === date
                        ? 'border-primary-600 bg-primary-600 text-white'
                        : 'border-gray-200 bg-white hover:border-primary-300 text-gray-700'
                    }`}
                  >
                    <span className="text-xs font-medium">{label}</span>
                    <span className="text-lg font-bold">{day}</span>
                    <span className="text-xs">{month}</span>
                  </button>
                ))}
              </div>

              {/* Slots */}
              <h3 className="font-bold text-gray-700 mb-3 text-sm">Available Slots</h3>
              {slotsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-xl">
                  <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No slots available on this date.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                  {Object.entries(slotsBySession).map(([session, sessionSlots]) => (
                    <div key={session}>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 capitalize">{session}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {sessionSlots.map((slot) => {
                          const full = slot.bookedCount >= slot.maxPatients;
                          const closed = !slot.isOpen;
                          const disabled = full || closed;
                          return (
                            <button
                              key={slot._id}
                              onClick={() => !disabled && setSelectedSlot(slot)}
                              disabled={disabled}
                              className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                                selectedSlot?._id === slot._id
                                  ? 'bg-primary-600 border-primary-600 text-white'
                                  : disabled
                                  ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed'
                                  : 'bg-white border-gray-200 text-gray-700 hover:border-primary-400 hover:text-primary-600'
                              }`}
                            >
                              {slot.startTime} – {slot.endTime}
                              {!disabled && (
                                <span className={`block text-xs ${selectedSlot?._id === slot._id ? 'text-primary-100' : 'text-gray-400'}`}>
                                  {slot.maxPatients - slot.bookedCount} left
                                </span>
                              )}
                              {full && <span className="block text-red-400">Full</span>}
                              {closed && !full && <span className="block text-gray-300">Closed</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleBook}
                disabled={!selectedSlot}
                className="btn-primary w-full mt-5 text-center"
              >
                {selectedSlot ? `Book ${selectedSlot.startTime} – ${selectedSlot.endTime}` : 'Select a Slot'}
              </button>

              <p className="text-xs text-gray-400 text-center mt-3 flex items-center justify-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" /> Secure payment via Razorpay
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {bookingModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Confirm Appointment</h2>
              <button onClick={() => setBookingModal(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Summary */}
              <div className="bg-primary-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Doctor</span>
                  <span className="font-semibold">Dr. {doctor.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date</span>
                  <span className="font-semibold">{format(new Date(selectedDate + 'T00:00:00'), 'dd MMM yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Time</span>
                  <span className="font-semibold">{selectedSlot?.startTime} – {selectedSlot?.endTime}</span>
                </div>
                <div className="flex justify-between border-t border-primary-100 pt-2 mt-2">
                  <span className="text-gray-700 font-semibold">Total</span>
                  <span className="font-bold text-primary-700 text-lg">₹{doctor.consultationFee}</span>
                </div>
              </div>

              {/* Patient Details */}
              <div className="space-y-4">
                <h3 className="font-bold text-gray-800">Patient Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name *</label>
                    <input value={patientDetails.name} onChange={(e) => setPatientDetails({ ...patientDetails, name: e.target.value })}
                      className="input-field text-sm py-2" placeholder="Your name" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Phone *</label>
                    <input value={patientDetails.phone} onChange={(e) => setPatientDetails({ ...patientDetails, phone: e.target.value })}
                      className="input-field text-sm py-2" placeholder="9876543210" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Age</label>
                    <input value={patientDetails.age} onChange={(e) => setPatientDetails({ ...patientDetails, age: e.target.value })}
                      type="number" className="input-field text-sm py-2" placeholder="30" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Gender</label>
                    <select value={patientDetails.gender} onChange={(e) => setPatientDetails({ ...patientDetails, gender: e.target.value })}
                      className="input-field text-sm py-2">
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Symptoms / Reason for Visit</label>
                  <textarea value={patientDetails.symptoms} onChange={(e) => setPatientDetails({ ...patientDetails, symptoms: e.target.value })}
                    rows={2} className="input-field text-sm resize-none" placeholder="Briefly describe your symptoms..." />
                </div>
              </div>

              <button onClick={handlePayment} disabled={paying} className="btn-primary w-full">
                {paying ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Opening payment...
                  </span>
                ) : `Pay ₹${doctor.consultationFee} & Confirm`}
              </button>
              <p className="text-xs text-gray-400 text-center">
                By proceeding, you agree to our refund policy. Full refund if cancelled 24+ hours before.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorProfile;
