import assert from 'assert';
import { getBookingById } from '../src/controllers/bookingController.ts';
import { firebaseService } from '../src/services/firebaseService.ts';

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

async function runGetBookingAuthorizationTests() {
  console.log('--- Starting getBookingById Authorization & Information Disclosure Tests ---');

  // Mock bookings database
  const mockBookings: Record<string, any> = {
    // Booking assigned via mechanicId
    'bk-assigned-mechanicId': {
      id: 'bk-assigned-mechanicId',
      vehicleId: 'veh-1',
      customerId: 'cust-1',
      status: 'INSPECTION',
      mechanicId: 'mech-A',
      assignedMechanicId: null
    },
    // Booking assigned via assignedMechanicId
    'bk-assigned-assignedMechanicId': {
      id: 'bk-assigned-assignedMechanicId',
      vehicleId: 'veh-2',
      customerId: 'cust-2',
      status: 'REPAIRING',
      mechanicId: null,
      assignedMechanicId: 'mech-A'
    },
    // APPROVED booking assigned to Mechanic A (used to verify Mechanic B cannot see it)
    'bk-approved-assigned-A': {
      id: 'bk-approved-assigned-A',
      vehicleId: 'veh-3',
      customerId: 'cust-3',
      status: 'APPROVED',
      mechanicId: 'mech-A',
      assignedMechanicId: 'mech-A'
    },
    // APPROVED booking unassigned
    'bk-approved-unassigned': {
      id: 'bk-approved-unassigned',
      vehicleId: 'veh-4',
      customerId: 'cust-4',
      status: 'APPROVED',
      mechanicId: null,
      assignedMechanicId: null
    },
    // Unassigned PENDING booking
    'bk-unassigned-pending': {
      id: 'bk-unassigned-pending',
      vehicleId: 'veh-5',
      customerId: 'cust-5',
      status: 'PENDING',
      mechanicId: null,
      assignedMechanicId: null
    }
  };

  const origGetDocument = firebaseService.getDocument;
  const origGetCollection = firebaseService.getCollection;
  const origGetInvoiceByBooking = firebaseService.getInvoiceByBooking;

  firebaseService.getDocument = (async (col: string, id: string) => {
    if (col === 'bookings') return mockBookings[id] || null;
    if (col === 'vehicles') return { id, brand: 'Tesla', model: 'Model 3' };
    if (col === 'users') return { id, name: `User ${id}`, email: `${id}@fleetops.com`, role: 'CUSTOMER' };
    return null;
  }) as any;

  firebaseService.getCollection = (async () => []) as any;
  firebaseService.getInvoiceByBooking = (async () => null) as any;

  try {
    // 1. Assigned mechanic can view assigned booking (mechanicId matching) -> 200
    {
      const req: any = {
        params: { id: 'bk-assigned-mechanicId' },
        user: { userId: 'mech-A', role: 'MECHANIC' }
      };
      const res = createMockRes();
      await getBookingById(req, res);
      assert.strictEqual(res.statusCode, 200, 'Test 1 Failed: Assigned mechanic via mechanicId should get 200');
      assert.strictEqual(res.body.booking.id, 'bk-assigned-mechanicId');
      console.log('Test 1 Passed: Assigned mechanic (mechanicId) can view assigned booking => 200 OK');
    }

    // 2. Mechanic matching assignedMechanicId can view booking -> 200
    {
      const req: any = {
        params: { id: 'bk-assigned-assignedMechanicId' },
        user: { userId: 'mech-A', role: 'MECHANIC' }
      };
      const res = createMockRes();
      await getBookingById(req, res);
      assert.strictEqual(res.statusCode, 200, 'Test 2 Failed: Assigned mechanic via assignedMechanicId should get 200');
      assert.strictEqual(res.body.booking.id, 'bk-assigned-assignedMechanicId');
      console.log('Test 2 Passed: Mechanic matching assignedMechanicId can view booking => 200 OK');
    }

    // 3. Different mechanic cannot view another mechanic's booking -> 403
    {
      const req: any = {
        params: { id: 'bk-assigned-mechanicId' },
        user: { userId: 'mech-B', role: 'MECHANIC' }
      };
      const res = createMockRes();
      await getBookingById(req, res);
      assert.strictEqual(res.statusCode, 403, 'Test 3 Failed: Different mechanic should receive 403 Forbidden');
      console.log("Test 3 Passed: Different mechanic cannot view another mechanic's booking => 403 Forbidden");
    }

    // 4. Different mechanic cannot view APPROVED booking just because status is APPROVED -> 403
    {
      const req: any = {
        params: { id: 'bk-approved-assigned-A' },
        user: { userId: 'mech-B', role: 'MECHANIC' }
      };
      const res = createMockRes();
      await getBookingById(req, res);
      assert.strictEqual(res.statusCode, 403, 'Test 4 Failed: Mechanic B cannot view APPROVED booking belonging to Mech A');
      console.log('Test 4 Passed: Unassigned mechanic cannot view APPROVED booking of another mechanic => 403 Forbidden');
    }

    // 5. Mechanic cannot view unassigned booking -> 403
    {
      const req: any = {
        params: { id: 'bk-approved-unassigned' },
        user: { userId: 'mech-A', role: 'MECHANIC' }
      };
      const res = createMockRes();
      await getBookingById(req, res);
      assert.strictEqual(res.statusCode, 403, 'Test 5 Failed: Mechanic cannot view unassigned APPROVED booking');
      console.log('Test 5 Passed: Mechanic cannot view unassigned booking => 403 Forbidden');
    }

    // 6. Mechanic cannot access arbitrary/foreign booking ID -> 403
    {
      const req: any = {
        params: { id: 'bk-unassigned-pending' },
        user: { userId: 'mech-A', role: 'MECHANIC' }
      };
      const res = createMockRes();
      await getBookingById(req, res);
      assert.strictEqual(res.statusCode, 403, 'Test 6 Failed: Mechanic cannot access foreign unassigned booking');
      console.log('Test 6 Passed: Mechanic cannot access arbitrary/foreign unassigned booking => 403 Forbidden');
    }

    // 7. ADMIN can view booking -> 200
    {
      const req: any = {
        params: { id: 'bk-assigned-mechanicId' },
        user: { userId: 'admin-1', role: 'ADMIN' }
      };
      const res = createMockRes();
      await getBookingById(req, res);
      assert.strictEqual(res.statusCode, 200, 'Test 7 Failed: ADMIN should be able to view any booking');
      console.log('Test 7 Passed: ADMIN can view any booking => 200 OK');
    }

    // 8. Authorized CUSTOMER behavior remains unchanged (can view own booking -> 200, cannot view others -> 403)
    {
      // Customer viewing own booking
      const reqOwn: any = {
        params: { id: 'bk-assigned-mechanicId' },
        user: { userId: 'cust-1', role: 'CUSTOMER' }
      };
      const resOwn = createMockRes();
      await getBookingById(reqOwn, resOwn);
      assert.strictEqual(resOwn.statusCode, 200, 'Test 8a Failed: Customer should be able to view own booking');

      // Customer viewing someone else's booking
      const reqOther: any = {
        params: { id: 'bk-assigned-mechanicId' },
        user: { userId: 'cust-999', role: 'CUSTOMER' }
      };
      const resOther = createMockRes();
      await getBookingById(reqOther, resOther);
      assert.strictEqual(resOther.statusCode, 403, 'Test 8b Failed: Customer cannot view another customer booking');

      console.log('Test 8 Passed: Customer authorization behavior preserved (Own: 200, Other: 403)');
    }

    console.log('\n--- ALL getBookingById AUTHORIZATION TESTS PASSED! ---');
  } finally {
    firebaseService.getDocument = origGetDocument;
    firebaseService.getCollection = origGetCollection;
    firebaseService.getInvoiceByBooking = origGetInvoiceByBooking;
  }
}

runGetBookingAuthorizationTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
