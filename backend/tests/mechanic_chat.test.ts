import assert from 'assert';
import { sendChatMessage, getChatMessages } from '../src/controllers/mechanicController.ts';
import { updateBookingStatus } from '../src/controllers/bookingController.ts';
import { firebaseService } from '../src/services/firebaseService.ts';
import { dbStore } from '../src/services/dbStore.ts';

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

async function runMechanicChatTests() {
  console.log('--- Starting Mechanic Chat Firestore & Security Tests ---');

  // Firestore mock data
  const firestoreStorage: Record<string, Record<string, any>> = {
    bookings: {
      'fs-bk-assigned-A': {
        id: 'fs-bk-assigned-A',
        vehicleId: 'veh-1',
        customerId: 'cust-1',
        status: 'INSPECTION',
        mechanicId: 'mech-A',
        assignedMechanicId: 'mech-A'
      },
      'fs-bk-unassigned': {
        id: 'fs-bk-unassigned',
        vehicleId: 'veh-2',
        customerId: 'cust-2',
        status: 'PENDING',
        mechanicId: null,
        assignedMechanicId: null
      },
      'fs-bk-customer-only': {
        id: 'fs-bk-customer-only',
        vehicleId: 'veh-3',
        customerId: 'cust-3',
        status: 'APPROVED',
        mechanicId: null,
        assignedMechanicId: null
      }
    },
    users: {
      'mech-A': {
        id: 'mech-A',
        name: 'Technician Alex',
        email: 'alex@fleetops.com',
        role: 'MECHANIC'
      },
      'mech-B': {
        id: 'mech-B',
        name: 'Technician Jordan',
        email: 'jordan@fleetops.com',
        role: 'MECHANIC'
      }
    },
    chatMessages: {}
  };

  // Seed one booking strictly in dbStore for Test 2
  const inMemoryBooking = dbStore.createBooking({
    customerId: 'cust-in-memory',
    vehicleId: 'veh-in-memory',
    serviceCenterId: 'sc-1',
    serviceType: 'Brake Service',
    preferredDate: new Date().toISOString()
  });
  // Assign to mech-A in dbStore
  dbStore.updateBookingStatus(inMemoryBooking.id, 'ASSIGNED', 'mech-A', 'Technician Alex');

  const origGetDocument = firebaseService.getDocument;
  const origCreateDocument = firebaseService.createDocument;
  const origGetUserById = firebaseService.getUserById;
  const origUpdateDocument = firebaseService.updateDocument;

  firebaseService.getDocument = (async (col: string, id: string) => {
    return firestoreStorage[col]?.[id] || null;
  }) as any;

  firebaseService.createDocument = (async (col: string, data: any, customId?: string) => {
    const id = customId || `chat-${Date.now()}`;
    if (!firestoreStorage[col]) firestoreStorage[col] = {};
    firestoreStorage[col][id] = { id, ...data };
    return firestoreStorage[col][id];
  }) as any;

  firebaseService.getUserById = (async (id: string) => {
    return firestoreStorage.users[id] || null;
  }) as any;

  firebaseService.updateDocument = (async (col: string, id: string, updates: any) => {
    if (firestoreStorage[col] && firestoreStorage[col][id]) {
      firestoreStorage[col][id] = { ...firestoreStorage[col][id], ...updates };
      return firestoreStorage[col][id];
    }
    return null;
  }) as any;

  try {
    // --- Test 1 — Firestore assigned booking ---
    // Mechanic A sends a message for a booking that exists only in Firestore and is assigned to Mechanic A.
    {
      const req: any = {
        params: { bookingId: 'fs-bk-assigned-A' },
        body: { message: 'We have started initial diagnostic checks on your vehicle.' },
        user: { userId: 'mech-A', role: 'MECHANIC' }
      };
      const res = createMockRes();
      await sendChatMessage(req, res);
      assert.strictEqual(res.statusCode, 200, 'Test 1 Failed: Status should be 200 OK');
      assert.ok(res.body && res.body.chatMessage, 'Chat message should be returned in body');
      assert.strictEqual(res.body.chatMessage.bookingId, 'fs-bk-assigned-A');
      assert.strictEqual(res.body.chatMessage.senderId, 'mech-A');
      console.log('Test 1 Passed: Firestore assigned booking chat send => 200 OK');
    }

    // --- Test 2 — dbStore booking ---
    // Existing seeded/in-memory chat behavior works.
    {
      const req: any = {
        params: { bookingId: inMemoryBooking.id },
        body: { message: 'Hello from workshop regarding in-memory booking.' },
        user: { userId: 'mech-A', role: 'MECHANIC' }
      };
      const res = createMockRes();
      await sendChatMessage(req, res);
      assert.strictEqual(res.statusCode, 200, 'Test 2 Failed: Status should be 200 OK');
      assert.ok(res.body && res.body.chatMessage);
      console.log('Test 2 Passed: dbStore in-memory booking chat send => 200 OK');
    }

    // --- Test 3 — Wrong mechanic ---
    // Mechanic B sends a message for Mechanic A's booking.
    {
      const req: any = {
        params: { bookingId: 'fs-bk-assigned-A' },
        body: { message: 'Attempting unauthorized cross-technician message.' },
        user: { userId: 'mech-B', role: 'MECHANIC' }
      };
      const res = createMockRes();
      await sendChatMessage(req, res);
      assert.strictEqual(res.statusCode, 403, 'Test 3 Failed: Wrong mechanic must receive 403 Forbidden');
      console.log('Test 3 Passed: Wrong mechanic rejected => 403 Forbidden');
    }

    // --- Test 4 — Unassigned booking ---
    // Mechanic A sends a message for a booking with no mechanic assignment.
    {
      const req: any = {
        params: { bookingId: 'fs-bk-unassigned' },
        body: { message: 'Attempting to chat on unassigned booking.' },
        user: { userId: 'mech-A', role: 'MECHANIC' }
      };
      const res = createMockRes();
      await sendChatMessage(req, res);
      assert.strictEqual(res.statusCode, 403, 'Test 4 Failed: Unassigned booking chat must receive 403 Forbidden');
      console.log('Test 4 Passed: Unassigned booking chat rejected => 403 Forbidden');
    }

    // --- Test 5 — Random booking ID ---
    // Mechanic attempts to use another customer booking ID (random / not assigned).
    {
      const req: any = {
        params: { bookingId: 'fs-bk-customer-only' },
        body: { message: 'Message to random customer booking.' },
        user: { userId: 'mech-A', role: 'MECHANIC' }
      };
      const res = createMockRes();
      await sendChatMessage(req, res);
      assert.strictEqual(res.statusCode, 403, 'Test 5 Failed: Random customer booking chat must receive 403 Forbidden');
      console.log('Test 5 Passed: Random customer booking ID rejected => 403 Forbidden');
    }

    // --- Test 6 — Non-existent booking ---
    // Mechanic sends a message with an invalid booking ID.
    {
      const req: any = {
        params: { bookingId: 'non-existent-booking-999' },
        body: { message: 'Message on non-existent booking.' },
        user: { userId: 'mech-A', role: 'MECHANIC' }
      };
      const res = createMockRes();
      await sendChatMessage(req, res);
      assert.strictEqual(res.statusCode, 404, 'Test 6 Failed: Non-existent booking should return 404');
      console.log('Test 6 Passed: Non-existent booking rejected => 404 Booking not found');
    }

    // --- Test 7 — Message validation ---
    // Invalid/empty message should return 400 Bad Request.
    {
      const req: any = {
        params: { bookingId: 'fs-bk-assigned-A' },
        body: { message: '   ' },
        user: { userId: 'mech-A', role: 'MECHANIC' }
      };
      const res = createMockRes();
      await sendChatMessage(req, res);
      assert.strictEqual(res.statusCode, 400, 'Test 7 Failed: Empty message should return 400');
      console.log('Test 7 Passed: Empty message rejected => 400 Bad Request');
    }

    // --- Test 8 — Security regression ---
    // Verify previous security protections still work:
    // a) Wrong mechanic cannot update status
    {
      const req: any = {
        params: { id: 'fs-bk-assigned-A' },
        body: { status: 'REPAIRING' },
        user: { userId: 'mech-B', role: 'MECHANIC' }
      };
      const res = createMockRes();
      await updateBookingStatus(req, res);
      assert.strictEqual(res.statusCode, 403, 'Test 8a Failed: Wrong mechanic status update must be 403');
    }

    // b) Mechanic cannot approve PENDING -> APPROVED
    {
      const req: any = {
        params: { id: 'fs-bk-unassigned' },
        body: { status: 'APPROVED' },
        user: { userId: 'mech-A', role: 'MECHANIC' }
      };
      const res = createMockRes();
      await updateBookingStatus(req, res);
      assert.strictEqual(res.statusCode, 403, 'Test 8b Failed: Mechanic PENDING -> APPROVED must be 403');
    }

    // c) Mechanic cannot assign APPROVED -> ASSIGNED
    {
      const req: any = {
        params: { id: 'fs-bk-customer-only' },
        body: { status: 'ASSIGNED' },
        user: { userId: 'mech-A', role: 'MECHANIC' }
      };
      const res = createMockRes();
      await updateBookingStatus(req, res);
      assert.strictEqual(res.statusCode, 403, 'Test 8c Failed: Mechanic APPROVED -> ASSIGNED must be 403');
    }

    console.log('Test 8 Passed: Security regressions verified (Ownership & Status transition locks hold)');

    console.log('\n--- ALL MECHANIC CHAT TESTS PASSED! ---');
  } finally {
    firebaseService.getDocument = origGetDocument;
    firebaseService.createDocument = origCreateDocument;
    firebaseService.getUserById = origGetUserById;
    firebaseService.updateDocument = origUpdateDocument;
  }
}

runMechanicChatTests().catch((err) => {
  console.error('Chat test run failed:', err);
  process.exit(1);
});
