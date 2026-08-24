import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { dbStore } from '../services/dbStore.ts';
import { notificationService } from '../services/notificationService.ts';

export const submitFeedback = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { id: bookingId } = req.params;
  const { rating, comment } = req.body;
  const customerId = req.user!.userId;

  const booking = dbStore.getBookingById(bookingId);
  if (!booking) {
    res.status(404).json({ message: 'Booking not found.' });
    return;
  }

  // Must be owned by the customer
  if (booking.customerId !== customerId) {
    res.status(403).json({ message: 'Forbidden: You can only leave feedback for your own bookings.' });
    return;
  }

  // Must be COMPLETED
  if (booking.status !== 'COMPLETED') {
    res.status(400).json({
      message: `Feedback can only be submitted for COMPLETED bookings. Current booking status is ${booking.status}.`
    });
    return;
  }

  // Enforce one feedback per booking
  const existingFeedback = dbStore.getFeedbackByBooking(bookingId);
  if (existingFeedback) {
    res.status(409).json({ message: 'Feedback has already been submitted for this booking.', feedback: existingFeedback });
    return;
  }

  const numRating = Number(rating);
  if (numRating < 1 || numRating > 5) {
    res.status(400).json({ message: 'Rating must be an integer between 1 and 5.' });
    return;
  }

  const feedback = dbStore.createFeedback(bookingId, customerId, numRating, comment || '');

  // Dispatch real-time notification to the assigned mechanic and admin
  try {
    const customer = dbStore.getUserById(customerId);
    const custName = customer?.name || 'Customer';

    if (booking.mechanicId) {
      await notificationService.createNotification({
        userId: booking.mechanicId,
        title: `New ${numRating}★ Review Received`,
        message: `${custName} left a ${numRating}-star rating: "${comment ? comment.slice(0, 60) : 'Great service!'}"`,
        type: 'REVIEW_RECEIVED',
        link: '/mechanic',
        data: { feedbackId: feedback.id, rating: numRating }
      });
    }

    await notificationService.notifyRole('ADMIN', {
      title: `Service Feedback (${numRating}★)`,
      message: `${custName} reviewed Booking #${booking.id.slice(-6)}: "${comment ? comment.slice(0, 60) : 'Completed'}"`,
      type: 'REVIEW_RECEIVED',
      link: '/admin',
      data: { feedbackId: feedback.id, rating: numRating }
    });
  } catch (err) {
    console.error('Failed to dispatch feedback notification:', err);
  }

  res.status(201).json({ message: 'Feedback submitted successfully', feedback });
};

export const getFeedback = async (req: Request, res: Response): Promise<void> => {
  const { userId, role } = req.user!;

  let feedbacks;
  if (role === 'CUSTOMER') {
    feedbacks = dbStore.getFeedbacksByCustomer(userId);
  } else {
    feedbacks = dbStore.getFeedbacks();
  }

  // Calculate overall average rating
  let overallAverage = 0;
  if (feedbacks.length > 0) {
    const totalRating = feedbacks.reduce((sum, f) => sum + f.rating, 0);
    overallAverage = Number((totalRating / feedbacks.length).toFixed(1));
  }

  const enrichedFeedbacks = feedbacks.map((f) => {
    const booking = dbStore.getBookingById(f.bookingId);
    const customer = dbStore.getUserById(f.customerId);
    return {
      ...f,
      booking,
      customer: customer ? { id: customer.id, name: customer.name, email: customer.email } : null
    };
  });

  res.status(200).json({
    feedbacks: enrichedFeedbacks,
    metrics: {
      totalCount: feedbacks.length,
      averageRating: overallAverage
    }
  });
};

export const getMechanicRating = async (req: Request, res: Response): Promise<void> => {
  const { id: mechanicId } = req.params;

  const mechanic = dbStore.getUserById(mechanicId);
  if (!mechanic || mechanic.role !== 'MECHANIC') {
    res.status(404).json({ message: 'Mechanic not found or user is not a mechanic.' });
    return;
  }

  const ratingMetrics = dbStore.getMechanicAverageRating(mechanicId);

  res.status(200).json({
    mechanic: {
      id: mechanic.id,
      name: mechanic.name,
      email: mechanic.email,
      phone: mechanic.phone
    },
    metrics: ratingMetrics
  });
};
