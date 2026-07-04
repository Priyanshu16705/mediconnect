import { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import toast from 'react-hot-toast';
import {
  getDoctorDashboard, getDoctorAppointments, updateDoctorAppointment,
  toggleDayAvailability, toggleSlot, updateSlotConfig, updateDoctorProfile
} from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import {
  Calendar, Clock, Users, IndianRupee, Star, CheckCircle, X,
  AlertCircle, ToggleLeft, ToggleRight, Settings, ChevronRight,
  FileText, Edit3, Save, Plus
} from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'appointments', label: 'Appointments' },
  { id: 'slots', label: 'Slot Management' },
  { id: 'profile', label: 'Profile' },
];

const STATUS_CONFIG = {
  confirmed: { label: 'Confirmed', class: 'badge-confirmed' },
  completed: { label: 'Completed', class: 'badge-completed' },
  cancelled: { label: 'Cancelled', class: 'badge-cancelled' },
  pending_payment: { label: 'Pending', class: 'badge-pending' },
  no_show: { label: 'No Show', class: 'badge-cancelled' },
};

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const SLOT_DURATIONS = [10, 15, 20, 30, 45, 60];

// ── Overview Tab ──────────────────────────────────────────────────────────────
const Overview = ({ dashboard }) => {
  if (!dashboard) return <div className="animate-pulse space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl" />)}</div>;

  const { stats, todayAppointments, todaySlots } = dashboard;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Today's Patients", value: todayAppointments.length, icon: Users, color: 'bg-blue-50 text-blue-600' },
          { label: 'Pending Appointments', value: stats.pendingAppointments, icon: Clock, color: 'bg-yellow-50 text-yellow-600' },
          { label: 'Total Completed', value: stats.completedAppointments, icon: CheckCircle, color: 'bg-green-50 text-green-600' },
          { label: 'Total Revenue', value: `₹${stats.totalRevenueINR.toLocaleString('en-IN')}`, icon: IndianRupee, color: 'bg-purple-50 text-purple-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card">
            <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-gray-400 text-sm mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Rating */}
      <div className="card flex items-center gap-4">
        <div className="w-16 h-16 bg-yellow-50 rounded-2xl flex items-center justify-center">
          <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
        </div>
        <div>
          <p className="text-3xl font-bold text-gray-900">{stats.rating?.toFixed(1) || '—'}<span className="text-lg text-gray-400">/5</span></p>
          <p className="text-gray-500 text-sm">Based on {stats.totalReviews} patient reviews</p>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Today's Schedule — {format(new Date(), 'dd MMM yyyy')}</h2>
        {todayAppointments.length === 0 ? (
          <p className="text-gray-400 text-center py-6">No appointments today.</p>
        ) : (
          <div className="space-y-3">
            {todayAppointments.map((appt) => (
              <div key={appt._id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-primary-700">{appt.patient?.name?.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{appt.patient?.name}</p>
                  <p className="text-gray-400 text-xs">{appt.patient?.phone}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-700 text-sm">{appt.slot?.startTime} – {appt.slot?.endTime}</p>
                  <span className={STATUS_CONFIG[appt.status]?.class || 'badge-confirmed'}>{STATUS_CONFIG[appt.status]?.label}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Today's Slot Summary */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Today's Slots</h2>
        {todaySlots.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No slots generated for today.</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            {todaySlots.map((slot) => {
              const full = slot.bookedCount >= slot.maxPatients;
              return (
                <div key={slot._id}
                  className={`text-center p-2 rounded-xl border text-xs font-semibold ${
                    !slot.isOpen ? 'bg-gray-50 border-gray-100 text-gray-300' :
                    full ? 'bg-red-50 border-red-100 text-red-500' :
                    slot.bookedCount > 0 ? 'bg-yellow-50 border-yellow-100 text-yellow-700' :
                    'bg-green-50 border-green-100 text-green-700'
                  }`}>
                  <p>{slot.startTime}</p>
                  <p className="text-xs mt-0.5">{slot.bookedCount}/{slot.maxPatients}</p>
                </div>
              );
            })}
          </div>
        )}
        <div className="flex gap-4 mt-3 text-xs text-gray-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-400 rounded-full inline-block" />Available</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-yellow-400 rounded-full inline-block" />Partially booked</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-400 rounded-full inline-block" />Full</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-gray-300 rounded-full inline-block" />Closed</span>
        </div>
      </div>
    </div>
  );
};

// ── Appointments Tab ──────────────────────────────────────────────────────────
const AppointmentsTab = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('confirmed');
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState('');
  const [prescription, setPrescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    getDoctorAppointments({ status: filter, limit: 30 })
      .then((r) => setAppointments(r.data.appointments))
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  }, [filter]);

  const handleUpdate = async (apptId, updateData) => {
    setSaving(true);
    try {
      await updateDoctorAppointment(apptId, updateData);
      toast.success('Appointment updated.');
      setSelected(null);
      setAppointments((prev) => prev.map((a) => a._id === apptId ? { ...a, ...updateData } : a));
    } catch { toast.error('Update failed.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {['confirmed', 'completed', 'cancelled', 'no_show'].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
              filter === s ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-300'
            }`}>
            {STATUS_CONFIG[s]?.label || s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
      ) : appointments.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">No appointments with this status.</div>
      ) : (
        appointments.map((appt) => (
          <div key={appt._id} className="card">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-primary-600">{appt.patient?.name?.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{appt.patient?.name}</h3>
                  <p className="text-gray-400 text-sm">{appt.patient?.phone}</p>
                  <div className="flex gap-3 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{appt.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{appt.startTime}–{appt.endTime}</span>
                  </div>
                  {appt.patientDetails?.symptoms && (
                    <p className="mt-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                      <strong>Symptoms:</strong> {appt.patientDetails.symptoms}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <span className={STATUS_CONFIG[appt.status]?.class}>{STATUS_CONFIG[appt.status]?.label}</span>
                {appt.status === 'confirmed' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(appt._id, { status: 'completed' })}
                      className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg font-semibold hover:bg-green-100 transition-colors">
                      Mark Complete
                    </button>
                    <button
                      onClick={() => handleUpdate(appt._id, { status: 'no_show' })}
                      className="text-xs bg-gray-50 text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                      No Show
                    </button>
                    <button
                      onClick={() => { setSelected(appt); setNotes(appt.doctorNotes || ''); setPrescription(appt.prescription || ''); }}
                      className="text-xs bg-primary-50 text-primary-700 border border-primary-200 px-3 py-1.5 rounded-lg font-semibold hover:bg-primary-100 transition-colors">
                      <FileText className="w-3 h-3 inline mr-1" />Notes
                    </button>
                  </div>
                )}
                {appt.status === 'completed' && (
                  <button
                    onClick={() => { setSelected(appt); setNotes(appt.doctorNotes || ''); setPrescription(appt.prescription || ''); }}
                    className="text-xs bg-primary-50 text-primary-700 border border-primary-200 px-3 py-1.5 rounded-lg font-semibold">
                    <Edit3 className="w-3 h-3 inline mr-1" />Edit Notes
                  </button>
                )}
              </div>
            </div>
          </div>
        ))
      )}

      {/* Notes Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex justify-between mb-5">
              <h2 className="text-xl font-bold">Notes — {selected.patient?.name}</h2>
              <button onClick={() => setSelected(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Doctor's Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                  rows={3} className="input-field resize-none" placeholder="Diagnosis, observations..." />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Prescription</label>
                <textarea value={prescription} onChange={(e) => setPrescription(e.target.value)}
                  rows={3} className="input-field resize-none" placeholder="Medicines, dosage, instructions..." />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setSelected(null)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={() => handleUpdate(selected._id, { doctorNotes: notes, prescription })} disabled={saving}
                  className="btn-primary flex-1">
                  {saving ? 'Saving...' : <><Save className="w-4 h-4 inline mr-1" />Save Notes</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Slot Management Tab ───────────────────────────────────────────────────────
const SlotManagement = ({ user }) => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [configMode, setConfigMode] = useState(false);
  const [slotConfig, setSlotConfig] = useState({
    slotDurationMinutes: user?.slotDurationMinutes || 20,
    maxPatientsPerSlot: user?.maxPatientsPerSlot || 1,
  });
  const [saving, setSaving] = useState(false);
  const [dayBlocked, setDayBlocked] = useState(false);

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = addDays(new Date(), i);
    return { date: format(d, 'yyyy-MM-dd'), label: format(d, 'EEE d') };
  });

  useEffect(() => {
    fetchSlots();
  }, [selectedDate]);

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const { getDoctorSlots } = await import('../../api');
      const res = await getDoctorSlots(user._id, selectedDate);
      setSlots(res.data.slots);
      const allClosed = res.data.slots.length > 0 && res.data.slots.every((s) => !s.isOpen);
      setDayBlocked(allClosed);
    } catch { setSlots([]); }
    finally { setLoading(false); }
  };

  const handleToggleSlot = async (slotId, isOpen) => {
    try {
      await toggleSlot(slotId, { isOpen, reason: isOpen ? '' : 'Closed by doctor' });
      toast.success(isOpen ? 'Slot opened.' : 'Slot closed.');
      fetchSlots();
    } catch { toast.error('Failed to update slot.'); }
  };

  const handleToggleDay = async (block) => {
    try {
      await toggleDayAvailability({ date: selectedDate, block, reason: block ? 'Not available today' : '' });
      toast.success(block ? 'Day marked as unavailable.' : 'Day reopened.');
      fetchSlots();
    } catch { toast.error('Failed to update day.'); }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await updateSlotConfig(slotConfig);
      toast.success('Slot config saved. Future slots regenerated!');
      setConfigMode(false);
      fetchSlots();
    } catch { toast.error('Failed to save config.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      {/* Config toggle */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Slot Configuration</h2>
          <button onClick={() => setConfigMode(!configMode)} className="btn-secondary flex items-center gap-2 text-sm">
            <Settings className="w-4 h-4" /> {configMode ? 'Cancel' : 'Edit Config'}
          </button>
        </div>
        {configMode ? (
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Slot Duration</label>
              <select value={slotConfig.slotDurationMinutes}
                onChange={(e) => setSlotConfig({ ...slotConfig, slotDurationMinutes: Number(e.target.value) })}
                className="input-field">
                {SLOT_DURATIONS.map((d) => <option key={d} value={d}>{d} minutes</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Max Patients per Slot</label>
              <input type="number" value={slotConfig.maxPatientsPerSlot} min={1} max={100}
                onChange={(e) => setSlotConfig({ ...slotConfig, maxPatientsPerSlot: Number(e.target.value) })}
                className="input-field" />
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                ⚠️ Changing config will regenerate all future unbooked slots. Already-booked slots are not affected.
              </p>
            </div>
            <div className="sm:col-span-2">
              <button onClick={handleSaveConfig} disabled={saving} className="btn-primary">
                {saving ? 'Saving...' : <><Save className="w-4 h-4 inline mr-1" />Save & Regenerate Slots</>}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-6 text-sm">
            <div><span className="text-gray-400">Slot Duration:</span> <strong>{user?.slotDurationMinutes || 20} min</strong></div>
            <div><span className="text-gray-400">Max per Slot:</span> <strong>{user?.maxPatientsPerSlot || 1} patient(s)</strong></div>
          </div>
        )}
      </div>

      {/* Date Selector */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Manage Slots by Date</h2>
          <button
            onClick={() => handleToggleDay(!dayBlocked)}
            className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border transition-all ${
              dayBlocked
                ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
            }`}>
            {dayBlocked ? <><ToggleRight className="w-4 h-4" />Mark Available</> : <><ToggleLeft className="w-4 h-4" />Mark Unavailable</>}
          </button>
        </div>

        {/* Date pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
          {days.map(({ date, label }) => (
            <button key={date} onClick={() => setSelectedDate(date)}
              className={`flex-shrink-0 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                selectedDate === date ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-4 gap-2">
            {[...Array(8)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : slots.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No slots for this date. Check working hours config.</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {slots.map((slot) => {
              const full = slot.bookedCount >= slot.maxPatients;
              const hasBookings = slot.bookedCount > 0;
              return (
                <div key={slot._id} className={`rounded-xl border p-3 text-center ${
                  !slot.isOpen ? 'bg-gray-50 border-gray-100' :
                  full ? 'bg-red-50 border-red-100' :
                  hasBookings ? 'bg-yellow-50 border-yellow-100' :
                  'bg-green-50 border-green-100'
                }`}>
                  <p className="text-sm font-bold text-gray-800">{slot.startTime}</p>
                  <p className="text-xs text-gray-400">{slot.endTime}</p>
                  <p className="text-xs font-semibold mt-1 text-gray-600">{slot.bookedCount}/{slot.maxPatients}</p>
                  {!hasBookings && (
                    <button onClick={() => handleToggleSlot(slot._id, !slot.isOpen)}
                      className={`mt-2 text-xs font-semibold px-2 py-0.5 rounded-full transition-colors ${
                        slot.isOpen ? 'text-red-500 hover:bg-red-100' : 'text-green-600 hover:bg-green-100'
                      }`}>
                      {slot.isOpen ? 'Close' : 'Open'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Profile Tab ───────────────────────────────────────────────────────────────
const ProfileTab = ({ user, setUser }) => {
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    about: user?.about || '',
    clinicName: user?.clinicName || '',
    consultationFee: user?.consultationFee || '',
    'address.street': user?.address?.street || '',
    'address.city': user?.address?.city || '',
    'address.state': user?.address?.state || '',
    'address.pincode': user?.address?.pincode || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        phone: form.phone,
        about: form.about,
        clinicName: form.clinicName,
        consultationFee: Number(form.consultationFee),
        address: {
          street: form['address.street'],
          city: form['address.city'],
          state: form['address.state'],
          pincode: form['address.pincode'],
        },
      };
      const res = await updateDoctorProfile(payload);
      setUser(res.data.doctor);
      toast.success('Profile updated!');
    } catch { toast.error('Update failed.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="card space-y-5">
      <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Edit Profile</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { label: 'Full Name', key: 'name' },
          { label: 'Phone', key: 'phone' },
          { label: 'Clinic Name', key: 'clinicName' },
          { label: 'Consultation Fee (₹)', key: 'consultationFee', type: 'number' },
          { label: 'Street Address', key: 'address.street' },
          { label: 'City', key: 'address.city' },
          { label: 'State', key: 'address.state' },
          { label: 'Pincode', key: 'address.pincode' },
        ].map(({ label, key, type = 'text' }) => (
          <div key={key}>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
            <input type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="input-field" />
          </div>
        ))}
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">About / Bio</label>
        <textarea value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })}
          rows={4} className="input-field resize-none" />
      </div>
      <button onClick={handleSave} disabled={saving} className="btn-primary">
        {saving ? 'Saving...' : <><Save className="w-4 h-4 inline mr-1.5" />Save Changes</>}
      </button>
    </div>
  );
};

// ── Main Dashboard ────────────────────────────────────────────────────────────
const DoctorDashboard = () => {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    if (activeTab === 'overview') {
      getDoctorDashboard().then((r) => setDashboard(r.data.dashboard)).catch(() => {});
    }
  }, [activeTab]);

  if (!user?.isVerified) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="card max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Pending</h2>
          <p className="text-gray-500">Your profile is under review by our admin team. You'll be notified once approved (usually within 24 hours).</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome, Dr. {user?.name?.split(' ')[0]}</p>
          </div>
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 px-4 py-2 rounded-xl">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-green-700 text-sm font-semibold">Verified</span>
          </div>
        </div>

        {/* Tab Nav */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-8 overflow-x-auto">
          {TABS.map(({ id, label }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                activeTab === id ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && <Overview dashboard={dashboard} />}
        {activeTab === 'appointments' && <AppointmentsTab />}
        {activeTab === 'slots' && <SlotManagement user={user} />}
        {activeTab === 'profile' && <ProfileTab user={user} setUser={setUser} />}
      </div>
    </div>
  );
};

export default DoctorDashboard;
