import * as adminService from './admin.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { success } from '../../utils/response.js';

export const getAdminStats = asyncHandler(async (_req, res) => {
  const stats = await adminService.getAdminStats();
  success(res, 200, 'Admin stats fetched successfully', stats);
});

export const listOrganizations = asyncHandler(async (req, res) => {
  const organizations = await adminService.listOrganizations(
    req.query.status as adminService.ResourceStatus | 'deleted' | undefined,
  );
  success(res, 200, 'Organizations fetched successfully', organizations);
});

export const approveOrganization = asyncHandler(async (req, res) => {
  const organization = await adminService.approveOrganization(req.params.id);
  success(res, 200, 'Organization approved successfully', organization);
});

export const rejectOrganization = asyncHandler(async (req, res) => {
  const organization = await adminService.rejectOrganization(req.params.id, req.body.reason);
  success(res, 200, 'Organization rejected successfully', organization);
});

export const deleteOrganization = asyncHandler(async (req, res) => {
  const organization = await adminService.deleteOrganization(req.params.id);
  success(res, 200, 'Organization deleted successfully', organization);
});

export const restoreOrganization = asyncHandler(async (req, res) => {
  const organization = await adminService.restoreOrganization(req.params.id);
  success(res, 200, 'Organization restored successfully', organization);
});

export const getOrganizationDetail = asyncHandler(async (req, res) => {
  const organization = await adminService.getOrganizationDetail(req.params.id);
  success(res, 200, 'Organization fetched successfully', organization);
});

export const listVenueOwners = asyncHandler(async (req, res) => {
  const venueOwners = await adminService.listVenueOwners(
    req.query.status as adminService.ResourceStatus | 'deleted' | undefined,
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

export const restoreVenueOwner = asyncHandler(async (req, res) => {
  const venueOwner = await adminService.restoreVenueOwner(req.params.id);
  success(res, 200, 'Venue owner restored successfully', venueOwner);
});

export const listUsers = asyncHandler(async (req, res) => {
  const { search, page, limit } = req.query as { search?: string; page?: number; limit?: number };
  const result = await adminService.listUsers(search, page, limit);
  success(res, 200, 'Users fetched successfully', result);
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const result = await adminService.updateUserRole(req.params.id, req.body.role, req.user!.id);
  success(res, 200, 'User role updated successfully', result);
});

export const deleteUser = asyncHandler(async (req, res) => {
  await adminService.deleteUser(req.params.id, req.user!.id);
  success(res, 200, 'User deleted successfully');
});

export const listDeletedUsers = asyncHandler(async (req, res) => {
  const { search, page, limit } = req.query as { search?: string; page?: number; limit?: number };
  const result = await adminService.listDeletedUsers(search, page, limit);
  success(res, 200, 'Deleted users fetched successfully', result);
});

export const restoreUser = asyncHandler(async (req, res) => {
  const result = await adminService.restoreUser(req.params.id, req.user!.id);
  success(res, 200, 'User restored successfully', result);
});

export const permanentDeleteUser = asyncHandler(async (req, res) => {
  await adminService.permanentDeleteUser(req.params.id, req.user!.id, req.body.confirmName);
  success(res, 200, 'User permanently deleted');
});

export const permanentDeleteOrganization = asyncHandler(async (req, res) => {
  await adminService.permanentDeleteOrganization(req.params.id, req.body.confirmName);
  success(res, 200, 'Organization permanently deleted');
});

export const permanentDeleteVenueOwner = asyncHandler(async (req, res) => {
  await adminService.permanentDeleteVenueOwner(req.params.id, req.body.confirmName);
  success(res, 200, 'Venues permanently deleted');
});
