require('dotenv').config();
const mongoose = require('mongoose');

const SAMPLE_DOCTORS = [
  {
    name: 'Priya Sharma', email: 'priya.sharma@mediconnect.in', password: 'Doctor@123',
    phone: '9876543001', specialization: ['Cardiology', 'General Medicine'],
    qualifications: [{ degree: 'MBBS', institution: 'AIIMS Delhi', year: 2010 }, { degree: 'MD Cardiology', institution: 'PGI Chandigarh', year: 2014 }],
    experience: 13, licenseNumber: 'MCI-DL-10001',
    about: 'Senior cardiologist with 13 years of experience in interventional cardiology.',
    clinicName: 'HeartCare Clinic',
    address: { street: '14, Connaught Place', city: 'Delhi', state: 'Delhi', pincode: '110001' },
    consultationFee: 800, slotDurationMinutes: 20, maxPatientsPerSlot: 1,
    isVerified: true, rating: 4.8, totalReviews: 124,
    workingHours: [
      { day: 'monday', isWorking: true, startTime: '09:00', endTime: '17:00', breakStart: '13:00', breakEnd: '14:00' },
      { day: 'tuesday', isWorking: true, startTime: '09:00', endTime: '17:00', breakStart: '13:00', breakEnd: '14:00' },
      { day: 'wednesday', isWorking: true, startTime: '09:00', endTime: '17:00', breakStart: '13:00', breakEnd: '14:00' },
      { day: 'thursday', isWorking: true, startTime: '09:00', endTime: '17:00', breakStart: '13:00', breakEnd: '14:00' },
      { day: 'friday', isWorking: true, startTime: '09:00', endTime: '17:00', breakStart: '13:00', breakEnd: '14:00' },
      { day: 'saturday', isWorking: true, startTime: '09:00', endTime: '13:00', breakStart: '', breakEnd: '' },
      { day: 'sunday', isWorking: false, startTime: '09:00', endTime: '13:00', breakStart: '', breakEnd: '' },
    ],
  },
  {
    name: 'Arjun Mehta', email: 'arjun.mehta@mediconnect.in', password: 'Doctor@123',
    phone: '9876543002', specialization: ['Dermatology'],
    qualifications: [{ degree: 'MBBS', institution: 'Grant Medical College Mumbai', year: 2012 }, { degree: 'MD Dermatology', institution: 'KEM Hospital', year: 2016 }],
    experience: 10, licenseNumber: 'MCI-MH-10002',
    about: 'Expert dermatologist specializing in acne, pigmentation, hair loss, and cosmetic dermatology.',
    clinicName: 'Skin Solutions',
    address: { street: 'Plot 7, Bandra West', city: 'Mumbai', state: 'Maharashtra', pincode: '400050' },
    consultationFee: 600, slotDurationMinutes: 15, maxPatientsPerSlot: 2,
    isVerified: true, rating: 4.6, totalReviews: 89,
    workingHours: [
      { day: 'monday', isWorking: true, startTime: '10:00', endTime: '18:00', breakStart: '13:00', breakEnd: '14:00' },
      { day: 'tuesday', isWorking: true, startTime: '10:00', endTime: '18:00', breakStart: '13:00', breakEnd: '14:00' },
      { day: 'wednesday', isWorking: false, startTime: '10:00', endTime: '18:00', breakStart: '', breakEnd: '' },
      { day: 'thursday', isWorking: true, startTime: '10:00', endTime: '18:00', breakStart: '13:00', breakEnd: '14:00' },
      { day: 'friday', isWorking: true, startTime: '10:00', endTime: '18:00', breakStart: '13:00', breakEnd: '14:00' },
      { day: 'saturday', isWorking: true, startTime: '10:00', endTime: '14:00', breakStart: '', breakEnd: '' },
      { day: 'sunday', isWorking: false, startTime: '10:00', endTime: '14:00', breakStart: '', breakEnd: '' },
    ],
  },
  {
    name: 'Sunita Reddy', email: 'sunita.reddy@mediconnect.in', password: 'Doctor@123',
    phone: '9876543003', specialization: ['Pediatrics'],
    qualifications: [{ degree: 'MBBS', institution: 'Osmania Medical College Hyderabad', year: 2008 }, { degree: 'MD Pediatrics', institution: 'NIMHANS', year: 2012 }],
    experience: 15, licenseNumber: 'MCI-TS-10003',
    about: 'Compassionate pediatrician with 15 years of experience in child healthcare and newborn care.',
    clinicName: 'Little Stars Clinic',
    address: { street: '23, Jubilee Hills', city: 'Hyderabad', state: 'Telangana', pincode: '500033' },
    consultationFee: 500, slotDurationMinutes: 20, maxPatientsPerSlot: 1,
    isVerified: true, rating: 4.9, totalReviews: 201,
    workingHours: [
      { day: 'monday', isWorking: true, startTime: '08:00', endTime: '16:00', breakStart: '12:00', breakEnd: '13:00' },
      { day: 'tuesday', isWorking: true, startTime: '08:00', endTime: '16:00', breakStart: '12:00', breakEnd: '13:00' },
      { day: 'wednesday', isWorking: true, startTime: '08:00', endTime: '16:00', breakStart: '12:00', breakEnd: '13:00' },
      { day: 'thursday', isWorking: true, startTime: '08:00', endTime: '16:00', breakStart: '12:00', breakEnd: '13:00' },
      { day: 'friday', isWorking: true, startTime: '08:00', endTime: '16:00', breakStart: '12:00', breakEnd: '13:00' },
      { day: 'saturday', isWorking: true, startTime: '08:00', endTime: '12:00', breakStart: '', breakEnd: '' },
      { day: 'sunday', isWorking: false, startTime: '08:00', endTime: '12:00', breakStart: '', breakEnd: '' },
    ],
  },
  {
    name: 'Rajesh Kumar', email: 'rajesh.kumar@mediconnect.in', password: 'Doctor@123',
    phone: '9876543004', specialization: ['Orthopedics'],
    qualifications: [{ degree: 'MBBS', institution: 'PGIMER Chandigarh', year: 2005 }, { degree: 'MS Orthopedics', institution: 'PGIMER Chandigarh', year: 2010 }],
    experience: 18, licenseNumber: 'MCI-PB-10004',
    about: 'Orthopedic surgeon specializing in joint replacement, sports injuries, and spine surgery.',
    clinicName: 'Bone & Joint Centre',
    address: { street: 'Sector 17, SCO 45', city: 'Chandigarh', state: 'Punjab', pincode: '160017' },
    consultationFee: 1000, slotDurationMinutes: 30, maxPatientsPerSlot: 1,
    isVerified: true, rating: 4.7, totalReviews: 156,
    workingHours: [
      { day: 'monday', isWorking: true, startTime: '09:00', endTime: '17:00', breakStart: '13:00', breakEnd: '14:00' },
      { day: 'tuesday', isWorking: true, startTime: '09:00', endTime: '17:00', breakStart: '13:00', breakEnd: '14:00' },
      { day: 'wednesday', isWorking: true, startTime: '09:00', endTime: '17:00', breakStart: '13:00', breakEnd: '14:00' },
      { day: 'thursday', isWorking: true, startTime: '09:00', endTime: '17:00', breakStart: '13:00', breakEnd: '14:00' },
      { day: 'friday', isWorking: true, startTime: '09:00', endTime: '17:00', breakStart: '13:00', breakEnd: '14:00' },
      { day: 'saturday', isWorking: false, startTime: '09:00', endTime: '13:00', breakStart: '', breakEnd: '' },
      { day: 'sunday', isWorking: false, startTime: '09:00', endTime: '13:00', breakStart: '', breakEnd: '' },
    ],
  },
  {
    name: 'Meera Nair', email: 'meera.nair@mediconnect.in', password: 'Doctor@123',
    phone: '9876543005', specialization: ['Gynecology', 'Obstetrics'],
    qualifications: [{ degree: 'MBBS', institution: 'Trivandrum Medical College', year: 2009 }, { degree: 'MS Gynecology', institution: 'JIPMER Puducherry', year: 2013 }],
    experience: 14, licenseNumber: 'MCI-KL-10005',
    about: 'Experienced gynecologist with expertise in high-risk pregnancies and laparoscopic surgery.',
    clinicName: "Women's Health Centre",
    address: { street: '5, MG Road, Ernakulam', city: 'Kochi', state: 'Kerala', pincode: '682016' },
    consultationFee: 700, slotDurationMinutes: 20, maxPatientsPerSlot: 1,
    isVerified: true, rating: 4.8, totalReviews: 178,
    workingHours: [
      { day: 'monday', isWorking: true, startTime: '09:00', endTime: '17:00', breakStart: '13:00', breakEnd: '14:00' },
      { day: 'tuesday', isWorking: true, startTime: '09:00', endTime: '17:00', breakStart: '13:00', breakEnd: '14:00' },
      { day: 'wednesday', isWorking: true, startTime: '09:00', endTime: '17:00', breakStart: '13:00', breakEnd: '14:00' },
      { day: 'thursday', isWorking: true, startTime: '09:00', endTime: '17:00', breakStart: '13:00', breakEnd: '14:00' },
      { day: 'friday', isWorking: true, startTime: '09:00', endTime: '17:00', breakStart: '13:00', breakEnd: '14:00' },
      { day: 'saturday', isWorking: true, startTime: '09:00', endTime: '13:00', breakStart: '', breakEnd: '' },
      { day: 'sunday', isWorking: false, startTime: '09:00', endTime: '13:00', breakStart: '', breakEnd: '' },
    ],
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Load models AFTER connection
    const User = require('./src/models/User');
    const Doctor = require('./src/models/Doctor');
    const { generateSlotsForDays } = require('./src/utils/slotGenerator');

    // Admin
    const existingAdmin = await User.findOne({ email: 'admin@mediconnect.in' });
    if (!existingAdmin) {
      await User.create({ name: 'MediConnect Admin', email: 'admin@mediconnect.in', password: 'Admin@123', role: 'admin', phone: '9999999999' });
      console.log('✅ Admin created: admin@mediconnect.in / Admin@123');
    } else {
      console.log('ℹ️  Admin already exists');
    }

    // Patient
    const existingPatient = await User.findOne({ email: 'patient@mediconnect.in' });
    if (!existingPatient) {
      await User.create({ name: 'Rahul Verma', email: 'patient@mediconnect.in', password: 'Patient@123', role: 'patient', phone: '9876500001', gender: 'male' });
      console.log('✅ Patient created: patient@mediconnect.in / Patient@123');
    } else {
      console.log('ℹ️  Patient already exists');
    }

    // Doctors
    for (const docData of SAMPLE_DOCTORS) {
      const existing = await Doctor.findOne({ email: docData.email });
      if (!existing) {
        const doctor = await Doctor.create(docData);
        console.log(`✅ Doctor created: Dr. ${doctor.name} (${doctor.address.city})`);
        await generateSlotsForDays(doctor, 14);
        console.log(`   └─ 14 days of slots generated`);
      } else {
        console.log(`ℹ️  Doctor already exists: ${docData.name}`);
      }
    }

    console.log('\n🎉 Seed complete!\n');
    console.log('   Admin:   admin@mediconnect.in       / Admin@123');
    console.log('   Patient: patient@mediconnect.in     / Patient@123');
    console.log('   Doctor:  priya.sharma@mediconnect.in / Doctor@123');
    console.log('   (+ 4 more doctors)\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
};

seed();
