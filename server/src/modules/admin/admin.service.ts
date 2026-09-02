import User from '../auth/user.model.js';
import Organization from '../organization/organization.model.js';
import Venue from '../venue/venue.model.js';
import { AppError } from '../../utils/AppError.js';
import type { UserRole } from '../../types/index.js';

export type ResourceStatus = 'pending' | 'approved' | 'rejected' | 'blocked';

const DEFAULT_STATUS: ResourceStatus = 'pending';

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
      Organization.countDocuments({}),
      Organization.countDocuments({ status: DEFAULT_STATUS }),
      Venue.distinct('ownerId', {}),
      Venue.distinct('ownerId', { status: DEFAULT_STATUS }),
      User.countDocuments({ $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }] }),
    ]);

  return {
    totalOrganizations,
    pendingOrganizations,
    totalVenueOwners: totalVenueOwners.length,
    pendingVenueOwners: pendingVenueOwners.length,
    totalUsers,
  };
}

export async function listOrganizations(status: ResourceStatus = DEFAULT_STATUS): Promise<OrganizationResponse[]> {
  const organizations = await Organization.find({ status }).sort({ createdAt: 1 }).lean();
  return organizations.map(serializeOrganization);
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
  const organization = await Organization.findById(id);
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
  const organization = await Organization.findById(id);
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
export async function listVenueOwners(status: ResourceStatus = DEFAULT_STATUS): Promise<VenueOwnerSummary[]> {
  const venues = await Venue.find({ status }).sort({ createdAt: 1 }).lean();

  const venuesByOwner = new Map<string, VenueResponse[]>();
  for (const venue of venues) {
    const ownerId = String(venue.ownerId);
    const list = venuesByOwner.get(ownerId) ?? [];
    list.push(serializeVenue(venue));
    venuesByOwner.set(ownerId, list);
  }

  const ownerIds = [...venuesByOwner.keys()];
  const users = await User.find({ _id: { $in: ownerIds }, $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }] })
    .select('firstName lastName email')
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
      venues: ownerVenues,
    });
  }

  return owners;
}

async function updateVenueOwnerStatus(ownerId: string, target: ResourceStatus): Promise<VenueOwnerSummary> {
  const user = await User.findOne({ _id: ownerId, $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }] });
  if (!user) throw new AppError('Venue owner not found', 404);

  const pendingVenues = await Venue.countDocuments({ ownerId: user._id, status: DEFAULT_STATUS });
  if (pendingVenues === 0) {
    throw new AppError('Venue owner has no pending venues', 400);
  }

  await Venue.updateMany({ ownerId: user._id, status: DEFAULT_STATUS }, { status: target });

  const venues = await Venue.find({ ownerId: user._id, status: target }).sort({ createdAt: 1 }).lean();

  return {
    ownerId: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    venueCount: venues.length,
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
