import express from 'express';
import http from 'http';
import cors from 'cors';
import { io as ClientIO } from 'socket.io-client';
import jwt from 'jsonwebtoken';
import { config } from '../backend/src/config/index.ts';
import { initSocketServer } from '../backend/src/services/socketService.ts';
import { firebaseService } from '../backend/src/services/firebaseService.ts';
import { dbStore } from '../backend/src/services/dbStore.ts';
import authRoutes from '../backend/src/routes/authRoutes.ts';
import bookingRoutes from '../backend/src/routes/bookingRoutes.ts';
import adminRoutes from '../backend/src/routes/adminRoutes.ts';
import mechanicRoutes from '../backend/src/routes/mechanicRoutes.ts';
import vehicleRoutes from '../backend/src/routes/vehicleRoutes.ts';
import customerRoutes from '../backend/src/routes/customerRoutes.ts';

const TEST_PORT = 3100;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

async function runEndToEndTest() {
  console.log('🚀 [E2E] Initializing Express & Socket test server on port', TEST_PORT);

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use('/api/auth', authRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/mechanic', mechanicRoutes);
  app.use('/api/vehicles', vehicleRoutes);
  app.use('/api/customer', customerRoutes);

  const server = http.createServer(app);
  initSocketServer(server);

  await new Promise<void>((resolve) => {
    server.listen(TEST_PORT, () => {
      console.log(`✅ [E2E] Test server listening on ${BASE_URL}`);
      resolve();
    });
  });

  try {
    // 1. Prepare Users: Customer, Admin, Mechanic 1, Mechanic 2
    console.log('\n--- Step 1: Login/Setup Test Users ---');
    
    // Ensure users exist in Firebase/dbStore
    let customerUser = await firebaseService.getUserByEmail('customer@fleetops.com');
    if (!customerUser) {
      customerUser = await firebaseService.createDocument('users', {
        name: 'Test Customer',
        email: 'customer@fleetops.com',
        role: 'CUSTOMER',
        phone: '+1234567890'
      }, 'usr_customer_e2e');
    }

    let adminUser = await firebaseService.getUserByEmail('admin@fleetops.com');
    if (!adminUser) {
      adminUser = await firebaseService.createDocument('users', {
        name: 'Fleet Admin',
        email: 'admin@fleetops.com',
        role: 'ADMIN',
        phone: '+1999999999'
      }, 'usr_admin_e2e');
    }

    let mechanic1 = await firebaseService.getUserByEmail('mechanic@fleetops.com');
    if (!mechanic1) {
      mechanic1 = await firebaseService.createDocument('users', {
        name: 'Alex Rivera (Master Tech)',
        email: 'mechanic@fleetops.com',
        role: 'MECHANIC',
        phone: '+1888888888'
      }, 'usr_mechanic1_e2e');
    }

    let mechanic2 = await firebaseService.getUserByEmail('mechanic2@fleetops.com');
    if (!mechanic2) {
      mechanic2 = await firebaseService.createDocument('users', {
        name: 'Jordan Lee (Junior Tech)',
        email: 'mechanic2@fleetops.com',
        role: 'MECHANIC',
        phone: '+1777777777'
      }, 'usr_mechanic2_e2e');
    }

    // Ensure they exist in dbStore as well for role lookups
    if (!dbStore.getUserById(customerUser.id)) {
      dbStore.createUser({ id: customerUser.id, name: customerUser.name, email: customerUser.email, role: 'CUSTOMER', password: 'hash' } as any);
    }
    if (!dbStore.getUserById(adminUser.id)) {
      dbStore.createUser({ id: adminUser.id, name: adminUser.name, email: adminUser.email, role: 'ADMIN', password: 'hash' } as any);
    }
    if (!dbStore.getUserById(mechanic1.id)) {
      dbStore.createUser({ id: mechanic1.id, name: mechanic1.name, email: mechanic1.email, role: 'MECHANIC', password: 'hash' } as any);
    }
    if (!dbStore.getUserById(mechanic2.id)) {
      dbStore.createUser({ id: mechanic2.id, name: mechanic2.name, email: mechanic2.email, role: 'MECHANIC', password: 'hash' } as any);
    }

    // Generate valid JWT tokens for all roles
    const customerToken = jwt.sign({ userId: customerUser.id, role: 'CUSTOMER', email: customerUser.email, name: customerUser.name }, config.jwtSecret);
    const adminToken = jwt.sign({ userId: adminUser.id, role: 'ADMIN', email: adminUser.email, name: adminUser.name }, config.jwtSecret);
    const mechanic1Token = jwt.sign({ userId: mechanic1.id, role: 'MECHANIC', email: mechanic1.email, name: mechanic1.name }, config.jwtSecret);
    const mechanic2Token = jwt.sign({ userId: mechanic2.id, role: 'MECHANIC', email: mechanic2.email, name: mechanic2.name }, config.jwtSecret);

    console.log(`✅ Customer: ${customerUser.name} (${customerUser.id})`);
    console.log(`✅ Admin: ${adminUser.name} (${adminUser.id})`);
    console.log(`✅ Assigned Mechanic: ${mechanic1.name} (${mechanic1.id})`);
    console.log(`✅ Unassigned Mechanic: ${mechanic2.name} (${mechanic2.id})`);

    // Ensure customer vehicle exists in Firestore
    let vehicle = (await firebaseService.getVehiclesByOwner(customerUser.id))[0];
    if (!vehicle) {
      const vehId = `veh_${Date.now()}`;
      vehicle = await firebaseService.createDocument('vehicles', {
        id: vehId,
        vehicleId: vehId,
        ownerId: customerUser.id,
        registrationNumber: 'E2E-TEST-99',
        company: 'Tesla',
        brand: 'Tesla',
        model: 'Model 3',
        vehicleType: 'Car',
        year: 2024
      }, vehId);
    }
    console.log(`✅ Test Vehicle: ${vehicle.brand} ${vehicle.model} (${vehicle.registrationNumber}) [${vehicle.id}]`);

    // 2. Connect Mechanic 1 via Socket.IO
    console.log('\n--- Step 2: Connect Mechanic 1 via Socket.IO Client ---');
    const socketClient = ClientIO(BASE_URL, {
      transports: ['websocket', 'polling'],
      auth: { token: mechanic1Token }
    });

    let receivedSocketEvents: any[] = [];
    socketClient.on('connect', () => {
      console.log('🔌 Mechanic 1 Socket connected with ID:', socketClient.id);
      socketClient.emit('register_user', { userId: mechanic1.id, role: 'MECHANIC' });
    });

    socketClient.on('status_updated', (data) => {
      console.log('⚡ Socket event [status_updated] received by Mechanic 1:', data);
      receivedSocketEvents.push({ event: 'status_updated', data });
    });

    socketClient.on('MECHANIC_ASSIGNED', (data) => {
      console.log('⚡ Socket event [MECHANIC_ASSIGNED] received by Mechanic 1:', data);
      receivedSocketEvents.push({ event: 'MECHANIC_ASSIGNED', data });
    });

    // Wait 500ms for socket handshake
    await new Promise((r) => setTimeout(r, 500));

    // 3. Customer Creates Booking
    console.log('\n--- Step 3: Customer Creates Booking via POST /api/bookings ---');
    const createRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        vehicleId: vehicle.id,
        serviceType: 'Brake Inspection & Fluid Flush',
        preferredDate: new Date().toISOString()
      })
    });

    const createData = await createRes.json();
    if (!createRes.ok || !createData.booking) {
      throw new Error(`Failed to create booking: ${JSON.stringify(createData)}`);
    }

    const bookingId = createData.booking.id;
    console.log(`✅ Booking Created successfully: ${bookingId}`);
    console.log(`   Initial Status: ${createData.booking.status}`);
    console.log(`   Initial Mechanic ID: ${createData.booking.mechanicId}`);

    // Verify booking is in Firestore
    const firestoreBookingInitial = await firebaseService.getDocument<any>('bookings', bookingId);
    if (!firestoreBookingInitial) {
      throw new Error(`Booking ${bookingId} was not found in Firestore after creation!`);
    }
    console.log(`✅ Verified in Firestore: status = "${firestoreBookingInitial.status}"`);

    // 4. Admin Approves Booking
    console.log('\n--- Step 4: Admin Approves Booking via PATCH /api/admin/bookings/:id/approve ---');
    const approveRes = await fetch(`${BASE_URL}/api/admin/bookings/${bookingId}/approve`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });

    const approveData = await approveRes.json();
    if (!approveRes.ok) {
      throw new Error(`Failed to approve booking: ${JSON.stringify(approveData)}`);
    }
    console.log(`✅ Booking Approved successfully. Response:`, approveData.message);

    // Verify Firestore status is APPROVED
    const firestoreBookingApproved = await firebaseService.getDocument<any>('bookings', bookingId);
    if (firestoreBookingApproved.status !== 'APPROVED') {
      throw new Error(`Expected Firestore status 'APPROVED', but got '${firestoreBookingApproved.status}'`);
    }
    console.log(`✅ Verified in Firestore: status = "${firestoreBookingApproved.status}"`);

    // 5. Admin Assigns Mechanic 1
    console.log(`\n--- Step 5: Admin Assigns Mechanic 1 (${mechanic1.name}) via PATCH /api/admin/bookings/:id/assign ---`);
    const assignRes = await fetch(`${BASE_URL}/api/admin/bookings/${bookingId}/assign`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        mechanicId: mechanic1.id
      })
    });

    const assignData = await assignRes.json();
    if (!assignRes.ok) {
      throw new Error(`Failed to assign mechanic: ${JSON.stringify(assignData)}`);
    }
    console.log(`✅ Mechanic Assigned successfully. Response:`, assignData.message);

    // Wait 500ms for Socket.IO event propagation
    await new Promise((r) => setTimeout(r, 600));

    // 6. Verify Exact Firestore Fields
    console.log('\n--- Step 6: Verify Exact Firestore Fields After Assignment ---');
    const firestoreBookingAssigned = await firebaseService.getDocument<any>('bookings', bookingId);
    console.log('Firestore Record:', JSON.stringify(firestoreBookingAssigned, null, 2));

    if (firestoreBookingAssigned.status !== 'ASSIGNED') {
      throw new Error(`Validation Failed: status is '${firestoreBookingAssigned.status}', expected 'ASSIGNED'`);
    }
    if (firestoreBookingAssigned.mechanicId !== mechanic1.id) {
      throw new Error(`Validation Failed: mechanicId is '${firestoreBookingAssigned.mechanicId}', expected '${mechanic1.id}'`);
    }
    if (firestoreBookingAssigned.assignedMechanicId !== mechanic1.id) {
      throw new Error(`Validation Failed: assignedMechanicId is '${firestoreBookingAssigned.assignedMechanicId}', expected '${mechanic1.id}'`);
    }
    if (firestoreBookingAssigned.assignedMechanicName !== mechanic1.name) {
      throw new Error(`Validation Failed: assignedMechanicName is '${firestoreBookingAssigned.assignedMechanicName}', expected '${mechanic1.name}'`);
    }
    console.log('✅ ALL FIRESTORE FIELDS VERIFIED:');
    console.log(`   - status = "${firestoreBookingAssigned.status}"`);
    console.log(`   - mechanicId = "${firestoreBookingAssigned.mechanicId}"`);
    console.log(`   - assignedMechanicId = "${firestoreBookingAssigned.assignedMechanicId}"`);
    console.log(`   - assignedMechanicName = "${firestoreBookingAssigned.assignedMechanicName}"`);

    // 7. Verify Socket.IO Event Received by Mechanic 1
    const statusUpdateEvent = receivedSocketEvents
      .filter((e) => e.event === 'status_updated' && e.data.bookingId === bookingId && e.data.status === 'ASSIGNED')
      .pop();
    if (!statusUpdateEvent) {
      throw new Error(`Expected real-time status_updated event with status 'ASSIGNED', but was not received! (Total events: ${receivedSocketEvents.length})`);
    }
    console.log('✅ Socket.IO status_updated event verified:', statusUpdateEvent.data);
    if (statusUpdateEvent.data.status !== 'ASSIGNED' || statusUpdateEvent.data.mechanicId !== mechanic1.id) {
      throw new Error(`Socket event validation failed: ${JSON.stringify(statusUpdateEvent.data)}`);
    }

    // 8. Verify Assigned Mechanic: GET /api/bookings
    console.log('\n--- Step 8: Verify Assigned Mechanic Calls GET /api/bookings ---');
    const mechBookingsRes = await fetch(`${BASE_URL}/api/bookings`, {
      headers: { Authorization: `Bearer ${mechanic1Token}` }
    });
    const mechBookingsData = await mechBookingsRes.json();
    const foundInBookings = (mechBookingsData.bookings || []).find((b: any) => b.id === bookingId);
    if (!foundInBookings) {
      throw new Error(`Assigned booking ${bookingId} was NOT found in GET /api/bookings for Mechanic 1!`);
    }
    console.log(`✅ GET /api/bookings returned assigned booking #${bookingId.slice(-6)} (Status: ${foundInBookings.status})`);

    // 9. Verify Assigned Mechanic: GET /api/mechanic/jobs
    console.log('\n--- Step 9: Verify Assigned Mechanic Calls GET /api/mechanic/jobs ---');
    const mechJobsRes = await fetch(`${BASE_URL}/api/mechanic/jobs`, {
      headers: { Authorization: `Bearer ${mechanic1Token}` }
    });
    const mechJobsData = await mechJobsRes.json();
    const foundInJobs = (mechJobsData.jobs || []).find((j: any) => j.id === bookingId);
    if (!foundInJobs) {
      throw new Error(`Assigned booking ${bookingId} was NOT found in GET /api/mechanic/jobs for Mechanic 1!`);
    }
    console.log(`✅ GET /api/mechanic/jobs returned assigned job #${bookingId.slice(-6)}`);
    console.log(`   Vehicle Name: ${foundInJobs.vehicleName}`);
    console.log(`   Customer Name: ${foundInJobs.customerName}`);
    console.log(`   Assigned Mechanic: ${foundInJobs.assignedMechanicName}`);
    console.log(`   Status: ${foundInJobs.status}`);

    // 10. Verify Unassigned Mechanic (Mechanic 2) does NOT see the booking
    console.log('\n--- Step 10: Verify Unassigned Mechanic (Mechanic 2) Does NOT See the Booking ---');
    const unassignedBookingsRes = await fetch(`${BASE_URL}/api/bookings`, {
      headers: { Authorization: `Bearer ${mechanic2Token}` }
    });
    const unassignedBookingsData = await unassignedBookingsRes.json();
    const shouldNotExist1 = (unassignedBookingsData.bookings || []).find((b: any) => b.id === bookingId);
    if (shouldNotExist1) {
      throw new Error(`SECURITY BUG: Unassigned Mechanic 2 can see booking ${bookingId} in GET /api/bookings!`);
    }
    console.log('✅ Confirmed: Unassigned Mechanic 2 cannot see booking in GET /api/bookings');

    const unassignedJobsRes = await fetch(`${BASE_URL}/api/mechanic/jobs`, {
      headers: { Authorization: `Bearer ${mechanic2Token}` }
    });
    const unassignedJobsData = await unassignedJobsRes.json();
    const shouldNotExist2 = (unassignedJobsData.jobs || []).find((j: any) => j.id === bookingId);
    if (shouldNotExist2) {
      throw new Error(`SECURITY BUG: Unassigned Mechanic 2 can see booking ${bookingId} in GET /api/mechanic/jobs!`);
    }
    console.log('✅ Confirmed: Unassigned Mechanic 2 cannot see booking in GET /api/mechanic/jobs');

    socketClient.disconnect();
    console.log('\n🎉 =======================================================');
    console.log('🎉 ALL END-TO-END WORKFLOW VERIFICATION CHECKS PASSED 100%!');
    console.log('🎉 =======================================================\n');
  } finally {
    server.close();
  }
}

runEndToEndTest().catch((err) => {
  console.error('❌ E2E TEST FAILED:', err);
  process.exit(1);
});
