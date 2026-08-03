import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import { locales } from '@/i18n/routing';

/**
 * Contact enquiries — Project Specification v1.8 §5.8.
 *
 * The stored document is authoritative. Email notification is best-effort on
 * top of it, so a delivery failure never loses an enquiry. There is no admin UI
 * until Phase 7, so this collection is the founder's follow-up queue.
 */
const contactSubmissionSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    email: { type: String, trim: true, maxlength: 254 },
    subject: { type: String, required: true, trim: true, maxlength: 150 },
    message: { type: String, required: true, trim: true, maxlength: 4000 },
    locale: { type: String, required: true, enum: [...locales] },
    status: {
      type: String,
      required: true,
      enum: ['new', 'read', 'replied', 'archived'],
      default: 'new',
    },
    notifiedAt: { type: Date },
    notificationError: { type: String },
    userAgent: { type: String, maxlength: 512 },
  },
  { timestamps: true, collection: 'contact_submissions' },
);

contactSubmissionSchema.index({ status: 1, createdAt: -1 });

export type ContactSubmissionDoc = InferSchemaType<typeof contactSubmissionSchema>;

export const ContactSubmission: Model<ContactSubmissionDoc> =
  (mongoose.models.ContactSubmission as Model<ContactSubmissionDoc> | undefined) ??
  mongoose.model<ContactSubmissionDoc>('ContactSubmission', contactSubmissionSchema);
