import * as adminService from './admin.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { success } from '../../utils/response.js';

export const getAdminStats = asyncHandler(async (_req, res) => {
  const stats = await adminService.getAdminStats();
  success(res, 200, 'Admin stats fetched successfully', stats);
});

export const listOrganizations = asyncHandler(async (req, res) => {
  const organizations = await adminService.listOrganizations(
    req.query.status as adminService.ResourceStatus | undefined,
  );
  success(res, 200, 'Organizations fetched successfully', organizations);
});

export const approveOrganization = asyncHandler(async (req, res) => {
  const organization = await adminService.approveOrganization(req.params.id);
  success(res, 200, 'Organization approved successfully', organization);
});

export const rejectOrganization = asyncHandler(async (req, res) => {
  const organization = await adminService.rejectOrganization(req.params.id);
  success(res, 200, 'Organization rejected successfully', organization);
});

export const listVenueOwners = asyncHandler(async (req, res) => {
  const venueOwners = await adminService.listVenueOwners(
    req.query.status as adminService.ResourceStatus | undefined,
  );
  success(res, 200, 'Venue owners fetched successfully', venueOwners);
});

export const approveVenueOwner = asyncHandler(async (req, res) => {
  const venueOwner = await adminService.approveVenueOwner(req.params.id);
  success(res, 200, 'Venue owner approved successfully', venueOwner);
});

export const rejectVenueOwner = asyncHandler(async (req, res) => {
  const venueOwner = await adminService.rejectVenueOwner(req.params.id);
  success(res, 200, 'Venue owner rejected successfully', venueOwner);
});
