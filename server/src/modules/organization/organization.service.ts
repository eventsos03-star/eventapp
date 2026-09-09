import Organization, { type IOrganization } from './organization.model.js';
import OrganizationMember from './organizationMember.model.js';
import User from '../auth/user.model.js';
import { AppError } from '../../utils/AppError.js';

type OrgResponse = Record<string, unknown> & { id: string };

const NOT_DELETED = { $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }] };

function serialize(doc: object): OrgResponse {
  const raw = doc as unknown as Record<string, unknown>;
  const { _id, ...rest } = raw;
  return { id: String(_id), ...rest };
}

// ── Organization CRUD ──

export async function createOrganization(
  ownerId: string,
  data: {
    organizationName: string;
    organizationType: string;
    description?: string;
    email: string;
    phoneNumber?: string;
    address?: { street?: string; city?: string; state?: string; postalCode?: string; country?: string };
  },
): Promise<OrgResponse> {
  const existing = await Organization.findOne({ ownerId, ...NOT_DELETED });
  if (existing) {
    throw new AppError('You already have an organization. One user can own one organization.', 400);
  }

  const org = await Organization.create({
    organizationName: data.organizationName,
    organizationType: data.organizationType,
    description: data.description ?? '',
    email: data.email,
    phoneNumber: data.phoneNumber,
    address: {
      street: data.address?.street ?? '',
      city: data.address?.city ?? '',
      state: data.address?.state ?? '',
      postalCode: data.address?.postalCode ?? '',
      country: data.address?.country ?? 'India',
    },
    ownerId,
    status: 'pending',
  });

  await OrganizationMember.create({
    organizationId: org._id,
    userId: ownerId,
    role: 'owner',
    inviteStatus: 'accepted',
    invitedBy: ownerId,
  });

  return serialize(org.toObject() as object);
}

export async function getOrganizationByOwner(ownerId: string): Promise<OrgResponse | null> {
  const org = await Organization.findOne({ ownerId }).lean();
  if (!org) return null;
  return serialize(org as object);
}

export async function deleteMyOrganization(ownerId: string): Promise<void> {
  const org = await Organization.findOne({ ownerId, ...NOT_DELETED });
  if (!org) throw new AppError('Organization not found', 404);

  org.isDeleted = true;
  await org.save();
}

export async function updateOrganization(
  ownerId: string,
  data: Record<string, unknown>,
): Promise<OrgResponse> {
  const org = await Organization.findOne({ ownerId, isDeleted: false });
  if (!org) throw new AppError('Organization not found', 404);

  if (org.status === 'rejected') {
    org.status = 'pending';
    org.rejectionReason = undefined;
  }

  Object.assign(org, data);
  await org.save();

  return serialize(org.toObject() as object);
}

// ── Member Management ──

export async function addMember(
  ownerId: string,
  organizationId: string,
  email: string,
  role: 'organizer' | 'member',
): Promise<OrgResponse> {
  const org = await Organization.findOne({ _id: organizationId, ownerId, isDeleted: false });
  if (!org) throw new AppError('Organization not found', 404);

  const user = await User.findOne({ email, $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }] });
  if (!user) throw new AppError('No user found with this email', 404);

  const existing = await OrganizationMember.findOne({
    organizationId,
    userId: user._id,
    isDeleted: false,
  });
  if (existing) throw new AppError('User is already a member of this organization', 400);

  const member = await OrganizationMember.create({
    organizationId,
    userId: user._id,
    role,
    inviteStatus: 'accepted',
    invitedBy: ownerId,
    inviteEmail: email,
  });

  return serialize(member.toObject());
}

export async function getMembers(organizationId: string): Promise<OrgResponse[]> {
  const members = await OrganizationMember.find({ organizationId, isDeleted: false })
    .populate('userId', 'firstName lastName email avatar')
    .sort({ createdAt: 1 })
    .lean();

  return members.map((m) => serialize(m as unknown as object));
}

export async function removeMember(
  ownerId: string,
  organizationId: string,
  memberId: string,
): Promise<void> {
  const org = await Organization.findOne({ _id: organizationId, ownerId, isDeleted: false });
  if (!org) throw new AppError('Organization not found', 404);

  const member = await OrganizationMember.findOne({ _id: memberId, organizationId, isDeleted: false });
  if (!member) throw new AppError('Member not found', 404);
  if (member.role === 'owner') throw new AppError('Cannot remove the organization owner', 400);

  member.isDeleted = true;
  await member.save();
}
