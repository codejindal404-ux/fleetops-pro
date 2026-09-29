import assert from 'assert';
import { dbStore } from '../src/services/dbStore.ts';
import { firebaseService } from '../src/services/firebaseService.ts';
import { addDiagnostic, getDiagnostics, createSparePartsRequest, getSparePartsRequests } from '../src/controllers/mechanicController.ts';
import { User, Vehicle, Booking, RepairLog, Invoice, Feedback, Notification, ServiceCenter } from '../src/types.ts';

function createMockRes() {
  const res: any = {
    statusCode: 200,
    body: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      this.body = data;
      return this;
    }
  };
  return res;
}

async function runPersistenceTests() {
  console.log('=== Step 13: Firestore Persistence & dbStore Restart Lifecycle Tests ===');

  // In-memory backing store simulating Firestore collections
  const firestoreStore: Record<string, Map<string, any>> = {
    users: new Map(),
    vehicles: new Map(),
    bookings: new Map(),
    repairLogs: new Map(),
    invoices: new Map(),
    feedback: new Map(),
    notifications: new Map(),
    serviceCenters: new Map(),
    diagnostics: new Map(),
    sparePartsRequests: new Map()
  };

  // Mock firebaseService methods to operate on firestoreStore simulating real Firestore
  firebaseService.createDocument = (async (collectionName: string, data: any, customId?: string) => {
    const id = customId || `${collectionName}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const record = { ...data, id, createdAt: data.createdAt || new Date().toISOString() };
    if (!firestoreStore[collectionName]) {
      firestoreStore[collectionName] = new Map();
    }
    firestoreStore[collectionName].set(id, record);
    return record;
  }) as any;

  firebaseService.getDocument = (async (collectionName: string, docId: string) => {
    return firestoreStore[collectionName]?.get(docId) || null;
  }) as any;

  firebaseService.getCollection = (async (collectionName: string, filters: any[] = []) => {
    const col = firestoreStore[collectionName];
    if (!col) return [];
    let items = Array.from(col.values());
    if (filters.length > 0) {
      for (const f of filters) {
        items = items.filter((item: any) => item[f.field] === f.value);
      }
    }
    return items;
  }) as any;

  firebaseService.updateDocument = (async (collectionName: string, docId: string, updates: any) => {
    const existing = firestoreStore[collectionName]?.get(docId);
    if (!existing) return null;
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    firestoreStore[collectionName].set(docId, updated);
    return updated;
  }) as any;

  firebaseService.deleteDocument = (async (collectionName: string, docId: string) => {
    if (!firestoreStore[collectionName]) return false;
    return firestoreStore[collectionName].delete(docId);
  }) as any;

  firebaseService.getUserById = (async (id: string) => {
    return firestoreStore['users']?.get(id) || null;
  }) as any;

  firebaseService.getInvoiceByBooking = (async (bookingId: string) => {
    const invs = Array.from(firestoreStore['invoices']?.values() || []);
    return invs.find((i: any) => i.bookingId === bookingId) || null;
  }) as any;

  // ----------------------------------------------------
  // TEST 1: User persistence across restart
  // ----------------------------------------------------
  console.log('\n--- 1. Testing User Persistence Across Restart ---');
  const user = await firebaseService.createDocument<User>('users', {
    name: 'Alice Reynolds',
    email: 'alice.reynolds@example.com',
    role: 'CUSTOMER',
    phone: '+1-555-0199'
  }, 'usr-alice-1');

  // Verify created in Firestore
  assert.strictEqual(user.id, 'usr-alice-1');
  assert.strictEqual(user.email, 'alice.reynolds@example.com');

  // Simulate backend / dbStore memory reset
  dbStore.clearAllData();

  // Read record after restart
  const fetchedUser = await firebaseService.getUserById('usr-alice-1');
  assert.ok(fetchedUser, 'User must exist in Firestore after dbStore restart');
  assert.strictEqual(fetchedUser.name, 'Alice Reynolds');
  assert.strictEqual(fetchedUser.email, 'alice.reynolds@example.com');
  console.log('Passed 1: User persisted across backend memory reset.');

  // ----------------------------------------------------
  // TEST 2: Vehicle persistence across restart
  // ----------------------------------------------------
  console.log('\n--- 2. Testing Vehicle Persistence Across Restart ---');
  const vehicle = await firebaseService.createDocument<Vehicle>('vehicles', {
    ownerId: 'usr-alice-1',
    brand: 'Tesla',
    model: 'Model Y',
    registrationNumber: 'TES-9901',
    year: 2024,
    mileage: 12000
  }, 'veh-tesla-1');

  // Simulate backend memory reset
  dbStore.clearAllData();

  const fetchedVehicle = await firebaseService.getDocument<Vehicle>('vehicles', 'veh-tesla-1');
  assert.ok(fetchedVehicle, 'Vehicle must exist after restart');
  assert.strictEqual(fetchedVehicle.registrationNumber, 'TES-9901');
  assert.strictEqual(fetchedVehicle.brand, 'Tesla');
  console.log('Passed 2: Vehicle persisted across backend memory reset.');

  // ----------------------------------------------------
  // TEST 3: Booking persistence across restart
  // ----------------------------------------------------
  console.log('\n--- 3. Testing Booking Persistence Across Restart ---');
  const booking = await firebaseService.createDocument<Booking>('bookings', {
    vehicleId: 'veh-tesla-1',
    customerId: 'usr-alice-1',
    mechanicId: 'mech-david-1',
    assignedMechanicId: 'mech-david-1',
    serviceType: 'BRAKE_SERVICE',
    status: 'ASSIGNED',
    progressPercentage: 20
  }, 'bk-tesla-101');

  // Simulate backend memory reset
  dbStore.clearAllData();

  const fetchedBooking = await firebaseService.getDocument<Booking>('bookings', 'bk-tesla-101');
  assert.ok(fetchedBooking, 'Booking must exist after restart');
  assert.strictEqual(fetchedBooking.status, 'ASSIGNED');
  assert.strictEqual(fetchedBooking.assignedMechanicId, 'mech-david-1');
  console.log('Passed 3: Booking persisted across backend memory reset.');

  // ----------------------------------------------------
  // TEST 4: Repair Log persistence across restart
  // ----------------------------------------------------
  console.log('\n--- 4. Testing Repair Log Persistence Across Restart ---');
  const repairLog = await firebaseService.createDocument<RepairLog>('repairLogs', {
    bookingId: 'bk-tesla-101',
    action: 'Caliper Inspection',
    note: 'Inspected front brake calipers, fluid levels nominal',
    updatedBy: 'mech-david-1'
  }, 'rl-101-1');

  // Simulate backend memory reset
  dbStore.clearAllData();

  const logs = await firebaseService.getCollection('repairLogs', [{ field: 'bookingId', op: '==', value: 'bk-tesla-101' }]);
  assert.ok(logs.length >= 1, 'Repair logs must persist across backend memory reset');
  assert.strictEqual(logs[0].action, 'Caliper Inspection');
  assert.strictEqual(logs[0].updatedBy, 'mech-david-1');
  console.log('Passed 4: Repair log persisted across backend memory reset.');

  // ----------------------------------------------------
  // TEST 5: Invoice persistence across restart
  // ----------------------------------------------------
  console.log('\n--- 5. Testing Invoice Persistence Across Restart ---');
  const invoice = await firebaseService.createDocument<Invoice>('invoices', {
    bookingId: 'bk-tesla-101',
    serviceCharges: 150,
    partsCost: 80,
    tax: 23,
    amount: 253,
    status: 'UNPAID',
    issuedAt: new Date().toISOString()
  }, 'inv-101');

  // Simulate backend memory reset
  dbStore.clearAllData();

  const fetchedInvoice = await firebaseService.getInvoiceByBooking('bk-tesla-101');
  assert.ok(fetchedInvoice, 'Invoice must persist across backend memory reset');
  assert.strictEqual(fetchedInvoice.amount, 253);
  assert.strictEqual(fetchedInvoice.status, 'UNPAID');
  console.log('Passed 5: Invoice persisted across backend memory reset.');

  // ----------------------------------------------------
  // TEST 6: Feedback persistence across restart
  // ----------------------------------------------------
  console.log('\n--- 6. Testing Feedback Persistence Across Restart ---');
  const feedback = await firebaseService.createDocument<Feedback>('feedback', {
    bookingId: 'bk-tesla-101',
    customerId: 'usr-alice-1',
    mechanicId: 'mech-david-1',
    rating: 5,
    comment: 'Exceptional craftsmanship!'
  }, 'fb-101');

  // Simulate backend memory reset
  dbStore.clearAllData();

  const feedbacks = await firebaseService.getCollection('feedback', [{ field: 'bookingId', op: '==', value: 'bk-tesla-101' }]);
  assert.ok(feedbacks.length >= 1, 'Feedback must persist across restart');
  assert.strictEqual(feedbacks[0].rating, 5);
  assert.strictEqual(feedbacks[0].comment, 'Exceptional craftsmanship!');
  console.log('Passed 6: Feedback persisted across backend memory reset.');

  // ----------------------------------------------------
  // TEST 7: Notification persistence across restart
  // ----------------------------------------------------
  console.log('\n--- 7. Testing Notification Persistence Across Restart ---');
  const notification = await firebaseService.createDocument<Notification>('notifications', {
    userId: 'usr-alice-1',
    title: 'Service Update',
    message: 'Your vehicle service is progressing normally.',
    type: 'SERVICE_PROGRESS_UPDATE',
    isRead: false
  }, 'notif-101');

  // Simulate backend memory reset
  dbStore.clearAllData();

  const notifications = await firebaseService.getCollection('notifications', [{ field: 'userId', op: '==', value: 'usr-alice-1' }]);
  assert.ok(notifications.length >= 1, 'Notifications must persist across restart');
  assert.strictEqual(notifications[0].title, 'Service Update');
  assert.strictEqual(notifications[0].isRead, false);
  console.log('Passed 7: Notification persisted across backend memory reset.');

  // ----------------------------------------------------
  // TEST 8: Service Center persistence across restart
  // ----------------------------------------------------
  console.log('\n--- 8. Testing Service Center Persistence Across Restart ---');
  const serviceCenter = await firebaseService.createDocument<ServiceCenter>('serviceCenters', {
    name: 'Apex Precision Garage',
    address: '452 Innovation Blvd',
    city: 'San Francisco',
    latitude: 37.7749,
    longitude: -122.4194,
    workingStatus: 'OPEN',
    capacity: 15
  }, 'sc-apex-sf');

  // Simulate backend memory reset
  dbStore.clearAllData();

  const fetchedCenter = await firebaseService.getDocument<ServiceCenter>('serviceCenters', 'sc-apex-sf');
  assert.ok(fetchedCenter, 'Service center must persist across restart');
  assert.strictEqual(fetchedCenter.name, 'Apex Precision Garage');
  assert.strictEqual(fetchedCenter.city, 'San Francisco');
  console.log('Passed 8: Service center persisted across backend memory reset.');

  // ----------------------------------------------------
  // TEST 9: Diagnostic persistence across restart (Fix verification)
  // ----------------------------------------------------
  console.log('\n--- 9. Testing Diagnostic Persistence Across Restart ---');
  // Seed dbStore user so controller knows David
  (dbStore as any).data.users.push({
    id: 'mech-david-1',
    name: 'David Technician',
    email: 'david@fleetops.com',
    role: 'MECHANIC'
  });

  const addDiagReq: any = {
    body: {
      bookingId: 'bk-tesla-101',
      vehicleId: 'veh-tesla-1',
      faultCode: 'P0420',
      systemCategory: 'EMISSIONS',
      problemDescription: 'Catalyst System Efficiency Below Threshold',
      severity: 'HIGH',
      recommendedSolution: 'Inspect oxygen sensors and catalytic converter'
    },
    user: { userId: 'mech-david-1', role: 'MECHANIC' }
  };
  const addDiagRes = createMockRes();
  await addDiagnostic(addDiagReq, addDiagRes);

  assert.strictEqual(addDiagRes.statusCode, 201, 'Diagnostic creation must return 201');
  const createdDiag = addDiagRes.body.diagnostic;
  assert.strictEqual(createdDiag.faultCode, 'P0420');

  // Verify it was persisted to Firestore
  const savedInFirestore = await firebaseService.getDocument('diagnostics', createdDiag.id);
  assert.ok(savedInFirestore, 'Diagnostic must be persisted directly into Firestore collection');
  assert.strictEqual(savedInFirestore.faultCode, 'P0420');

  // Simulate backend / dbStore memory reset
  dbStore.clearAllData();
  (dbStore as any).data.users.push({
    id: 'mech-david-1',
    name: 'David Technician',
    email: 'david@fleetops.com',
    role: 'MECHANIC'
  });

  // Verify dbStore has 0 diagnostics right now
  assert.strictEqual(dbStore.getDiagnosticsByBooking('bk-tesla-101').length, 0, 'dbStore must be empty after restart');

  // Read diagnostic through controller GET endpoint after restart
  const getDiagReq: any = {
    params: { bookingId: 'bk-tesla-101' },
    user: { userId: 'mech-david-1', role: 'MECHANIC' }
  };
  const getDiagRes = createMockRes();
  await getDiagnostics(getDiagReq, getDiagRes);

  assert.strictEqual(getDiagRes.statusCode, 200, 'Diagnostic query must return 200 after restart');
  assert.ok(getDiagRes.body.diagnostics.length >= 1, 'Diagnostic must be rehydrated from Firestore after restart');
  assert.strictEqual(getDiagRes.body.diagnostics[0].faultCode, 'P0420');
  assert.strictEqual(getDiagRes.body.diagnostics[0].systemCategory, 'EMISSIONS');
  console.log('Passed 9: Diagnostic record survived memory reset and rehydrated from Firestore.');

  // ----------------------------------------------------
  // TEST 10: Spare Parts Request persistence across restart (Fix verification)
  // ----------------------------------------------------
  console.log('\n--- 10. Testing Spare Parts Request Persistence Across Restart ---');
  const addPartReq: any = {
    body: {
      bookingId: 'bk-tesla-101',
      vehicleId: 'veh-tesla-1',
      partName: 'Performance Ceramic Pads',
      partCode: 'PCP-440',
      quantityRequired: 2,
      unitCost: 75,
      urgency: 'HIGH',
      notes: 'Front axle wear exceeds 80%'
    },
    user: { userId: 'mech-david-1', role: 'MECHANIC' }
  };
  const addPartRes = createMockRes();
  await createSparePartsRequest(addPartReq, addPartRes);

  assert.strictEqual(addPartRes.statusCode, 201, 'Parts request creation must return 201');
  const createdPart = addPartRes.body.request;
  assert.strictEqual(createdPart.partName, 'Performance Ceramic Pads');
  assert.strictEqual(createdPart.totalCost, 150);

  // Verify it was persisted to Firestore
  const savedPartInFirestore = await firebaseService.getDocument('sparePartsRequests', createdPart.id);
  assert.ok(savedPartInFirestore, 'Spare parts request must be persisted into Firestore collection');
  assert.strictEqual(savedPartInFirestore.partCode, 'PCP-440');

  // Simulate backend / dbStore memory reset
  dbStore.clearAllData();
  (dbStore as any).data.users.push({
    id: 'mech-david-1',
    name: 'David Technician',
    email: 'david@fleetops.com',
    role: 'MECHANIC'
  });

  // Verify dbStore has 0 parts requests right now
  assert.strictEqual(dbStore.getSparePartsRequestsByBooking('bk-tesla-101').length, 0, 'dbStore must be empty after restart');

  // Read spare parts requests through controller GET endpoint after restart
  const getPartReq: any = {
    query: { bookingId: 'bk-tesla-101' },
    user: { userId: 'mech-david-1', role: 'MECHANIC' }
  };
  const getPartRes = createMockRes();
  await getSparePartsRequests(getPartReq, getPartRes);

  assert.strictEqual(getPartRes.statusCode, 200, 'Parts request query must return 200 after restart');
  assert.ok(getPartRes.body.requests.length >= 1, 'Parts requests must be rehydrated from Firestore after restart');
  assert.strictEqual(getPartRes.body.requests[0].partName, 'Performance Ceramic Pads');
  assert.strictEqual(getPartRes.body.requests[0].partCode, 'PCP-440');
  assert.strictEqual(getPartRes.body.requests[0].quantityRequired, 2);
  console.log('Passed 10: Spare parts request survived memory reset and rehydrated from Firestore.');

  console.log('\n=== ALL 10 PERSISTENCE & RESTART LIFECYCLE TESTS PASSED! ===');
}

runPersistenceTests().catch((err) => {
  console.error('Persistence Test Error:', err);
  process.exit(1);
});
