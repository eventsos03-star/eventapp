import User, { type SafeUser, type UserDoc } from '../modules/auth/user.model.js';
import { AppError } from '../utils/AppError.js';
import { getOwnedOrganizationId } from "../middleware/getOwnedOrganizationId.js"
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

  const organizationId = await getOwnedOrganizationId(id);

  return {
    ...user.toSafeObject(),
    organizationId ,
  };
}