import Certificate from './certificate.model.js';
import Registration from '../event/registration.model.js';
import Event from '../event/event.model.js';
import { AppError } from '../../utils/AppError.js';
import crypto from 'crypto';

export async function issueCertificate(registrationId: string, certificateUrl?: string) {
  const registration = await Registration.findById(registrationId)
    .populate('eventId', 'eventName eventDate certificateEnabled')
    .populate('participantId', 'firstName lastName email');

  if (!registration) throw new AppError('Registration record not found', 404);

  const existing = await Certificate.findOne({ registrationId });
  if (existing) throw new AppError('Certificate already issued for this participant', 409);

  const certificateNumber = `CERT-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  const cert = await Certificate.create({
    registrationId,
    certificateNumber,
    certificateUrl: certificateUrl || `https://eventos.app/certificates/preview/${certificateNumber}`,
  });

  return cert;
}

export async function getEventCertificates(eventId: string) {
  const registrations = await Registration.find({ eventId }).select('_id');
  const regIds = registrations.map((r) => r._id);

  return Certificate.find({ registrationId: { $in: regIds } })
    .populate({
      path: 'registrationId',
      populate: { path: 'participantId', select: 'firstName lastName email' },
    })
    .sort({ createdAt: -1 });
}