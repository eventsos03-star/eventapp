import User from '../auth/user.model.js';
import Session from '../auth/session.model.js';
import Organization from '../organization/organization.model.js';
import OrganizationMember from '../organization/organizationMember.model.js';
import Venue from '../venue/venue.model.js';
import Event from '../event/event.model.js';
import { AppError } from '../../utils/AppError.js';
import type { UserRole } from '../../types/index.js';

export type ResourceStatus = 'pending' | 'approved' | 'rejected' | 'blocked';

const DEFAULT_STATUS: ResourceStatus = 'pending';

const NOT_DELETED = { $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }] };

export interface AdminStats {
  totalOrganizations: number;
  pendingOrganizations: number;
  totalVenueOwners: number;
  pendingVenueOwners: number;
  totalUsers: number;
}

export interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status: string;
  provider: string;
  createdAt: string;
}

export interface VenueOwnerSummary {
  ownerId: string;
  firstName: string;
  lastName: string;
  email: string;
  venueCount: number;
  isOwnerDeleted: boolean;
  venues: VenueResponse[];
}

type OrganizationResponse = Record<string, unknown> & { id: string };
type VenueResponse = Record<string, unknown> & { id: string };

function serializeOrganization<T extends object>(doc: T): OrganizationResponse {
  const { _id, ...rest } = doc as Record<string, unknown>;
  return { id: String(_id), ...rest };
}

function serializeVenue<T extends object>(doc: T): VenueResponse {
  const { _id, ...rest } = doc as Record<string, unknown>;
  return { id: String(_id), ...rest };
}

export async function getAdminStats(): Promise<AdminStats> {
  const [totalOrganizations, pendingOrganizations, totalVenueOwners, pendingVenueOwners, totalUsers] =
    await Promise.all([
      Organization.countDocuments(NOT_DELETED),
      Organization.countDocuments({ status: DEFAULT_STATUS, ...NOT_DELETED }),
      Venue.distinct('ownerId', NOT_DELETED),
      Venue.distinct('ownerId', { status: DEFAULT_STATUS, ...NOT_DELETED }),
      User.countDocuments(NOT_DELETED),
    ]);

  return {
    totalOrganizations,
    pendingOrganizations,
    totalVenueOwners: totalVenueOwners.length,
    pendingVenueOwners: pendingVenueOwners.length,
    totalUsers,
  };
}

export async function listOrganizations(status: ResourceStatus | 'deleted' = DEFAULT_STATUS): Promise<OrganizationResponse[]> {
  const isDeletedStatus = status === 'deleted';
  const filter: Record<string, unknown> =
    isDeletedStatus
      ? { isDeleted: true }
      : { status, ...NOT_DELETED };
  const organizations = await Organization.find(filter).sort({ createdAt: 1 }).lean();

  let ownerDeletedById = new Map<string, boolean>();
  if (isDeletedStatus) {
    const ownerIds = [...new Set(organizations.map((org) => String(org.ownerId)))];
    const ownerUsers = await User.find({ _id: { $in: ownerIds } }).select('isDeleted').lean();
    ownerDeletedById = new Map(ownerUsers.map((user) => [String(user._id), user.isDeleted === true]));
  }

  return organizations.map((org) => {
    const response = serializeOrganization(org);
    response.isOwnerDeleted = isDeletedStatus ? ownerDeletedById.get(String(org.ownerId)) ?? true : false;
    return response;
  });
}

async function updateOrganizationStatus(id: string, target: ResourceStatus): Promise<OrganizationResponse> {
  const organization = await Organization.findById(id);
  if (!organization) throw new AppError('Organization not found', 404);
  if (organization.status !== DEFAULT_STATUS) {
    throw new AppError(`Organization is already ${organization.status}`, 400);
  }

  organization.status = target;
  await organization.save();

  return serializeOrganization(organization.toObject());
}

export async function approveOrganization(id: string): Promise<OrganizationResponse> {
  const organization = await Organization.findOne({ _id: id, ...NOT_DELETED });
  if (!organization) throw new AppError('Organization not found', 404);
  if (organization.status !== DEFAULT_STATUS) {
    throw new AppError(`Organization is already ${organization.status}`, 400);
  }

  organization.status = 'approved';
  organization.approvedAt = new Date();
  organization.rejectionReason = undefined;
  await organization.save();

  return serializeOrganization(organization.toObject());
}

export async function rejectOrganization(id: string, reason: string): Promise<OrganizationResponse> {
  const organization = await Organization.findOne({ _id: id, ...NOT_DELETED });
  if (!organization) throw new AppError('Organization not found', 404);
  if (organization.status !== DEFAULT_STATUS) {
    throw new AppError(`Organization is already ${organization.status}`, 400);
  }

  organization.status = 'rejected';
  organization.rejectionReason = reason;
  organization.approvedAt = undefined;
  organization.approvedBy = undefined;
  await organization.save();

  return serializeOrganization(organization.toObject());
}

export async function getOrganizationDetail(id: string): Promise<OrganizationResponse> {
  const organization = await Organization.findById(id)
    .populate('ownerId', 'firstName lastName email')
    .populate('approvedBy', 'firstName lastName email')
    .lean();
  if (!organization) throw new AppError('Organization not found', 404);
  return serializeOrganization(organization as unknown as object);
}

/**
 * A venue owner is a user who owns at least one venue. "Pending" venue owners
 * are users with venues still awaiting review, so listing/approving/rejecting
 * an owner operates on their pending venues. This keeps the existing User +
 * Venue schema untouched (no extra VenueOwner model or status field).
 */
export async function listVenueOwners(status: ResourceStatus | 'deleted' = DEFAULT_STATUS): Promise<VenueOwnerSummary[]> {
  const venues = await Venue.find(
    status === 'deleted' ? { isDeleted: true } : { status, ...NOT_DELETED },
  ).sort({ createdAt: 1 }).lean();

  const venuesByOwner = new Map<string, VenueResponse[]>();
  for (const venue of venues) {
    const ownerId = String(venue.ownerId);
    const list = venuesByOwner.get(ownerId) ?? [];
    list.push(serializeVenue(venue));
    venuesByOwner.set(ownerId, list);
  }

  const ownerIds = [...venuesByOwner.keys()];
  const users = await User.find(
    status === 'deleted' ? { _id: { $in: ownerIds } } : { _id: { $in: ownerIds }, ...NOT_DELETED },
  )
    .select('firstName lastName email isDeleted')
    .lean();
  const userById = new Map(users.map((user) => [String(user._id), user]));

  const owners: VenueOwnerSummary[] = [];
  for (const [ownerId, ownerVenues] of venuesByOwner) {
    const user = userById.get(ownerId);
    if (!user) continue;

    owners.push({
      ownerId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      venueCount: ownerVenues.length,
      isOwnerDeleted: status === 'deleted' ? user.isDeleted === true : false,
      venues: ownerVenues,
    });
  }

  return owners;
}

async function updateVenueOwnerStatus(ownerId: string, target: ResourceStatus): Promise<VenueOwnerSummary> {
  const user = await User.findOne({ _id: ownerId, ...NOT_DELETED });
  if (!user) throw new AppError('Venue owner not found', 404);

  const pendingVenues = await Venue.countDocuments({ ownerId: user._id, status: DEFAULT_STATUS, ...NOT_DELETED });
  if (pendingVenues === 0) {
    throw new AppError('Venue owner has no pending venues', 400);
  }

  await Venue.updateMany({ ownerId: user._id, status: DEFAULT_STATUS, ...NOT_DELETED }, { status: target });

  const venues = await Venue.find({ ownerId: user._id, status: target, ...NOT_DELETED }).sort({ createdAt: 1 }).lean();

  return {
    ownerId: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    venueCount: venues.length,
    isOwnerDeleted: false,
    venues: venues.map(serializeVenue),
  };
}

export async function approveVenueOwner(ownerId: string): Promise<VenueOwnerSummary> {
  return updateVenueOwnerStatus(ownerId, 'approved');
}

export async function rejectVenueOwner(ownerId: string): Promise<VenueOwnerSummary> {
  return updateVenueOwnerStatus(ownerId, 'rejected');
}

function serializeUser(doc: { _id: unknown; firstName: string; lastName: string; email: string; role: string; status: string; provider: string; createdAt: unknown }): UserSummary {
  return {
    id: String(doc._id),
    firstName: doc.firstName,
    lastName: doc.lastName,
    email: doc.email,
    role: doc.role as UserRole,
    status: doc.status,
    provider: doc.provider,
    createdAt: String(doc.createdAt),
  };
}

export async function listUsers(
  search?: string,
  page = 1,
  limit = 20,
): Promise<{ users: UserSummary[]; total: number; page: number; totalPages: number }> {
  const filter: Record<string, unknown> = {
    $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
  };

  if (search) {
    const regex = new RegExp(search, 'i');
    filter.$and = [
      {
        $or: [
          { firstName: regex },
          { lastName: regex },
          { email: regex },
        ],
      },
    ];
  }

  const [total, docs] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .select('firstName lastName email role status provider createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  return {
    users: docs.map(serializeUser),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function updateUserRole(userId: string, role: UserRole, requesterId: string): Promise<UserSummary> {
  if (userId === requesterId) {
    throw new AppError('You cannot change your own role', 400);
  }

  const user = await User.findOne({ _id: userId, $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }] });
  if (!user) throw new AppError('User not found', 404);

  if (user.role === role) {
    throw new AppError(`User already has role ${role}`, 400);
  }

  if (user.role === 'ADMIN' && role === 'USER') {
    const adminCount = await User.countDocuments({
      role: 'ADMIN',
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
    });
    if (adminCount <= 1) {
      throw new AppError('Cannot remove the last admin', 400);
    }
  }

  user.role = role;
  await user.save();

  return serializeUser(user.toObject());
}

export async function deleteUser(userId: string, requesterId: string): Promise<void> {
  if (userId === requesterId) {
    throw new AppError('You cannot delete yourself', 400);
  }

  const user = await User.findOne({ _id: userId, $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }] });
  if (!user) throw new AppError('User not found', 404);

  if (user.role === 'ADMIN') {
    throw new AppError('Cannot delete an admin user', 400);
  }

  user.isDeleted = true;
  await user.save();

  await Organization.updateMany({ ownerId: user._id, ...NOT_DELETED }, { isDeleted: true });
  await Venue.updateMany({ ownerId: user._id, ...NOT_DELETED }, { isDeleted: true });
}

export async function listDeletedUsers(
  search?: string,
  page = 1,
  limit = 20,
): Promise<{ users: UserSummary[]; total: number; page: number; totalPages: number }> {
  const filter: Record<string, unknown> = { isDeleted: true };

  if (search) {
    const regex = new RegExp(search, 'i');
    filter.$and = [
      {
        $or: [
          { firstName: regex },
          { lastName: regex },
          { email: regex },
        ],
      },
    ];
  }

  const [total, docs] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .select('firstName lastName email role status provider createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  return {
    users: docs.map(serializeUser),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function restoreUser(userId: string, requesterId: string): Promise<UserSummary> {
  if (userId === requesterId) {
    throw new AppError('You cannot restore yourself', 400);
  }

  const user = await User.findOne({ _id: userId, isDeleted: true });
  if (!user) throw new AppError('Deleted user not found', 404);

  user.isDeleted = false;
  await user.save();

  await Organization.updateMany({ ownerId: user._id, isDeleted: true }, { isDeleted: false });
  await Venue.updateMany({ ownerId: user._id, isDeleted: true }, { isDeleted: false });

  return serializeUser(user.toObject());
}

export async function deleteOrganization(id: string): Promise<OrganizationResponse> {
  const organization = await Organization.findOne({ _id: id, ...NOT_DELETED });
  if (!organization) throw new AppError('Organization not found', 404);

  organization.isDeleted = true;
  await organization.save();

  return serializeOrganization(organization.toObject());
}

export async function restoreOrganization(id: string): Promise<OrganizationResponse> {
  const organization = await Organization.findOne({ _id: id, isDeleted: true });
  if (!organization) throw new AppError('Deleted organization not found', 404);

  const owner = await User.findById(organization.ownerId);
  if (!owner || owner.isDeleted) {
    throw new AppError('Organization owner is deleted. Restore the owner first.', 400);
  }

  organization.isDeleted = false;
  await organization.save();

  return serializeOrganization(organization.toObject());
}

export async function restoreVenueOwner(ownerId: string): Promise<VenueOwnerSummary> {
  const user = await User.findOne({ _id: ownerId, ...NOT_DELETED });
  if (!user) {
    throw new AppError('Venue owner is deleted. Restore the owner first.', 400);
  }

  const deletedVenues = await Venue.countDocuments({ ownerId: user._id, isDeleted: true });
  if (deletedVenues === 0) {
    throw new AppError('No deleted venues found for this venue owner', 400);
  }

  await Venue.updateMany({ ownerId: user._id, isDeleted: true }, { isDeleted: false });

  const venues = await Venue.find({ ownerId: user._id, ...NOT_DELETED }).sort({ createdAt: 1 }).lean();

  return {
    ownerId: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    venueCount: venues.length,
    isOwnerDeleted: false,
    venues: venues.map(serializeVenue),
  };
}

function fullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

export async function permanentDeleteUser(userId: string, requesterId: string, confirmName: string): Promise<void> {
  if (userId === requesterId) {
    throw new AppError('You cannot permanently delete yourself', 400);
  }

  const user = await User.findOne({ _id: userId, isDeleted: true });
  if (!user) throw new AppError('Deleted user not found', 404);

  if (user.role === 'ADMIN') {
    throw new AppError('Cannot permanently delete an admin user', 400);
  }

  if (confirmName !== fullName(user.firstName, user.lastName)) {
    throw new AppError('Confirmation name does not match', 400);
  }

  const orgs = await Organization.find({ ownerId: user._id }).select('_id').lean();
  const orgIds = orgs.map((org) => org._id);

  await Promise.all([
    OrganizationMember.deleteMany({ organizationId: { $in: orgIds } }),
    OrganizationMember.deleteMany({ userId: user._id }),
    Event.deleteMany({ organizationId: { $in: orgIds } }),
    Organization.deleteMany({ ownerId: user._id }),
    Venue.deleteMany({ ownerId: user._id }),
    Session.deleteMany({ user: user._id }),
    User.deleteOne({ _id: user._id }),
  ]);
}

export async function permanentDeleteOrganization(id: string, confirmName: string): Promise<void> {
  const organization = await Organization.findOne({ _id: id, isDeleted: true });
  if (!organization) throw new AppError('Deleted organization not found', 404);

  if (confirmName !== organization.organizationName) {
    throw new AppError('Confirmation name does not match', 400);
  }

  await Promise.all([
    OrganizationMember.deleteMany({ organizationId: organization._id }),
    Event.deleteMany({ organizationId: organization._id }),
    Organization.deleteOne({ _id: organization._id }),
  ]);
}

export async function permanentDeleteVenueOwner(ownerId: string, confirmName: string): Promise<void> {
  const user = await User.findById(ownerId);
  if (!user) throw new AppError('Venue owner not found', 404);

  if (confirmName !== fullName(user.firstName, user.lastName)) {
    throw new AppError('Confirmation name does not match', 400);
  }

  await Venue.deleteMany({ ownerId: user._id, isDeleted: true });
}
