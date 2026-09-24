import User, { type SafeUser, type UserDoc } from '../modules/auth/user.model.js';
import { AppError } from '../utils/AppError.js';
import { getOwnedOrganizationId, getUserOrgContext } from "../middleware/getOwnedOrganizationId.js"
export async function getUserByEmail(email: string, includePassword = false): Promise<UserDoc | null> {
  const query = User.findOne({ email, $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }] });
  if (includePassword) query.select('+password');
  return query;
}

export async function getUserById(id: string, includePassword = false): Promise<UserDoc | null> {
  const query = User.findById(id);
  if (includePassword) query.select('+password');
  return query;
}

export async function getSafeUserById(id: string): Promise<SafeUser> {
  const user = await getUserById(id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

 const { organizationId, orgRole } = await getUserOrgContext(id);

  return {
    ...user.toSafeObject(),
    organizationId,
    orgRole, // ✅ Passes orgRole to the frontend
  } as any;
}