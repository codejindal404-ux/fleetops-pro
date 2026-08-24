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
    'repairImages',
    'mechanicPerformance',
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

  console.log('🌱 Seeding fresh primary Administrator account...');
  const hashedPassword = await bcrypt.hash('Password123!', 10);
  const now = new Date().toISOString();

  const adminUser = await firebaseService.createDocument(
    'users',
    {
      name: 'System Administrator',
      email: 'admin@fleetops.com',
      password: hashedPassword,
      role: 'ADMIN',
      phone: '+1-555-0100',
      address: 'FleetOps HQ, Tech Park',
      isSuspended: false,
      twoFactorEnabled: true,
      createdAt: now,
      updatedAt: now
    },
    'usr-admin-1'
  );

  console.log(`✅ Fresh Firebase database initialized! Primary Admin account created: ${adminUser.email}`);
}

runFirebaseSeed().catch((err) => {
  console.error('❌ Firebase seed error:', err);
});
