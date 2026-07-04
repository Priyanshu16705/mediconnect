import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Shield, Clock, Star, ArrowRight, Heart, Users, Award, CheckCircle } from 'lucide-react';
import { getCities, getSpecializations, getDoctors } from '../api';

const SPECIALIZATIONS_ICONS = {
  'Cardiology': '❤️', 'Dermatology': '🩺', 'Neurology': '🧠',
  'Orthopedics': '🦴', 'Pediatrics': '👶', 'Gynecology': '👩',
  'Ophthalmology': '👁️', 'ENT': '👂', 'Psychiatry': '🧘',
  'General Medicine': '🏥', 'Dentistry': '🦷', 'Urology': '🔬',
};

const Home = () => {
  const navigate = useNavigate();
  const [city, setCity] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [cities, setCities] = useState([]);
  const [specs, setSpecs] = useState([]);
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    getCities().then((r) => setCities(r.data.cities)).catch(() => {});
    getSpecializations().then((r) => setSpecs(r.data.specializations)).catch(() => {});
    getDoctors({ limit: 4, sort: '-rating' }).then((r) => setFeatured(r.data.doctors)).catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (specialization) params.set('specialization', specialization);
    navigate(`/doctors?${params.toString()}`);
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 text-sm font-medium">
              <Shield className="w-4 h-4 text-green-300" />
              <span>Trusted by 50,000+ patients across India</span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-6">
              Your Health,{' '}
              <span className="text-yellow-300">Our Priority</span>
            </h1>
            <p className="text-xl text-primary-100 mb-10 max-w-xl leading-relaxed">
              Book appointments with verified doctors near you. Instant confirmation, secure payments, and real care.
            </p>

            {/* Search Box */}
            <form onSubmit={handleSearch} className="bg-white rounded-2xl p-4 shadow-2xl flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2 flex-1 bg-gray-50 rounded-xl px-4 py-3">
                <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="bg-transparent w-full text-gray-700 focus:outline-none text-sm"
                >
                  <option value="">All Cities</option>
                  {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2 flex-1 bg-gray-50 rounded-xl px-4 py-3">
                <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <select
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="bg-transparent w-full text-gray-700 focus:outline-none text-sm"
                >
                  <option value="">All Specializations</option>
                  {specs.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2 whitespace-nowrap">
                <Search className="w-4 h-4" /> Find Doctors
              </button>
            </form>
          </div>
        </div>

        {/* Stats bar */}
        <div className="bg-primary-800/50 backdrop-blur-sm border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Users, label: 'Patients Served', value: '50K+' },
              { icon: Award, label: 'Verified Doctors', value: '500+' },
              { icon: MapPin, label: 'Cities Covered', value: '25+' },
              { icon: Star, label: 'Average Rating', value: '4.8★' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-bold text-yellow-300">{value}</div>
                <div className="text-primary-200 text-sm mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Specializations */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Browse by Specialization</h2>
            <p className="text-gray-500 text-lg">Find the right specialist for your needs</p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {Object.entries(SPECIALIZATIONS_ICONS).map(([spec, icon]) => (
              <button
                key={spec}
                onClick={() => navigate(`/doctors?specialization=${spec}`)}
                className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-gray-50 hover:bg-primary-50 hover:border-primary-200 border border-transparent transition-all duration-200 group"
              >
                <span className="text-3xl">{icon}</span>
                <span className="text-xs font-semibold text-gray-600 group-hover:text-primary-700 text-center leading-tight">{spec}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Why MediConnect */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Why Choose MediConnect?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Shield, color: 'text-green-600 bg-green-100', title: 'Verified Doctors', desc: 'All doctors are verified by our admin team with valid medical licenses before going live.' },
              { icon: Clock, color: 'text-blue-600 bg-blue-100', title: 'Instant Booking', desc: 'See real-time slot availability and get instant confirmation. No waiting on calls.' },
              { icon: Heart, color: 'text-red-500 bg-red-100', title: 'Secure Payments', desc: 'Pay with UPI, cards, or net banking via Razorpay. Your money is fully protected.' },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="card text-center hover:shadow-md transition-shadow">
                <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center mx-auto mb-5`}>
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
                <p className="text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Doctors */}
      {featured.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Top Rated Doctors</h2>
                <p className="text-gray-500 mt-1">Highly experienced and reviewed by patients</p>
              </div>
              <button onClick={() => navigate('/doctors')} className="flex items-center gap-1 text-primary-600 font-semibold hover:underline">
                View all <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map((doc) => (
                <div key={doc._id} onClick={() => navigate(`/doctors/${doc._id}`)}
                  className="card cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-200 group">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                    <span className="text-2xl font-bold text-primary-700">{doc.name.charAt(0)}</span>
                  </div>
                  <div className="text-center">
                    <h3 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">Dr. {doc.name}</h3>
                    <p className="text-primary-600 text-sm font-medium mt-0.5">{doc.specialization?.[0]}</p>
                    <p className="text-gray-400 text-xs mt-1">{doc.address?.city}</p>
                    <div className="flex items-center justify-center gap-1 mt-3">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-semibold text-gray-700">{doc.rating?.toFixed(1) || '—'}</span>
                      <span className="text-gray-400 text-xs">({doc.totalReviews})</span>
                    </div>
                    <p className="text-gray-800 font-bold mt-2">₹{doc.consultationFee}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Are You a Doctor?</h2>
          <p className="text-primary-100 text-lg mb-8 max-w-2xl mx-auto">
            Join MediConnect to manage your appointments, grow your practice, and help patients across India.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => navigate('/register?role=doctor')}
              className="bg-white text-primary-700 font-bold px-8 py-4 rounded-2xl hover:bg-primary-50 transition-colors shadow-lg">
              Register as Doctor
            </button>
            <button onClick={() => navigate('/register')}
              className="border-2 border-white text-white font-bold px-8 py-4 rounded-2xl hover:bg-white/10 transition-colors">
              Book as Patient
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-primary-400 fill-primary-400" />
            <span className="text-white font-bold text-lg">MediConnect</span>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} MediConnect. Connecting patients with trusted doctors across India.</p>
          <div className="flex justify-center gap-6 mt-4 text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Refund Policy</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
