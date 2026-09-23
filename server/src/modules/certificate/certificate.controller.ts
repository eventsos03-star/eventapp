import { asyncHandler } from '../../utils/asyncHandler.js';
import { success } from '../../utils/response.js';
import * as certService from './certificate.service.js';

export const issue = asyncHandler(async (req, res) => {
  const { registrationId, certificateUrl } = req.body;
  const cert = await certService.issueCertificate(registrationId, certificateUrl);
  return success(res, 201, 'Certificate issued successfully', cert);
});

export const getByEvent = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const certs = await certService.getEventCertificates(eventId);
  return success(res, 200, 'Certificates fetched successfully', certs);
});