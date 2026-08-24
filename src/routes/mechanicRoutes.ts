import { Router } from 'express';
import { body, param } from 'express-validator';
import { authMiddleware } from '../middlewares/authMiddleware.ts';
import { restrictTo } from '../middlewares/roleMiddleware.ts';
import * as mechanicController from '../controllers/mechanicController.ts';

const router = Router();

// Protect ALL mechanic routes to MECHANIC and ADMIN roles
router.use(authMiddleware);
router.use(restrictTo('MECHANIC', 'ADMIN'));

// ================= 1. PROFILE & AVAILABILITY & KPIS =================
router.get('/profile', mechanicController.getMechanicProfile);
router.patch(
  '/availability',
  [body('availability').isIn(['AVAILABLE', 'BUSY', 'OFFLINE']).withMessage('Valid availability status is required')],
  mechanicController.updateAvailability
);
router.get('/performance', mechanicController.getMechanicPerformance);

// ================= 2. ADVANCED JOB MANAGEMENT =================
router.get('/jobs', mechanicController.getAssignedJobs);
router.get('/tasks', mechanicController.getAssignedJobs);

router.get('/jobs/:id', mechanicController.getJobDetail);
router.get('/tasks/:id', mechanicController.getJobDetail);

router.patch(
  '/jobs/:id/status',
  [body('status').notEmpty().withMessage('Target status is required')],
  mechanicController.updateJobStatus
);
router.patch(
  '/tasks/:id/status',
  [body('status').notEmpty().withMessage('Target status is required')],
  mechanicController.updateJobStatus
);
router.patch(
  '/job-status',
  [body('status').notEmpty().withMessage('Target status is required')],
  mechanicController.updateJobStatus
);

router.post('/jobs/:id/accept', mechanicController.acceptJob);
router.post('/tasks/:id/accept', mechanicController.acceptJob);

// ================= 3. OBD-II DIAGNOSTIC PANEL =================
router.get('/diagnostics/:bookingId', mechanicController.getDiagnostics);
router.post(
  '/diagnostics',
  [
    body('bookingId').notEmpty().withMessage('Booking ID is required'),
    body('faultCode').trim().notEmpty().withMessage('DTC Fault Code is required'),
    body('problemDescription').trim().notEmpty().withMessage('Problem description is required'),
    body('recommendedSolution').trim().notEmpty().withMessage('Recommended solution is required')
  ],
  mechanicController.addDiagnostic
);
router.patch('/diagnostics/:id/resolve', mechanicController.resolveDiagnostic);
router.delete('/diagnostics/:id', mechanicController.deleteDiagnostic);

// ================= 4. VEHICLE INSPECTION & HEALTH =================
router.get('/inspections/:bookingId', mechanicController.getInspection);
router.post(
  '/inspections',
  [
    body('bookingId').notEmpty().withMessage('Booking ID is required'),
    body('engineHealthScore').notEmpty().withMessage('Engine health score is required'),
    body('batteryVoltage').notEmpty().withMessage('Battery voltage is required'),
    body('overallResult').isIn(['PASS', 'ATTENTION', 'CRITICAL_FAIL']).withMessage('Valid overall result required')
  ],
  mechanicController.saveInspection
);

// ================= 5. REPAIR WORKSPACE LOGS =================
router.post(
  '/jobs/:id/logs',
  [body('note').trim().notEmpty().withMessage('Repair log note is required')],
  mechanicController.addRepairLog
);
router.post(
  '/tasks/:id/logs',
  [body('note').trim().notEmpty().withMessage('Repair log note is required')],
  mechanicController.addRepairLog
);
router.post(
  '/repair-log',
  [body('note').trim().notEmpty().withMessage('Repair log note is required')],
  mechanicController.addRepairLog
);

// ================= 6. REPAIR IMAGES =================
router.get('/images/:bookingId', mechanicController.getRepairImages);
router.post(
  '/upload-image',
  [
    body('bookingId').notEmpty().withMessage('Booking ID is required'),
    body('imageUrl').notEmpty().withMessage('Image URL / Data is required'),
    body('category').isIn(['BEFORE', 'AFTER', 'DIAGNOSTIC']).withMessage('Category must be BEFORE, AFTER, or DIAGNOSTIC')
  ],
  mechanicController.uploadRepairImage
);
router.post(
  '/images',
  [
    body('bookingId').notEmpty().withMessage('Booking ID is required'),
    body('imageUrl').notEmpty().withMessage('Image URL / Data is required')
  ],
  mechanicController.uploadRepairImage
);
router.delete('/images/:id', mechanicController.deleteRepairImage);
router.patch('/images/:id/approve', mechanicController.toggleImageApproval);

// ================= 7. SPARE PARTS & REQUISITIONS =================
router.get('/parts', mechanicController.getSparePartsCatalog);
router.get('/parts-requests', mechanicController.getSparePartsRequests);
router.get('/parts-requests/:bookingId', mechanicController.getSparePartsRequests);
router.post(
  '/parts-request',
  [
    body('bookingId').notEmpty().withMessage('Booking ID is required'),
    body('partName').trim().notEmpty().withMessage('Part name is required'),
    body('quantityRequired').isNumeric().withMessage('Quantity must be a number')
  ],
  mechanicController.createSparePartsRequest
);
router.patch('/parts-request/:id', mechanicController.updateSparePartsRequestStatus);

// ================= 8. WORKSHOP CHAT & APPROVALS =================
router.get('/chat/:bookingId', mechanicController.getChatMessages);
router.post(
  '/chat/:bookingId',
  [body('message').trim().notEmpty().withMessage('Message text is required')],
  mechanicController.sendChatMessage
);
router.patch('/chat/approval/:messageId', mechanicController.updateChatApproval);

export const mechanicRoutes = router;
export default router;

