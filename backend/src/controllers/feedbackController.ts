import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Feedback, Booking, User } from '../types.ts';
import { firebaseService } from '../services/firebaseService.ts';
import { notificationService } from '../services/notificationService.ts';

export const submitFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { id: bookingId } = req.params;
    const { rating, comment } = req.body;
    const customerId = req.user!.userId;

    const booking = await firebaseService.getDocument<Booking>('bookings', bookingId);
    if (!booking) {
      res.status(404).json({ message: 'Booking not found.' });
      return;
    }

    if (booking.customerId !== customerId) {
      res.status(403).json({ message: 'Forbidden: You can only leave feedback for your own bookings.' });
      return;
    }

    if (booking.status !== 'COMPLETED') {
      res.status(400).json({
        message: `Feedback can only be submitted for COMPLETED bookings. Current booking status is ${booking.status}.`
      });
      return;
    }

    const existingFeedbacks = await firebaseService.getCollection<Feedback>('feedback', [{ field: 'bookingId', op: '==', value: bookingId }]);
    if (existingFeedbacks.length > 0) {
      res.status(409).json({ message: 'Feedback has already been submitted for this booking.', feedback: existingFeedbacks[0] });
      return;
    }

    const numRating = Number(rating);
    if (numRating < 1 || numRating > 5) {
      res.status(400).json({ message: 'Rating must be an integer between 1 and 5.' });
      return;
    }

    const feedbackId = `fb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const feedback = await firebaseService.createDocument<Feedback>(
      'feedback',
      {
        bookingId,
        customerId,
        mechanicId: booking.mechanicId || null,
        rating: numRating,
        comment: (comment || '').trim()
      },
      feedbackId
    );

    try {
      const customer = await firebaseService.getUserById(customerId);
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
  } catch (error: any) {
    console.error('submitFeedback error:', error);
    res.status(500).json({ message: 'Server error submitting feedback', error: error.message });
  }
};

export const getFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, role } = req.user!;

    let feedbacks: Feedback[];
    if (role === 'CUSTOMER') {
      feedbacks = await firebaseService.getCollection<Feedback>('feedback', [{ field: 'customerId', op: '==', value: userId }]);
    } else {
      feedbacks = await firebaseService.getCollection<Feedback>('feedback');
    }

    let overallAverage = 0;
    if (feedbacks.length > 0) {
      const totalRating = feedbacks.reduce((sum, f) => sum + f.rating, 0);
      overallAverage = Number((totalRating / feedbacks.length).toFixed(1));
    }

    const enrichedFeedbacks = await Promise.all(
      feedbacks.map(async (f) => {
        const booking = await firebaseService.getDocument<Booking>('bookings', f.bookingId);
        const customer = await firebaseService.getDocument<User>('users', f.customerId);
        return {
          ...f,
          booking,
          customer: customer ? { id: customer.id, name: customer.name, email: customer.email } : null
        };
      })
    );

    res.status(200).json({
      feedbacks: enrichedFeedbacks,
      metrics: {
        totalCount: feedbacks.length,
        averageRating: overallAverage
      }
    });
  } catch (error: any) {
    console.error('getFeedback error:', error);
    res.status(500).json({ message: 'Server error fetching feedback', error: error.message });
  }
};

export const getMechanicRating = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: mechanicId } = req.params;

    const mechanic = await firebaseService.getUserById(mechanicId);
    if (!mechanic || mechanic.role !== 'MECHANIC') {
      res.status(404).json({ message: 'Mechanic not found or user is not a mechanic.' });
      return;
    }

    const mechanicBookings = await firebaseService.getBookingsByMechanic(mechanicId);
    const bookingIds = new Set(mechanicBookings.map((b) => b.id));
    const allFeedbacks = await firebaseService.getCollection<Feedback>('feedback');
    const mechanicFeedbacks = allFeedbacks.filter((f) => bookingIds.has(f.bookingId));

    let averageRating = 0;
    if (mechanicFeedbacks.length > 0) {
      const totalRating = mechanicFeedbacks.reduce((sum, f) => sum + f.rating, 0);
      averageRating = Number((totalRating / mechanicFeedbacks.length).toFixed(1));
    }

    res.status(200).json({
      mechanic: {
        id: mechanic.id,
        name: mechanic.name,
        email: mechanic.email,
        phone: mechanic.phone
      },
      metrics: {
        mechanicId,
        averageRating,
        totalReviews: mechanicFeedbacks.length,
        feedbacks: mechanicFeedbacks
      }
    });
  } catch (error: any) {
    console.error('getMechanicRating error:', error);
    res.status(500).json({ message: 'Server error fetching mechanic rating', error: error.message });
  }
};
