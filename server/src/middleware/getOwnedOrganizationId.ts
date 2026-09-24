import Organization from '../modules/organization/organization.model.js';
import OrganizationMember, { type OrganizationRole } from '../modules/organization/organizationMember.model.js';

export interface UserOrgContext {
  organizationId: string | null;
  orgRole: OrganizationRole | null;
}

const NOT_DELETED = { $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }] };

export async function getUserOrgContext(userId: string): Promise<UserOrgContext> {
  // 1. Check all memberships for this user (latest first)
  const members = await OrganizationMember.find({
    userId,
    ...NOT_DELETED,
  }).sort({ updatedAt: -1, createdAt: -1 });

  for (const m of members) {
    if (!m.organizationId) continue;

    // Check if this organization exists in the organizations collection
    const org = await Organization.findOne({
      _id: m.organizationId,
      ...NOT_DELETED,
    }).select('_id');

    if (org) {
      return {
        organizationId: org._id.toString(),
        orgRole: m.role as OrganizationRole,
      };
    }
  }

  // 2. Also check if user is the direct owner of an organization
  const ownedOrg = await Organization.findOne({
    ownerId: userId,
    ...NOT_DELETED,
  }).select('_id');

  if (ownedOrg) {
    return {
      organizationId: ownedOrg._id.toString(),
      orgRole: 'owner',
    };
  }

  return { organizationId: null, orgRole: null };
}

export async function getOwnedOrganizationId(userId: string): Promise<string | null> {
  const ctx = await getUserOrgContext(userId);
  return ctx.organizationId;
}