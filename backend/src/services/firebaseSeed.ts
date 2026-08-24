import bcrypt from 'bcryptjs';
import { firebaseService } from './firebaseService.ts';

export async function runFirebaseSeed() {
  console.log('🧹 Purging old Firestore collections...');

  const collections = [
    'users',
    'vehicles',
    'bookings',
    'repairLogs',
    'invoices',
    'feedback',
    'serviceCenters',
    'notifications',
    'marketplaceListings',
    'auditLogs'
  ];

  for (const colName of collections) {
    try {
      const items = await firebaseService.getCollection(colName);
      for (const item of items) {
        if (item.id) {
          await firebaseService.deleteDocument(colName, item.id);
        }
      }
      console.log(`  ✓ Cleared collection: ${colName}`);
    } catch (err) {
      console.warn(`  Warning clearing collection ${colName}:`, err);
    }
  }

  console.log('🌱 Seeding fresh primary accounts & standard data into Firebase Firestore...');
  const hashedPassword = await bcrypt.hash('Password123!', 10);
  const now = new Date().toISOString();

  // 1. Admin Account
  const adminUser = await firebaseService.createDocument(
    'users',
    {
      name: 'System Administrator',
      email: 'admin@fleetops.com',
      password: hashedPassword,
      role: 'ADMIN',
      phone: '+1-555-0100',
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now
    },
    'usr-admin-1'
  );

  // 2. Customer Account
  const customerUser = await firebaseService.createDocument(
    'users',
    {
      name: 'Jordan Miller',
      email: 'customer@fleetops.com',
      password: hashedPassword,
      role: 'CUSTOMER',
      phone: '+1-555-0199',
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now
    },
    'usr-customer-1'
  );

  // 3. Mechanic Account
  const mechanicUser = await firebaseService.createDocument(
    'users',
    {
      name: 'Alex Rivera',
      email: 'mechanic@fleetops.com',
      password: hashedPassword,
      role: 'MECHANIC',
      phone: '+1-555-0155',
      status: 'ACTIVE',
      availability: 'AVAILABLE',
      specialties: ['Engine Diagnostics', 'Brake Systems', 'EV Powertrain'],
      experienceYears: 8,
      createdAt: now,
      updatedAt: now
    },
    'usr-mech-1'
  );

  // 4. Initial Service Centers
  const serviceCenter1 = await firebaseService.createDocument(
    'serviceCenters',
    {
      name: 'Apex Fleet Auto Hub',
      address: '42 Industrial Parkway, Tech District',
      city: 'Delhi',
      latitude: 28.6315,
      longitude: 77.2167,
      phoneNumber: '+91 11 4500 9000',
      averageRating: 4.9,
      totalReviews: 84,
      totalServicesCompleted: 340,
      experienceYears: 12,
      isVerified: true,
      workingStatus: 'OPEN',
      availableMechanics: 4,
      specialties: ['Engine Diagnostics', 'Brake Systems', 'Periodic Maintenance'],
      imageUrl: 'https://images.unsplash.com/photo-1613214149922-f1809c99b414?w=800&auto=format&fit=crop&q=80',
      createdAt: now,
      updatedAt: now
    },
    'sc-apex-1'
  );

  // 5. Initial Customer Vehicle
  const sampleVehicle = await firebaseService.createDocument(
    'vehicles',
    {
      ownerId: customerUser.id,
      registrationNumber: 'DL-01-AX-9942',
      brand: 'Toyota',
      model: 'Camry Hybrid',
      year: 2024,
      vehicleType: 'Sedan',
      mileage: 28500,
      lastServiceMileage: 23500,
      nextMaintenanceMileage: 30000,
      serviceIntervalMonths: 6,
      serviceIntervalMileage: 5000,
      avgMonthlyMileage: 1200,
      lastServiceDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      nextServiceDueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      recurringReminderEnabled: true,
      reminderStatus: 'DUE_SOON',
      serviceReminderNotes: 'Periodic 30,000 km Scheduled Inspection',
      createdAt: now
    },
    'veh-sample-1'
  );

  // 6. Initial Active Booking
  const sampleBooking = await firebaseService.createDocument(
    'bookings',
    {
      vehicleId: sampleVehicle.id,
      customerId: customerUser.id,
      mechanicId: mechanicUser.id,
      assignedMechanicId: mechanicUser.id,
      assignedMechanicName: mechanicUser.name,
      serviceCenterId: serviceCenter1.id,
      serviceType: 'Periodic Maintenance & Brake Inspection',
      issueDescription: 'Routine 30k interval check and slight brake squeal',
      preferredDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'ASSIGNED',
      priority: 'NORMAL',
      progressPercentage: 25,
      createdAt: now,
      updatedAt: now
    },
    'bk-sample-1'
  );

  console.log(`✅ Fresh Firebase database initialized successfully!`);
  console.log(`   - Admin:    ${adminUser.email} (Password: Password123!)`);
  console.log(`   - Customer: ${customerUser.email} (Password: Password123!)`);
  console.log(`   - Mechanic: ${mechanicUser.email} (Password: Password123!)`);
}

runFirebaseSeed().catch((err) => {
  console.error('❌ Firebase seed error:', err);
});
