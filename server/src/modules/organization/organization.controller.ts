import * as orgService from './organization.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { success } from '../../utils/response.js';

export const createOrganization = asyncHandler(async (req, res) => {
  const org = await orgService.createOrganization(req.user!.id, req.body);
  success(res, 201, 'Organization created successfully', org);
});

export const getMyOrganization = asyncHandler(async (req, res) => {
  const org = await orgService.getOrganizationByOwner(req.user!.id);
  success(res, 200, 'Organization fetched successfully', org);
});

export const updateOrganization = asyncHandler(async (req, res) => {
  const org = await orgService.updateOrganization(req.user!.id, req.body);
  success(res, 200, 'Organization updated successfully', org);
});

export const deleteMyOrganization = asyncHandler(async (req, res) => {
  await orgService.deleteMyOrganization(req.user!.id);
  success(res, 200, 'Organization deleted successfully');
});

export const addMember = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { email, role } = req.body;
  const member = await orgService.addMember(req.user!.id, id, email, role);
  success(res, 201, 'Member added successfully', member);
});

export const getMembers = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const members = await orgService.getMembers(id);
  success(res, 200, 'Members fetched successfully', members);
});

export const removeMember = asyncHandler(async (req, res) => {
  const { id, memberId } = req.params;
  await orgService.removeMember(req.user!.id, id, memberId);
  success(res, 200, 'Member removed successfully');
});

export const getFinance = asyncHandler(async (req, res) => {
  const finance = await orgService.getOrganizationFinance(req.user!.organizationId!);
  return success(res, 200, 'Finance overview fetched', finance);
});