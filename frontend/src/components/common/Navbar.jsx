import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Heart, Menu, X, User, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);

  const handleLogout = async () => {
    await logoutUser();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const dashboardPath =
    user?.role === 'doctor' ? '/doctor/dashboard' :
    user?.role === 'admin' ? '/admin/dashboard' : '/patient/dashboard';

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center group-hover:bg-primary-700 transition-colors">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              Medi<span className="text-primary-600">Connect</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/doctors" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">
              Find Doctors
            </Link>
            <Link to="/doctors?city=" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">
              Specialities
            </Link>

            {!user ? (
              <div className="flex items-center gap-3">
                <Link to="/login" className="btn-secondary text-sm py-2">Log in</Link>
                <Link to="/register" className="btn-primary text-sm py-2">Sign up</Link>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setDropOpen(!dropOpen)}
                  className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-xl transition-colors"
                >
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-700 font-bold text-sm">
                      {user.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-medium text-gray-700 text-sm">{user.name?.split(' ')[0]}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {dropOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-50 mb-1">
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{user.role}</p>
                      <p className="text-sm font-semibold text-gray-800 truncate">{user.name}</p>
                    </div>
                    <Link
                      to={dashboardPath}
                      onClick={() => setDropOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setDropOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                    >
                      <User className="w-4 h-4" /> Profile
                    </Link>
                    <button
                      onClick={() => { setDropOpen(false); handleLogout(); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Log out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3">
          <Link to="/doctors" className="block text-gray-700 font-medium py-2" onClick={() => setMenuOpen(false)}>Find Doctors</Link>
          {!user ? (
            <>
              <Link to="/login" className="block btn-secondary text-center" onClick={() => setMenuOpen(false)}>Log in</Link>
              <Link to="/register" className="block btn-primary text-center" onClick={() => setMenuOpen(false)}>Sign up</Link>
            </>
          ) : (
            <>
              <Link to={dashboardPath} className="block text-gray-700 font-medium py-2" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <button onClick={handleLogout} className="block w-full text-left text-red-600 font-medium py-2">Log out</button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
