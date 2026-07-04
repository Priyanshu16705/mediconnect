import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getDoctors, getCities, getSpecializations } from '../api';
import { Search, MapPin, Star, Filter, ChevronLeft, ChevronRight, X, SlidersHorizontal } from 'lucide-react';

const DoctorCard = ({ doctor, onClick }) => (
  <div onClick={onClick} className="card cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-200 group">
    <div className="flex gap-4">
      <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center flex-shrink-0">
        <span className="text-3xl font-bold text-primary-700">{doctor.name.charAt(0)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
          Dr. {doctor.name}
        </h3>
        <p className="text-primary-600 font-medium text-sm">{doctor.specialization?.join(', ')}</p>
        <p className="text-gray-400 text-xs mt-0.5">{doctor.experience} yrs experience</p>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-semibold text-gray-700">{doctor.rating?.toFixed(1) || '—'}</span>
            <span className="text-gray-400 text-xs">({doctor.totalReviews})</span>
          </div>
          <div className="flex items-center gap-1 text-gray-500 text-xs">
            <MapPin className="w-3 h-3" />
            {doctor.address?.city}
          </div>
        </div>
      </div>
    </div>
    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
      <div>
        <span className="text-2xl font-bold text-gray-900">₹{doctor.consultationFee}</span>
        <span className="text-gray-400 text-sm"> / visit</span>
      </div>
      <button className="btn-primary text-sm py-2 px-4">Book Now</button>
    </div>
  </div>
);

const DoctorsList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [cities, setCities] = useState([]);
  const [specs, setSpecs] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    city: searchParams.get('city') || '',
    specialization: searchParams.get('specialization') || '',
    name: searchParams.get('name') || '',
    minFee: '', maxFee: '', minExp: '', minRating: '',
    page: 1, limit: 12, sort: '-rating',
  });

  useEffect(() => {
    getCities().then((r) => setCities(r.data.cities)).catch(() => {});
    getSpecializations().then((r) => setSpecs(r.data.specializations)).catch(() => {});
  }, []);

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '' && v !== null));
      const res = await getDoctors(params);
      setDoctors(res.data.doctors);
      setTotal(res.data.total);
    } catch { setDoctors([]); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

  const updateFilter = (key, value) => setFilters((p) => ({ ...p, [key]: value, page: 1 }));
  const clearFilters = () => setFilters({ city: '', specialization: '', name: '', minFee: '', maxFee: '', minExp: '', minRating: '', page: 1, limit: 12, sort: '-rating' });
  const totalPages = Math.ceil(total / filters.limit);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Search Bar */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={filters.name}
              onChange={(e) => updateFilter('name', e.target.value)}
              placeholder="Search doctors by name..."
              className="input-field pl-10"
            />
          </div>
          <select value={filters.city} onChange={(e) => updateFilter('city', e.target.value)} className="input-field w-full sm:w-48">
            <option value="">All Cities</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filters.specialization} onChange={(e) => updateFilter('specialization', e.target.value)} className="input-field w-full sm:w-56">
            <option value="">All Specializations</option>
            {specs.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center gap-2 whitespace-nowrap">
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="max-w-7xl mx-auto px-4 pb-4 flex flex-wrap gap-3 border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-600">Fee (₹):</span>
              <input value={filters.minFee} onChange={(e) => updateFilter('minFee', e.target.value)}
                type="number" className="input-field w-24 py-2 text-sm" placeholder="Min" />
              <span className="text-gray-400">–</span>
              <input value={filters.maxFee} onChange={(e) => updateFilter('maxFee', e.target.value)}
                type="number" className="input-field w-24 py-2 text-sm" placeholder="Max" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-600">Min Exp:</span>
              <input value={filters.minExp} onChange={(e) => updateFilter('minExp', e.target.value)}
                type="number" className="input-field w-20 py-2 text-sm" placeholder="Yrs" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-600">Min Rating:</span>
              <select value={filters.minRating} onChange={(e) => updateFilter('minRating', e.target.value)}
                className="input-field py-2 text-sm w-28">
                <option value="">Any</option>
                {[4.5, 4, 3.5, 3].map((r) => <option key={r} value={r}>{r}★ & up</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-600">Sort:</span>
              <select value={filters.sort} onChange={(e) => updateFilter('sort', e.target.value)}
                className="input-field py-2 text-sm w-44">
                <option value="-rating">Highest Rated</option>
                <option value="consultationFee">Fee: Low to High</option>
                <option value="-consultationFee">Fee: High to Low</option>
                <option value="-experience">Most Experienced</option>
              </select>
            </div>
            <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-red-500 hover:underline font-medium">
              <X className="w-3.5 h-3.5" /> Clear all
            </button>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {loading ? 'Searching...' : `${total} Doctor${total !== 1 ? 's' : ''} Found`}
          </h1>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-gray-200 rounded-2xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-700">No doctors found</h3>
            <p className="text-gray-400 mt-2">Try adjusting your filters or search in a different city.</p>
            <button onClick={clearFilters} className="btn-primary mt-6">Clear Filters</button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doc) => (
              <DoctorCard key={doc._id} doctor={doc} onClick={() => navigate(`/doctors/${doc._id}`)} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10">
            <button onClick={() => updateFilter('page', filters.page - 1)} disabled={filters.page === 1}
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
              <ChevronLeft className="w-5 h-5" />
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button key={i}
                onClick={() => updateFilter('page', i + 1)}
                className={`w-10 h-10 rounded-xl font-semibold text-sm transition-all ${filters.page === i + 1 ? 'bg-primary-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {i + 1}
              </button>
            ))}
            <button onClick={() => updateFilter('page', filters.page + 1)} disabled={filters.page === totalPages}
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorsList;
