import assert from 'assert';
import { acceptJob } from '../src/controllers/mechanicController.ts';
import { dbStore } from '../src/services/dbStore.ts';
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

async function runAcceptJobAuthTests() {
  console.log('--- Starting Accept Job Authorization & Security Tests ---');

  // Backup original services
  const origGetDocument = firebaseService.getDocument;
  const origUpdateDocument = firebaseService.updateDocument;
  const origGetUserById = firebaseService.getUserById;

  const mockBookings: Record<string, any> = {
    'bk-assigned-mechA': {
      id: 'bk-assigned-mechA',
      vehicleId: 'veh-1',
      customerId: 'cust-1',
      status: 'ASSIGNED',
      mechanicId: 'mech-A',
      assignedMechanicId: 'mech-A',
      repairLogs: []
    },
    'bk-assigned-mechB': {
      id: 'bk-assigned-mechB',
      vehicleId: 'veh-1',
      customerId: 'cust-1',
      status: 'ASSIGNED',
      mechanicId: 'mech-B',
      assignedMechanicId: 'mech-B',
      repairLogs: []
    },
    'bk-unassigned': {
      id: 'bk-unassigned',
      vehicleId: 'veh-1',
      customerId: 'cust-1',
      status: 'ASSIGNED',
      mechanicId: null,
      assignedMechanicId: null,
      repairLogs: []
    },
    'bk-pending': {
      id: 'bk-pending',
      vehicleId: 'veh-1',
      customerId: 'cust-1',
      status: 'PENDING',
      mechanicId: 'mech-A',
      assignedMechanicId: 'mech-A',
      repairLogs: []
    },
    'bk-approved': {
      id: 'bk-approved',
      vehicleId: 'veh-1',
      customerId: 'cust-1',
      status: 'APPROVED',
      mechanicId: 'mech-A',
      assignedMechanicId: 'mech-A',
      repairLogs: []
    },
    'bk-inspection': {
      id: 'bk-inspection',
      vehicleId: 'veh-1',
      customerId: 'cust-1',
      status: 'INSPECTION',
      mechanicId: 'mech-A',
      assignedMechanicId: 'mech-A',
      repairLogs: []
    },
    'bk-repairing': {
      id: 'bk-repairing',
      vehicleId: 'veh-1',
      customerId: 'cust-1',
      status: 'REPAIRING',
      mechanicId: 'mech-A',
      assignedMechanicId: 'mech-A',
      repairLogs: []
    },
    'bk-qc': {
      id: 'bk-qc',
      vehicleId: 'veh-1',
      customerId: 'cust-1',
      status: 'QUALITY_CHECK',
      mechanicId: 'mech-A',
      assignedMechanicId: 'mech-A',
      repairLogs: []
    },
    'bk-completed': {
      id: 'bk-completed',
      vehicleId: 'veh-1',
      customerId: 'cust-1',
      status: 'COMPLETED',
      mechanicId: 'mech-A',
      assignedMechanicId: 'mech-A',
      repairLogs: []
    },
    'bk-cancelled': {
      id: 'bk-cancelled',
      vehicleId: 'veh-1',
      customerId: 'cust-1',
      status: 'CANCELLED',
      mechanicId: 'mech-A',
      assignedMechanicId: 'mech-A',
      repairLogs: []
    }
  };

  firebaseService.getDocument = (async (col: string, id: string) => {
    if (col === 'bookings') return mockBookings[id] || null;
    return { id, brand: 'Freightliner', model: 'Cascadia', registrationNumber: 'FL-2024' };
  }) as any;

  firebaseService.updateDocument = (async (col: string, id: string, updates: any) => {
    if (col === 'bookings' && mockBookings[id]) {
      mockBookings[id] = { ...mockBookings[id], ...updates };
      return mockBookings[id];
    }
    return { id, ...updates };
  }) as any;

  firebaseService.getUserById = (async (uid: string) => ({
    id: uid,
    name: `User ${uid}`,
    role: uid.startsWith('mech') ? 'MECHANIC' : 'CUSTOMER'
  })) as any;

  // Clear dbStore repairLogs for test bookings
  const origLogs = (dbStore as any).data.repairLogs;
  (dbStore as any).data.repairLogs = [];

  try {
    // 1. Assigned mechanic accepts ASSIGNED booking -> 200
    {
      const req: any = {
        params: { id: 'bk-assigned-mechA' },
        user: { userId: 'mech-A', role: 'MECHANIC' }
      };
      const res = createMockRes();
      await acceptJob(req, res);
      assert.strictEqual(res.statusCode, 200, 'Test 1 Failed: Assigned mechanic accepting ASSIGNED booking should return 200');
      assert.strictEqual(mockBookings['bk-assigned-mechA'].status, 'ASSIGNED', 'Status must remain ASSIGNED');
      console.log('Test 1 Passed: Assigned mechanic accepts ASSIGNED booking => 200 OK');
    }

    // 2. Wrong mechanic attempts to accept -> 403
    {
      const req: any = {
        params: { id: 'bk-assigned-mechB' },
        user: { userId: 'mech-A', role: 'MECHANIC' }
      };
      const res = createMockRes();
      await acceptJob(req, res);
      assert.strictEqual(res.statusCode, 403, 'Test 2 Failed: Wrong mechanic must receive 403 Forbidden');
      console.log('Test 2 Passed: Wrong mechanic attempts to accept => 403 Forbidden');
    }

    // 3. Unassigned mechanic attempts to accept -> 403
    {
      const req: any = {
        params: { id: 'bk-unassigned' },
        user: { userId: 'mech-A', role: 'MECHANIC' }
      };
      const res = createMockRes();
      await acceptJob(req, res);
      assert.strictEqual(res.statusCode, 403, 'Test 3 Failed: Unassigned booking cannot be accepted by mechanic, must return 403');
      console.log('Test 3 Passed: Unassigned mechanic attempts to accept => 403 Forbidden');
    }

    // 4. Mechanic attempts to accept PENDING booking -> rejected (400)
    {
      const req: any = {
        params: { id: 'bk-pending' },
        user: { userId: 'mech-A', role: 'MECHANIC' }
      };
      const res = createMockRes();
      await acceptJob(req, res);
      assert.strictEqual(res.statusCode, 400, 'Test 4 Failed: PENDING booking accept must be rejected with 400');
      console.log('Test 4 Passed: Mechanic attempts to accept PENDING booking => 400 Rejected');
    }

    // 5. Mechanic attempts to accept APPROVED booking -> rejected (400)
    {
      const req: any = {
        params: { id: 'bk-approved' },
        user: { userId: 'mech-A', role: 'MECHANIC' }
      };
      const res = createMockRes();
      await acceptJob(req, res);
      assert.strictEqual(res.statusCode, 400, 'Test 5 Failed: APPROVED booking accept must be rejected with 400');
      console.log('Test 5 Passed: Mechanic attempts to accept APPROVED booking => 400 Rejected');
    }

    // 6. Mechanic attempts to accept INSPECTION booking -> rejected (400)
    {
      const req: any = {
        params: { id: 'bk-inspection' },
        user: { userId: 'mech-A', role: 'MECHANIC' }
      };
      const res = createMockRes();
      await acceptJob(req, res);
      assert.strictEqual(res.statusCode, 400, 'Test 6 Failed: INSPECTION booking accept must be rejected with 400');
      console.log('Test 6 Passed: Mechanic attempts to accept INSPECTION booking => 400 Rejected');
    }

    // 7. Mechanic attempts to accept REPAIRING booking -> rejected (400)
    {
      const req: any = {
        params: { id: 'bk-repairing' },
        user: { userId: 'mech-A', role: 'MECHANIC' }
      };
      const res = createMockRes();
      await acceptJob(req, res);
      assert.strictEqual(res.statusCode, 400, 'Test 7 Failed: REPAIRING booking accept must be rejected with 400');
      console.log('Test 7 Passed: Mechanic attempts to accept REPAIRING booking => 400 Rejected');
    }

    // 8. Mechanic attempts to accept QUALITY_CHECK booking -> rejected (400)
    {
      const req: any = {
        params: { id: 'bk-qc' },
        user: { userId: 'mech-A', role: 'MECHANIC' }
      };
      const res = createMockRes();
      await acceptJob(req, res);
      assert.strictEqual(res.statusCode, 400, 'Test 8 Failed: QUALITY_CHECK booking accept must be rejected with 400');
      console.log('Test 8 Passed: Mechanic attempts to accept QUALITY_CHECK booking => 400 Rejected');
    }

    // 9. Mechanic attempts to accept COMPLETED booking -> rejected (400)
    {
      const req: any = {
        params: { id: 'bk-completed' },
        user: { userId: 'mech-A', role: 'MECHANIC' }
      };
      const res = createMockRes();
      await acceptJob(req, res);
      assert.strictEqual(res.statusCode, 400, 'Test 9 Failed: COMPLETED booking accept must be rejected with 400');
      console.log('Test 9 Passed: Mechanic attempts to accept COMPLETED booking => 400 Rejected');
    }

    // 10. Mechanic attempts to accept CANCELLED booking -> rejected (400)
    {
      const req: any = {
        params: { id: 'bk-cancelled' },
        user: { userId: 'mech-A', role: 'MECHANIC' }
      };
      const res = createMockRes();
      await acceptJob(req, res);
      assert.strictEqual(res.statusCode, 400, 'Test 10 Failed: CANCELLED booking accept must be rejected with 400');
      console.log('Test 10 Passed: Mechanic attempts to accept CANCELLED booking => 400 Rejected');
    }

    // 11. Accepting the same booking twice does not duplicate the acceptance log
    {
      const logsBefore = dbStore.getRepairLogsByBooking('bk-assigned-mechA');
      assert.strictEqual(logsBefore.length, 1, 'There should be exactly 1 log from Test 1');

      const req: any = {
        params: { id: 'bk-assigned-mechA' },
        user: { userId: 'mech-A', role: 'MECHANIC' }
      };
      const res = createMockRes();
      await acceptJob(req, res);
      assert.strictEqual(res.statusCode, 400, 'Duplicate accept should return 400 error');
      assert.ok(res.body.message.includes('already been accepted'), 'Error should specify job has already been accepted');

      const logsAfter = dbStore.getRepairLogsByBooking('bk-assigned-mechA');
      assert.strictEqual(logsAfter.length, 1, 'Test 11 Failed: Duplicate accept must NOT create duplicate repair log');
      console.log('Test 11 Passed: Accepting the same booking twice does not duplicate the acceptance log');
    }

    // 12. Correct Job Accepted log behavior remains intact
    {
      const logs = dbStore.getRepairLogsByBooking('bk-assigned-mechA');
      const acceptedLog = logs.find((l: any) => l.action === 'Job Accepted');
      assert.ok(acceptedLog, 'Job Accepted log entry must exist in repairLogs');
      assert.strictEqual(acceptedLog.updatedBy, 'mech-A', 'Log must attribute accepting mechanic ID');
      assert.ok(acceptedLog.note.includes('accepted'), 'Log note must describe acceptance action');
      console.log('Test 12 Passed: Correct Job Accepted log behavior remains intact');
    }

    console.log('\n--- ALL 12 ACCEPT JOB AUTHORIZATION TESTS PASSED SUCCESSFULLY! ---');
  } finally {
    // Restore originals
    firebaseService.getDocument = origGetDocument;
    firebaseService.updateDocument = origUpdateDocument;
    firebaseService.getUserById = origGetUserById;
    (dbStore as any).data.repairLogs = origLogs;
  }
}

runAcceptJobAuthTests().catch((err) => {
  console.error('Accept job authorization test run failed:', err);
  process.exit(1);
});
