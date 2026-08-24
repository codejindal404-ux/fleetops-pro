import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DB_FILE = path.join(process.cwd(), 'dev.db.json');

function runSeed() {
  const passwordHash = bcrypt.hashSync('Password123!', 10);
  const now = new Date().toISOString();

  const users = [
    {
      id: 'usr-admin-1',
      name: 'System Administrator',
      email: 'admin@fleetops.com',
      password: passwordHash,
      phone: '+1-555-0100',
      role: 'ADMIN',
      createdAt: now,
      updatedAt: now
    }
  ];

  const vehicles: any[] = [];
  const bookings: any[] = [];
  const repairLogs: any[] = [];
  const invoices: any[] = [];
  const feedbacks: any[] = [];
  const auditLogs: any[] = [];
  const marketplaceListings: any[] = [];
  const marketplaceInquiries: any[] = [];
  const serviceCenters: any[] = [];
  const notifications: any[] = [];
  const chatMessages: any[] = [];
  const paymentTransactions: any[] = [];
  const loyaltyRecords: any[] = [];
  const customerPreferences: any[] = [];
  const servicesInventory: any[] = [];

  const data = {
    users,
    vehicles,
    bookings,
    repairLogs,
    invoices,
    feedbacks,
    auditLogs,
    marketplaceListings,
    marketplaceInquiries,
    serviceCenters,
    notifications,
    chatMessages,
    paymentTransactions,
    loyaltyRecords,
    customerPreferences,
    servicesInventory
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  console.log('✅ Database seeded with clean initial user accounts and no dummy data!');
}

runSeed();
