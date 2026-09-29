import assert from 'assert';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { io as ClientSocket, Socket as ClientSocketType } from 'socket.io-client';
import { updateJobStatus } from '../src/controllers/mechanicController.ts';
import { assignMechanic, updateBookingStatus } from '../src/controllers/bookingController.ts';
import { firebaseService } from '../src/services/firebaseService.ts';
import { dbStore } from '../src/services/dbStore.ts';
import * as socketServiceModule from '../src/services/socketService.ts';

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

async function runSocketStatusEventsTests() {
  console.log('--- Starting Standardized Socket.IO Booking Status Events Tests ---');

  // Setup real in-memory HTTP and Socket.IO server on an ephemeral port
  const httpServer = http.createServer();
  const ioServer = socketServiceModule.initSocketServer(httpServer);

  await new Promise<void>((resolve) => httpServer.listen(0, () => resolve()));
  const port = (httpServer.address() as any).port;
  const socketUrl = `http://localhost:${port}`;

  // Mock document database
  const mockBookings: Record<string, any> = {
    'bk-soc-1': {
      id: 'bk-soc-1',
      vehicleId: 'veh-1',
      customerId: 'cust-1',
      status: 'APPROVED',
      mechanicId: null,
      assignedMechanicId: null
    },
    'bk-soc-assigned-A': {
      id: 'bk-soc-assigned-A',
      vehicleId: 'veh-1',
      customerId: 'cust-1',
      status: 'ASSIGNED',
      mechanicId: 'mech-A',
      assignedMechanicId: 'mech-A'
    }
  };

  const mockUsers: Record<string, any> = {
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
  };

  const origGetDocument = firebaseService.getDocument;
  const origUpdateDocument = firebaseService.updateDocument;
  const origGetUserById = firebaseService.getUserById;

  firebaseService.getDocument = (async (col: string, id: string) => {
    if (col === 'bookings') return mockBookings[id] || null;
    if (col === 'vehicles') return { id, brand: 'Tesla', model: '3', registrationNumber: 'TEST-123' };
    return null;
  }) as any;

  firebaseService.updateDocument = (async (col: string, id: string, updates: any) => {
    if (col === 'bookings' && mockBookings[id]) {
      mockBookings[id] = { ...mockBookings[id], ...updates };
      return mockBookings[id];
    }
    return null;
  }) as any;

  firebaseService.getUserById = (async (id: string) => mockUsers[id] || null) as any;

  // Connect mock mechanic clients
  const clientA: ClientSocketType = ClientSocket(socketUrl, { transports: ['websocket'] });
  const clientB: ClientSocketType = ClientSocket(socketUrl, { transports: ['websocket'] });

  await new Promise<void>((resolve) => {
    let connected = 0;
    const check = () => {
      connected++;
      if (connected === 2) resolve();
    };
    clientA.on('connect', () => {
      clientA.emit('register_user', { userId: 'mech-A', role: 'MECHANIC' });
      check();
    });
    clientB.on('connect', () => {
      clientB.emit('register_user', { userId: 'mech-B', role: 'MECHANIC' });
      check();
    });
  });

  // Short delay to ensure room joins are processed
  await new Promise((r) => setTimeout(r, 100));

  try {
    // 1. Backend emits canonical status_updated event & 2. Mechanic client listens to status_updated
    // & 3. Admin assignment/status update reaches the correct mechanic
    // & 8. No duplicate status event is emitted for one status change
    {
      const eventsA: any[] = [];
      const eventsB: any[] = [];
      const onEventA = (data: any) => eventsA.push(data);
      const onEventB = (data: any) => eventsB.push(data);

      clientA.on('status_updated', onEventA);
      clientB.on('status_updated', onEventB);

      // Admin assigns Mechanic A to booking 'bk-soc-1'
      const req: any = {
        params: { id: 'bk-soc-1' },
        body: { mechanicId: 'mech-A' },
        user: { userId: 'admin-1', role: 'ADMIN' }
      };
      const res = createMockRes();
      await assignMechanic(req, res);

      assert.strictEqual(res.statusCode, 200, 'assignMechanic should return 200');

      // Wait for socket events to arrive
      await new Promise((r) => setTimeout(r, 200));

      clientA.off('status_updated', onEventA);
      clientB.off('status_updated', onEventB);

      // Verify Mechanic A received exactly ONE event
      assert.strictEqual(eventsA.length, 1, `Test 1/2/8 Failed: Mechanic A should receive exactly 1 event (got ${eventsA.length})`);
      assert.strictEqual(eventsA[0].bookingId, 'bk-soc-1');
      assert.strictEqual(eventsA[0].status, 'ASSIGNED');
      console.log('Test 1 Passed: Backend emits canonical status_updated event');
      console.log('Test 2 Passed: Mechanic client listens to status_updated');
      console.log('Test 3 Passed: Admin assignment reaches assigned mechanic');
      console.log('Test 8 Passed: No duplicate status_updated event emitted (exactly 1 received)');

      // 4. Wrong/unauthorized mechanic does not receive protected update
      assert.strictEqual(eventsB.length, 0, `Test 4 Failed: Unauthorized Mechanic B should receive 0 events (got ${eventsB.length})`);
      console.log('Test 4 Passed: Unauthorized mechanic B does NOT receive protected update');
    }

    // Test status transition emission by mechanic: ASSIGNED -> INSPECTION
    {
      const eventsA: any[] = [];
      const eventsB: any[] = [];
      const onEventA = (data: any) => eventsA.push(data);
      const onEventB = (data: any) => eventsB.push(data);

      clientA.on('status_updated', onEventA);
      clientB.on('status_updated', onEventB);

      const req: any = {
        params: { id: 'bk-soc-assigned-A' },
        body: { status: 'INSPECTION' },
        user: { userId: 'mech-A', role: 'MECHANIC' }
      };
      const res = createMockRes();
      await updateJobStatus(req, res);

      assert.strictEqual(res.statusCode, 200, 'updateJobStatus should succeed with 200');

      await new Promise((r) => setTimeout(r, 200));

      clientA.off('status_updated', onEventA);
      clientB.off('status_updated', onEventB);

      assert.strictEqual(eventsA.length, 1, 'Mechanic A should receive 1 status_updated event');
      assert.strictEqual(eventsA[0].status, 'INSPECTION');
      assert.strictEqual(eventsB.length, 0, 'Mechanic B should receive 0 status_updated events');
      console.log('Test 5 Passed: Existing booking status workflow remains unchanged and emits canonical status_updated');
    }

    // 6. Existing mechanic ownership authorization remains unchanged
    {
      const req: any = {
        params: { id: 'bk-soc-assigned-A' },
        body: { status: 'REPAIRING' },
        user: { userId: 'mech-B', role: 'MECHANIC' }
      };
      const res = createMockRes();
      await updateBookingStatus(req, res);
      assert.strictEqual(res.statusCode, 403, 'Wrong mechanic status update must return 403');
      console.log('Test 6 Passed: Existing mechanic ownership authorization remains intact');
    }

    // 7. Existing mechanic chat Socket.IO behavior remains unchanged
    {
      let chatReceived = false;
      const onChatMessage = (data: any) => {
        if (data.bookingId === 'bk-soc-assigned-A') {
          chatReceived = true;
        }
      };
      clientA.on('message:received', onChatMessage);

      // Emit chat message using socketService
      socketServiceModule.sendToUser('mech-A', 'message:received', {
        bookingId: 'bk-soc-assigned-A',
        message: 'Diagnostics completed'
      });

      await new Promise((r) => setTimeout(r, 200));
      clientA.off('message:received', onChatMessage);

      assert.strictEqual(chatReceived, true, 'Chat message:received event should be delivered');
      console.log('Test 7 Passed: Existing mechanic chat Socket.IO behavior remains unchanged');
    }

    console.log('\n--- ALL SOCKET STATUS EVENT TESTS PASSED! ---');
  } finally {
    clientA.disconnect();
    clientB.disconnect();
    ioServer.close();
    httpServer.close();
    firebaseService.getDocument = origGetDocument;
    firebaseService.updateDocument = origUpdateDocument;
    firebaseService.getUserById = origGetUserById;
  }
}

runSocketStatusEventsTests().catch((err) => {
  console.error('Socket test run failed:', err);
  process.exit(1);
});
