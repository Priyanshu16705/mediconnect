import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';
import { registerPatient, registerDoctor, getCities } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { Heart, User, Stethoscope, Plus, Trash2, Eye, EyeOff } from 'lucide-react';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const SPECS = ['General Medicine', 'Cardiology', 'Dermatology', 'Neurology', 'Orthopedics',
  'Pediatrics', 'Gynecology', 'Ophthalmology', 'ENT', 'Psychiatry', 'Dentistry',
  'Urology', 'Gastroenterology', 'Pulmonology', 'Endocrinology', 'Nephrology'];
const SLOT_DURATIONS = [10, 15, 20, 30, 45, 60];

const defaultWorkingHours = () =>
  DAYS.map((day) => ({
    day,
    isWorking: !['saturday', 'sunday'].includes(day),
    startTime: '09:00',
    endTime: '17:00',
    breakStart: '13:00',
    breakEnd: '14:00',
  }));

const Register = () => {
  const [searchParams] = useSearchParams();
  const [role, setRole] = useState(searchParams.get('role') || 'patient');
  const [step, setStep] = useState(1);
  const [showPwd, setShowPwd] = useState(false);
  const [cities, setCities] = useState([]);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, watch, control, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      workingHours: defaultWorkingHours(),
      slotDurationMinutes: 20,
      maxPatientsPerSlot: 1,
      qualifications: [{ degree: '', institution: '', year: '' }],
      specialization: [],
    },
  });

  const { fields: qualFields, append: addQual, remove: removeQual } = useFieldArray({ control, name: 'qualifications' });

  useEffect(() => {
    getCities().then((r) => setCities(r.data.cities)).catch(() => {});
  }, []);

  const onSubmit = async (data) => {
    try {
      if (role === 'patient') {
        const res = await registerPatient(data);
        loginUser(res.data.user, res.data.token);
        toast.success('Welcome to MediConnect!');
        navigate('/patient/dashboard');
      } else {
        await registerDoctor(data);
        toast.success('Registration submitted! Admin will verify your profile within 24 hours.');
        navigate('/login');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">Medi<span className="text-primary-600">Connect</span></span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-500 mt-2">Join thousands of users on MediConnect</p>
        </div>

        {/* Role Toggle */}
        <div className="bg-white rounded-2xl p-2 mb-6 flex shadow-sm border border-gray-100">
          <button
            type="button"
            onClick={() => { setRole('patient'); setStep(1); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${role === 'patient' ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <User className="w-4 h-4" /> Register as Patient
          </button>
          <button
            type="button"
            onClick={() => { setRole('doctor'); setStep(1); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${role === 'doctor' ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Stethoscope className="w-4 h-4" /> Register as Doctor
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* ── STEP 1: Basic Info ── */}
          {step === 1 && (
            <div className="card space-y-5">
              <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
                {role === 'patient' ? 'Personal Details' : 'Basic Information'}
              </h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label>
                  <input {...register('name', { required: 'Name is required' })}
                    className="input-field" placeholder="Dr. Anil Kumar" />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email *</label>
                  <input {...register('email', { required: 'Email is required', pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' } })}
                    type="email" className="input-field" placeholder="you@example.com" />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone *</label>
                  <input {...register('phone', { required: 'Phone is required', pattern: { value: /^[6-9]\d{9}$/, message: 'Enter valid 10-digit Indian number' } })}
                    className="input-field" placeholder="9876543210" maxLength={10} />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password *</label>
                  <div className="relative">
                    <input {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Min 8 characters' } })}
                      type={showPwd ? 'text' : 'password'} className="input-field pr-12" placeholder="Min 8 characters" />
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                </div>
              </div>

              {role === 'patient' && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Gender</label>
                    <select {...register('gender')} className="input-field">
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date of Birth</label>
                    <input {...register('dateOfBirth')} type="date" className="input-field" />
                  </div>
                </div>
              )}

              {role === 'doctor' && (
                <>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Medical License No. *</label>
                      <input {...register('licenseNumber', { required: 'License number required' })}
                        className="input-field" placeholder="MCI-123456" />
                      {errors.licenseNumber && <p className="text-red-500 text-xs mt-1">{errors.licenseNumber.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Years of Experience *</label>
                      <input {...register('experience', { required: 'Required', min: { value: 0, message: 'Min 0' } })}
                        type="number" className="input-field" placeholder="5" min={0} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Specializations * (select all that apply)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {SPECS.map((s) => (
                        <label key={s} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                          <input type="checkbox" value={s} {...register('specialization', { required: 'Select at least one' })}
                            className="accent-primary-600 w-4 h-4" />
                          <span className="text-sm text-gray-700">{s}</span>
                        </label>
                      ))}
                    </div>
                    {errors.specialization && <p className="text-red-500 text-xs mt-1">{errors.specialization.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">About / Bio</label>
                    <textarea {...register('about')} rows={3} className="input-field resize-none"
                      placeholder="Brief description of your practice and expertise..." />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-semibold text-gray-700">Qualifications *</label>
                      <button type="button" onClick={() => addQual({ degree: '', institution: '', year: '' })}
                        className="flex items-center gap-1 text-primary-600 text-sm font-medium hover:underline">
                        <Plus className="w-4 h-4" /> Add More
                      </button>
                    </div>
                    <div className="space-y-3">
                      {qualFields.map((field, i) => (
                        <div key={field.id} className="grid grid-cols-3 gap-2 items-end">
                          <div>
                            <input {...register(`qualifications.${i}.degree`, { required: true })}
                              className="input-field" placeholder="MBBS" />
                          </div>
                          <div>
                            <input {...register(`qualifications.${i}.institution`, { required: true })}
                              className="input-field" placeholder="AIIMS Delhi" />
                          </div>
                          <div className="flex gap-2">
                            <input {...register(`qualifications.${i}.year`)}
                              type="number" className="input-field" placeholder="2015" min={1970} max={new Date().getFullYear()} />
                            {i > 0 && (
                              <button type="button" onClick={() => removeQual(i)}
                                className="text-red-400 hover:text-red-600 p-2">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-between pt-2">
                <Link to="/login" className="text-sm text-gray-500 hover:text-primary-600 font-medium self-center">
                  Already have an account? Log in
                </Link>
                {role === 'patient' ? (
                  <button type="submit" disabled={isSubmitting} className="btn-primary">
                    {isSubmitting ? 'Creating account...' : 'Create Account'}
                  </button>
                ) : (
                  <button type="button" onClick={() => setStep(2)} className="btn-primary">
                    Next: Clinic Details →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 2: Clinic + Location (Doctor only) ── */}
          {step === 2 && role === 'doctor' && (
            <div className="card space-y-5">
              <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Clinic & Location</h2>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Clinic / Hospital Name</label>
                <input {...register('clinicName')} className="input-field" placeholder="City Care Clinic" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Street Address *</label>
                <input {...register('address.street', { required: 'Address required' })} className="input-field" placeholder="123, MG Road" />
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">City *</label>
                  <input {...register('address.city', { required: 'City required' })} className="input-field" placeholder="Mumbai" list="cities-list" />
                  <datalist id="cities-list">
                    {cities.map((c) => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">State *</label>
                  <input {...register('address.state', { required: 'State required' })} className="input-field" placeholder="Maharashtra" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Pincode</label>
                  <input {...register('address.pincode')} className="input-field" placeholder="400001" maxLength={6} />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Consultation Fee (₹) *</label>
                  <input {...register('consultationFee', { required: 'Fee required', min: { value: 0, message: 'Invalid' } })}
                    type="number" className="input-field" placeholder="500" min={0} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Slot Duration *</label>
                  <select {...register('slotDurationMinutes')} className="input-field">
                    {SLOT_DURATIONS.map((d) => <option key={d} value={d}>{d} minutes</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Max Patients/Slot *</label>
                  <input {...register('maxPatientsPerSlot', { required: true, min: 1, max: 100 })}
                    type="number" className="input-field" placeholder="1" min={1} max={100} />
                </div>
              </div>

              {/* Working Hours */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3">Working Hours</h3>
                <div className="space-y-3">
                  {DAYS.map((day, i) => {
                    const isWorking = watch(`workingHours.${i}.isWorking`);
                    return (
                      <div key={day} className="grid grid-cols-5 gap-3 items-center p-3 rounded-xl bg-gray-50">
                        <div className="flex items-center gap-2 col-span-1">
                          <input type="checkbox" {...register(`workingHours.${i}.isWorking`)}
                            className="accent-primary-600 w-4 h-4" />
                          <span className="text-sm font-medium text-gray-700 capitalize">{day.slice(0, 3)}</span>
                        </div>
                        {isWorking ? (
                          <>
                            <input {...register(`workingHours.${i}.startTime`)} type="time" className="input-field py-2 text-sm col-span-1" />
                            <input {...register(`workingHours.${i}.endTime`)} type="time" className="input-field py-2 text-sm col-span-1" />
                            <input {...register(`workingHours.${i}.breakStart`)} type="time" className="input-field py-2 text-sm col-span-1" placeholder="Break start" />
                            <input {...register(`workingHours.${i}.breakEnd`)} type="time" className="input-field py-2 text-sm col-span-1" placeholder="Break end" />
                          </>
                        ) : (
                          <span className="col-span-4 text-gray-400 text-sm italic">Not working this day</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-400 mt-2">Columns: Start time · End time · Break start · Break end</p>
              </div>

              <div className="flex justify-between pt-2">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary">← Back</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary">
                  {isSubmitting ? 'Submitting...' : 'Submit Registration'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Register;
