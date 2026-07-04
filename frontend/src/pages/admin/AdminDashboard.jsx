import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  getAdminStats, getRevenueAnalytics, getPendingDoctors,
  getAllDoctors, verifyDoctor, toggleDoctorActive,
  getAllPatients, getAllAppointments
} from '../../api';
import {
  Users, Stethoscope, Calendar, IndianRupee, CheckCircle,
  X, AlertCircle, TrendingUp, Shield, Eye, ToggleLeft,
  ToggleRight, ChevronLeft, ChevronRight, Search
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'doctors', label: 'Doctors' },
  { id: 'pending', label: 'Pending Verification' },
  { id: 'patients', label: 'Patients' },
  { id: 'appointments', label: 'Appointments' },
  { id: 'analytics', label: 'Analytics' },
];

const PIE_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316', '#ec4899'];

const STATUS_BADGE = {
  confirmed: 'badge-confirmed',
  completed: 'badge-completed',
  cancelled: 'badge-cancelled',
  pending_payment: 'badge-pending',
  refunded: 'badge-cancelled',
  no_show: 'badge-cancelled',
};

// ── Overview ──────────────────────────────────────────────────────────────────
const Overview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminStats()
      .then((r) => setStats(r.data.stats))
      .catch(() => toast.error('Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(8)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}</div>;
  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Verified Doctors', value: stats.doctors.total, sub: `${stats.doctors.pending} pending`, icon: Stethoscope, color: 'bg-blue-50 text-blue-600' },
          { label: 'Total Patients', value: stats.patients.total, icon: Users, color: 'bg-green-50 text-green-600' },
          { label: 'Total Appointments', value: stats.appointments.total, sub: `${stats.appointments.today} today`, icon: Calendar, color: 'bg-purple-50 text-purple-600' },
          { label: 'Total Revenue', value: `₹${stats.revenue.totalINR.toLocaleString('en-IN')}`, sub: `₹${stats.revenue.thisMonthINR.toLocaleString('en-IN')} this month`, icon: IndianRupee, color: 'bg-yellow-50 text-yellow-600' },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="card">
            <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-gray-500 text-sm mt-0.5">{label}</p>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Pending alert */}
      {stats.doctors.pending > 0 && (
        <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <p className="text-yellow-800 font-medium">
            <strong>{stats.doctors.pending} doctor{stats.doctors.pending > 1 ? 's' : ''}</strong> waiting for verification. Review in the "Pending Verification" tab.
          </p>
        </div>
      )}

      {/* Recent Appointments */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Appointments</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-100">
                <th className="pb-3 font-semibold">Patient</th>
                <th className="pb-3 font-semibold">Doctor</th>
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.recentAppointments.map((appt) => (
                <tr key={appt._id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 font-medium text-gray-800">{appt.patient?.name}</td>
                  <td className="py-3 text-gray-600">Dr. {appt.doctor?.name}</td>
                  <td className="py-3 text-gray-500">{appt.date}</td>
                  <td className="py-3"><span className={STATUS_BADGE[appt.status] || 'badge-pending'}>{appt.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ── Pending Verification ──────────────────────────────────────────────────────
const PendingVerification = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [rejReason, setRejReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    getPendingDoctors()
      .then((r) => setDoctors(r.data.doctors))
      .finally(() => setLoading(false));
  }, []);

  const handle = async (approve) => {
    setProcessing(true);
    try {
      await verifyDoctor(selected._id, { approve, rejectionReason: rejReason });
      toast.success(approve ? `Dr. ${selected.name} approved!` : 'Application rejected.');
      setDoctors((prev) => prev.filter((d) => d._id !== selected._id));
      setSelected(null);
    } catch { toast.error('Action failed.'); }
    finally { setProcessing(false); }
  };

  if (loading) return <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}</div>;

  return (
    <div className="space-y-4">
      {doctors.length === 0 ? (
        <div className="card text-center py-16">
          <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-400">All caught up!</h3>
          <p className="text-gray-300 mt-2">No pending doctor verifications.</p>
        </div>
      ) : doctors.map((doc) => (
        <div key={doc._id} className="card">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold text-primary-700">{doc.name.charAt(0)}</span>
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-gray-900">Dr. {doc.name}</h3>
                  <p className="text-primary-600 text-sm">{doc.specialization?.join(', ')}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{doc.email} · {doc.phone}</p>
                </div>
                <span className="badge-pending">Pending Review</span>
              </div>
              <div className="grid sm:grid-cols-3 gap-3 mt-3 text-sm text-gray-600">
                <div><span className="text-gray-400">License:</span> <strong>{doc.licenseNumber}</strong></div>
                <div><span className="text-gray-400">Experience:</span> <strong>{doc.experience} yrs</strong></div>
                <div><span className="text-gray-400">City:</span> <strong>{doc.address?.city}</strong></div>
                <div><span className="text-gray-400">Fee:</span> <strong>₹{doc.consultationFee}</strong></div>
                <div><span className="text-gray-400">Clinic:</span> <strong>{doc.clinicName || '—'}</strong></div>
                <div><span className="text-gray-400">Registered:</span> <strong>{format(new Date(doc.createdAt), 'dd MMM yyyy')}</strong></div>
              </div>
              {doc.qualifications?.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-gray-400 mb-1">QUALIFICATIONS</p>
                  <div className="flex flex-wrap gap-2">
                    {doc.qualifications.map((q, i) => (
                      <span key={i} className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-medium">
                        {q.degree} — {q.institution}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-3 mt-4">
                <button onClick={() => { setSelected(doc); setRejReason(''); }}
                  className="btn-primary flex items-center gap-2 text-sm py-2">
                  <Eye className="w-4 h-4" /> Review & Decide
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Decision Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">Review: Dr. {selected.name}</h2>
              <button onClick={() => setSelected(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-5 text-sm space-y-1.5">
              <p><span className="text-gray-400">License:</span> <strong>{selected.licenseNumber}</strong></p>
              <p><span className="text-gray-400">Specialization:</span> <strong>{selected.specialization?.join(', ')}</strong></p>
              <p><span className="text-gray-400">Experience:</span> <strong>{selected.experience} years</strong></p>
              <p><span className="text-gray-400">City:</span> <strong>{selected.address?.city}, {selected.address?.state}</strong></p>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Rejection Reason (required if rejecting)
              </label>
              <textarea value={rejReason} onChange={(e) => setRejReason(e.target.value)}
                rows={2} className="input-field resize-none text-sm"
                placeholder="Invalid license, incomplete details..." />
            </div>

            <div className="flex gap-3">
              <button onClick={() => handle(false)} disabled={processing || !rejReason}
                className="flex-1 btn-danger text-sm disabled:opacity-40">
                {processing ? 'Processing...' : '✕ Reject'}
              </button>
              <button onClick={() => handle(true)} disabled={processing}
                className="flex-1 btn-primary text-sm">
                {processing ? 'Processing...' : '✓ Approve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── All Doctors ───────────────────────────────────────────────────────────────
const AllDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const LIMIT = 15;

  const fetch = async (p = 1) => {
    setLoading(true);
    try {
      const res = await getAllDoctors({ page: p, limit: LIMIT });
      setDoctors(res.data.doctors);
      setTotal(res.data.total);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetch(page); }, [page]);

  const handleToggle = async (id, name, currentActive) => {
    try {
      await toggleDoctorActive(id);
      toast.success(`Dr. ${name} ${currentActive ? 'deactivated' : 'activated'}.`);
      fetch(page);
    } catch { toast.error('Action failed.'); }
  };

  const filtered = search
    ? doctors.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()) || d.email.toLowerCase().includes(search.toLowerCase()))
    : doctors;

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..." className="input-field pl-10" />
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-left text-gray-500">
                  <th className="px-5 py-3 font-semibold">Doctor</th>
                  <th className="px-5 py-3 font-semibold">Specialization</th>
                  <th className="px-5 py-3 font-semibold">City</th>
                  <th className="px-5 py-3 font-semibold">Fee</th>
                  <th className="px-5 py-3 font-semibold">Rating</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((doc) => (
                  <tr key={doc._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-gray-800">Dr. {doc.name}</p>
                      <p className="text-gray-400 text-xs">{doc.email}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{doc.specialization?.[0]}</td>
                    <td className="px-5 py-3 text-gray-600">{doc.address?.city}</td>
                    <td className="px-5 py-3 font-semibold text-gray-800">₹{doc.consultationFee}</td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-1">
                        ⭐ {doc.rating?.toFixed(1) || '—'}
                        <span className="text-gray-400 text-xs">({doc.totalReviews})</span>
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {doc.isVerified ? (
                        <span className="badge-confirmed">Verified</span>
                      ) : (
                        <span className="badge-pending">Unverified</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => handleToggle(doc._id, doc.name, doc.isActive)}
                        className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                          doc.isActive
                            ? 'text-red-600 border-red-200 hover:bg-red-50'
                            : 'text-green-600 border-green-200 hover:bg-green-50'
                        }`}>
                        {doc.isActive ? <><ToggleRight className="w-3.5 h-3.5" />Deactivate</> : <><ToggleLeft className="w-3.5 h-3.5" />Activate</>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600 font-medium">Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

// ── Patients ──────────────────────────────────────────────────────────────────
const AllPatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    getAllPatients({ page, limit: 20 })
      .then((r) => { setPatients(r.data.patients); setTotal(r.data.total); })
      .finally(() => setLoading(false));
  }, [page]);

  const filtered = search
    ? patients.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase()))
    : patients;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search patients..." className="input-field pl-10" />
      </div>
      <p className="text-sm text-gray-400">{total} total patients</p>
      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-left text-gray-500">
                  <th className="px-5 py-3 font-semibold">Name</th>
                  <th className="px-5 py-3 font-semibold">Email</th>
                  <th className="px-5 py-3 font-semibold">Phone</th>
                  <th className="px-5 py-3 font-semibold">City</th>
                  <th className="px-5 py-3 font-semibold">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-semibold text-gray-800">{p.name}</td>
                    <td className="px-5 py-3 text-gray-500">{p.email}</td>
                    <td className="px-5 py-3 text-gray-500">{p.phone || '—'}</td>
                    <td className="px-5 py-3 text-gray-500">{p.address?.city || '—'}</td>
                    <td className="px-5 py-3 text-gray-400">{format(new Date(p.createdAt), 'dd MMM yyyy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ── All Appointments ──────────────────────────────────────────────────────────
const AllAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    getAllAppointments({ status: statusFilter || undefined, page, limit: 20 })
      .then((r) => { setAppointments(r.data.appointments); setTotal(r.data.total); })
      .finally(() => setLoading(false));
  }, [statusFilter, page]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {['', 'confirmed', 'completed', 'cancelled', 'pending_payment', 'refunded'].map((s) => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              statusFilter === s ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-300'
            }`}>
            {s === '' ? 'All' : s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>
      <p className="text-sm text-gray-400">{total} appointments</p>
      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-left text-gray-500">
                  <th className="px-5 py-3 font-semibold">Patient</th>
                  <th className="px-5 py-3 font-semibold">Doctor</th>
                  <th className="px-5 py-3 font-semibold">Date & Time</th>
                  <th className="px-5 py-3 font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">Payment</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {appointments.map((appt) => (
                  <tr key={appt._id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-gray-800">{appt.patient?.name}</p>
                      <p className="text-gray-400 text-xs">{appt.patient?.phone}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-600">Dr. {appt.doctor?.name}</td>
                    <td className="px-5 py-3">
                      <p className="text-gray-800">{appt.date}</p>
                      <p className="text-gray-400 text-xs">{appt.startTime} – {appt.endTime}</p>
                    </td>
                    <td className="px-5 py-3 font-semibold text-gray-800">
                      ₹{(appt.payment?.amount / 100).toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3">
                      <span className={appt.payment?.status === 'paid' ? 'badge-confirmed' : 'badge-pending'}>
                        {appt.payment?.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={STATUS_BADGE[appt.status] || 'badge-pending'}>{appt.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Analytics ─────────────────────────────────────────────────────────────────
const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRevenueAnalytics()
      .then((r) => setData(r.data.analytics))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />)}</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Revenue Line Chart */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Revenue — Last 7 Days</h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data.last7Days}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(d) => format(new Date(d + 'T00:00:00'), 'dd MMM')} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']}
              labelFormatter={(d) => format(new Date(d + 'T00:00:00'), 'dd MMM yyyy')}
            />
            <Line type="monotone" dataKey="revenueINR" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Doctors Bar Chart */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Top Doctors by Revenue</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.topDoctors} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100}
                tickFormatter={(n) => `Dr. ${n.split(' ')[0]}`} />
              <Tooltip formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} />
              <Bar dataKey="revenueINR" fill="#2563eb" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Specialization Pie */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Appointments by Specialization</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={data.bySpecialization}
                dataKey="appointments"
                nameKey="specialization"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ specialization, percent }) => `${specialization?.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.bySpecialization.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n, props) => [v, props.payload.specialization]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Specialization Table */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Revenue by Specialization</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100">
              <tr className="text-left text-gray-400">
                <th className="pb-3 font-semibold">Specialization</th>
                <th className="pb-3 font-semibold text-right">Appointments</th>
                <th className="pb-3 font-semibold text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.bySpecialization.map((s, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="py-3 font-medium text-gray-800">{s.specialization}</td>
                  <td className="py-3 text-right text-gray-600">{s.appointments}</td>
                  <td className="py-3 text-right font-semibold text-gray-800">₹{s.revenueINR.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ── Main Admin Dashboard ──────────────────────────────────────────────────────
const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-400 text-sm">MediConnect Platform Management</p>
          </div>
        </div>

        {/* Tab Nav */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-8 overflow-x-auto w-fit">
          {TABS.map(({ id, label }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                activeTab === id ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && <Overview />}
        {activeTab === 'doctors' && <AllDoctors />}
        {activeTab === 'pending' && <PendingVerification />}
        {activeTab === 'patients' && <AllPatients />}
        {activeTab === 'appointments' && <AllAppointments />}
        {activeTab === 'analytics' && <Analytics />}
      </div>
    </div>
  );
};

export default AdminDashboard;
