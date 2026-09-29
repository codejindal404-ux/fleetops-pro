import assert from 'assert';
import { canMechanicTransition, canMechanicUpdateStatus, MECHANIC_ALLOWED_STATUSES, MECHANIC_ALLOWED_TRANSITIONS } from '../src/utils/permissions.ts';
import { updateBookingStatus } from '../src/controllers/bookingController.ts';
import { firebaseService } from '../src/services/firebaseService.ts';
import { BookingStatus } from '../src/types.ts';

// Mock response creator
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

async function runTests() {
  console.log('--- Starting Mechanic Status Permission & Workflow Tests ---');

  // Test Invariants on MECHANIC_ALLOWED_STATUSES
  assert.ok(!MECHANIC_ALLOWED_STATUSES.includes('PENDING' as any), 'PENDING must not be in MECHANIC_ALLOWED_STATUSES');
  assert.ok(!MECHANIC_ALLOWED_STATUSES.includes('APPROVED' as any), 'APPROVED must not be in MECHANIC_ALLOWED_STATUSES');
  assert.ok(!MECHANIC_ALLOWED_STATUSES.includes('ASSIGNED' as any), 'ASSIGNED must not be in MECHANIC_ALLOWED_STATUSES');

  // Test canMechanicTransition rule logic
  assert.strictEqual(canMechanicTransition('ASSIGNED', 'INSPECTION'), true, 'ASSIGNED -> INSPECTION must be allowed');
  assert.strictEqual(canMechanicTransition('INSPECTION', 'REPAIRING'), true, 'INSPECTION -> REPAIRING must be allowed');
  assert.strictEqual(canMechanicTransition('REPAIRING', 'QUALITY_CHECK'), true, 'REPAIRING -> QUALITY_CHECK must be allowed');
  assert.strictEqual(canMechanicTransition('QUALITY_CHECK', 'COMPLETED'), true, 'QUALITY_CHECK -> COMPLETED must be allowed');

  assert.strictEqual(canMechanicTransition('PENDING', 'APPROVED'), false, 'PENDING -> APPROVED must be forbidden for mechanics');
  assert.strictEqual(canMechanicTransition('APPROVED', 'ASSIGNED'), false, 'APPROVED -> ASSIGNED must be forbidden for mechanics');
  assert.strictEqual(canMechanicTransition('PENDING', 'ASSIGNED'), false, 'PENDING -> ASSIGNED must be forbidden for mechanics');
  assert.strictEqual(canMechanicTransition('ASSIGNED', 'COMPLETED'), false, 'ASSIGNED -> COMPLETED (jumping) must be forbidden for mechanics');
  assert.strictEqual(canMechanicTransition('INSPECTION', 'COMPLETED'), false, 'INSPECTION -> COMPLETED (jumping) must be forbidden for mechanics');

  // Mock booking store
  const mockBookings: Record<string, any> = {
    'bk-1': {
      id: 'bk-1',
      vehicleId: 'veh-1',
      customerId: 'cust-1',
      status: 'PENDING',
      mechanicId: null,
      assignedMechanicId: null
    },
    'bk-2': {
      id: 'bk-2',
      vehicleId: 'veh-1',
      customerId: 'cust-1',
      status: 'APPROVED',
      mechanicId: null,
      assignedMechanicId: null
    },
    'bk-3': {
      id: 'bk-3',
      vehicleId: 'veh-1',
      customerId: 'cust-1',
      status: 'ASSIGNED',
      mechanicId: 'mech-A',
      assignedMechanicId: 'mech-A'
    }
  };

  // Mock firebaseService methods
  const origGetDocument = firebaseService.getDocument;
  const origUpdateDocument = firebaseService.updateDocument;

  firebaseService.getDocument = (async (col: string, id: string) => {
    if (col === 'bookings') {
      return mockBookings[id] || null;
    }
    return { id, brand: 'Tesla', model: 'Model 3', registrationNumber: 'ABC-123' };
  }) as any;

  firebaseService.updateDocument = (async (col: string, id: string, updates: any) => {
    if (col === 'bookings' && mockBookings[id]) {
      mockBookings[id] = { ...mockBookings[id], ...updates };
      return mockBookings[id];
    }
    return { id, ...updates };
  }) as any;

  try {
    // --- Test 1: Admin approves booking (PENDING -> APPROVED) ---
    {
      const req: any = {
        params: { id: 'bk-1' },
        body: { status: 'APPROVED' },
        user: { userId: 'admin-1', role: 'ADMIN' }
      };
      const res = createMockRes();
      await updateBookingStatus(req, res);
      assert.strictEqual(res.statusCode, 200, 'Test 1 Failed: Admin PENDING -> APPROVED should return 200');
      assert.strictEqual(mockBookings['bk-1'].status, 'APPROVED', 'Booking status should be APPROVED');
      console.log('Test 1 Passed: Admin approves booking (PENDING -> APPROVED) => 200 OK');
    }

    // --- Test 2: Admin assigns mechanic (APPROVED -> ASSIGNED) ---
    {
      const req: any = {
        params: { id: 'bk-2' },
        body: { status: 'ASSIGNED' },
        user: { userId: 'admin-1', role: 'ADMIN' }
      };
      const res = createMockRes();
      await updateBookingStatus(req, res);
      assert.strictEqual(res.statusCode, 200, 'Test 2 Failed: Admin APPROVED -> ASSIGNED should return 200');
      assert.strictEqual(mockBookings['bk-2'].status, 'ASSIGNED', 'Booking status should be ASSIGNED');
      console.log('Test 2 Passed: Admin assigns mechanic (APPROVED -> ASSIGNED) => 200 OK');
    }

    // --- Test 3: Assigned mechanic starts inspection (ASSIGNED -> INSPECTION) ---
    {
      const req: any = {
        params: { id: 'bk-3' },
        body: { status: 'INSPECTION' },
        user: { userId: 'mech-A', role: 'MECHANIC' }
      };
      const res = createMockRes();
      await updateBookingStatus(req, res);
      assert.strictEqual(res.statusCode, 200, 'Test 3 Failed: Mechanic ASSIGNED -> INSPECTION should return 200');
      assert.strictEqual(mockBookings['bk-3'].status, 'INSPECTION', 'Booking status should be INSPECTION');
      console.log('Test 3 Passed: Assigned mechanic starts inspection (ASSIGNED -> INSPECTION) => 200 OK');
    }

    // --- Test 4: Mechanic starts repair (INSPECTION -> REPAIRING) ---
    {
      const req: any = {
        params: { id: 'bk-3' },
        body: { status: 'REPAIRING' },
        user: { userId: 'mech-A', role: 'MECHANIC' }
      };
      const res = createMockRes();
      await updateBookingStatus(req, res);
      assert.strictEqual(res.statusCode, 200, 'Test 4 Failed: Mechanic INSPECTION -> REPAIRING should return 200');
      assert.strictEqual(mockBookings['bk-3'].status, 'REPAIRING', 'Booking status should be REPAIRING');
      console.log('Test 4 Passed: Mechanic starts repair (INSPECTION -> REPAIRING) => 200 OK');
    }

    // --- Test 5: Mechanic sends to quality check (REPAIRING -> QUALITY_CHECK) ---
    {
      const req: any = {
        params: { id: 'bk-3' },
        body: { status: 'QUALITY_CHECK' },
        user: { userId: 'mech-A', role: 'MECHANIC' }
      };
      const res = createMockRes();
      await updateBookingStatus(req, res);
      assert.strictEqual(res.statusCode, 200, 'Test 5 Failed: Mechanic REPAIRING -> QUALITY_CHECK should return 200');
      assert.strictEqual(mockBookings['bk-3'].status, 'QUALITY_CHECK', 'Booking status should be QUALITY_CHECK');
      console.log('Test 5 Passed: Mechanic sends to quality check (REPAIRING -> QUALITY_CHECK) => 200 OK');
    }

    // --- Test 6: Mechanic completes service (QUALITY_CHECK -> COMPLETED) ---
    {
      const req: any = {
        params: { id: 'bk-3' },
        body: { status: 'COMPLETED' },
        user: { userId: 'mech-A', role: 'MECHANIC' }
      };
      const res = createMockRes();
      await updateBookingStatus(req, res);
      assert.strictEqual(res.statusCode, 200, 'Test 6 Failed: Mechanic QUALITY_CHECK -> COMPLETED should return 200');
      assert.strictEqual(mockBookings['bk-3'].status, 'COMPLETED', 'Booking status should be COMPLETED');
      console.log('Test 6 Passed: Mechanic completes service (QUALITY_CHECK -> COMPLETED) => 200 OK');
    }

    // Reset bk-1 to PENDING for Test 7
    mockBookings['bk-1'] = {
      id: 'bk-1',
      vehicleId: 'veh-1',
      customerId: 'cust-1',
      status: 'PENDING',
      mechanicId: 'mech-A', // even if mechanicId is present
      assignedMechanicId: 'mech-A'
    };

    // --- Test 7: Mechanic tries to approve (PENDING -> APPROVED) ---
    {
      const req: any = {
        params: { id: 'bk-1' },
        body: { status: 'APPROVED' },
        user: { userId: 'mech-A', role: 'MECHANIC' }
      };
      const res = createMockRes();
      await updateBookingStatus(req, res);
      assert.strictEqual(res.statusCode, 403, 'Test 7 Failed: Mechanic PENDING -> APPROVED should return 403');
      console.log('Test 7 Passed: Mechanic tries to approve (PENDING -> APPROVED) => 403 Forbidden');
    }

    // Reset bk-2 to APPROVED for Test 8
    mockBookings['bk-2'] = {
      id: 'bk-2',
      vehicleId: 'veh-1',
      customerId: 'cust-1',
      status: 'APPROVED',
      mechanicId: 'mech-A', // even if mechanicId is present
      assignedMechanicId: 'mech-A'
    };

    // --- Test 8: Mechanic tries to assign (APPROVED -> ASSIGNED) ---
    {
      const req: any = {
        params: { id: 'bk-2' },
        body: { status: 'ASSIGNED' },
        user: { userId: 'mech-A', role: 'MECHANIC' }
      };
      const res = createMockRes();
      await updateBookingStatus(req, res);
      assert.strictEqual(res.statusCode, 403, 'Test 8 Failed: Mechanic APPROVED -> ASSIGNED should return 403');
      console.log('Test 8 Passed: Mechanic tries to assign (APPROVED -> ASSIGNED) => 403 Forbidden');
    }

    // Reset bk-3 to ASSIGNED for Test 9
    mockBookings['bk-3'] = {
      id: 'bk-3',
      vehicleId: 'veh-1',
      customerId: 'cust-1',
      status: 'ASSIGNED',
      mechanicId: 'mech-A',
      assignedMechanicId: 'mech-A'
    };

    // --- Test 9: Mechanic tries to jump workflow (ASSIGNED -> COMPLETED) ---
    {
      const req: any = {
        params: { id: 'bk-3' },
        body: { status: 'COMPLETED' },
        user: { userId: 'mech-A', role: 'MECHANIC' }
      };
      const res = createMockRes();
      await updateBookingStatus(req, res);
      assert.strictEqual(res.statusCode, 403, 'Test 9 Failed: Mechanic ASSIGNED -> COMPLETED should return 403');
      console.log('Test 9 Passed: Mechanic tries to jump workflow (ASSIGNED -> COMPLETED) => 403 Forbidden');
    }

    // --- Test 10: Wrong mechanic (Mechanic B attempts allowed status transition on Mechanic A's booking) ---
    {
      const req: any = {
        params: { id: 'bk-3' },
        body: { status: 'INSPECTION' },
        user: { userId: 'mech-B', role: 'MECHANIC' }
      };
      const res = createMockRes();
      await updateBookingStatus(req, res);
      assert.strictEqual(res.statusCode, 403, 'Test 10 Failed: Wrong mechanic should return 403');
      console.log('Test 10 Passed: Wrong mechanic attempts transition on Mechanic A booking => 403 Forbidden');
    }

    console.log('\n--- ALL 10 TESTS PASSED SUCCESSFULLY! ---');
  } finally {
    // Restore originals
    firebaseService.getDocument = origGetDocument;
    firebaseService.updateDocument = origUpdateDocument;
  }
}

runTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
