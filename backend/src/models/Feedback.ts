export interface FeedbackModel {
  id: string;
  bookingId: string;
  customerId: string;
  mechanicId?: string;
  rating: number;
  comment: string;
  createdAt: string;
}
