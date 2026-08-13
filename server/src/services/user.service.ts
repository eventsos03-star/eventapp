import User, { type SafeUser, type UserDoc } from '../modules/auth/user.model.js';
import { AppError } from '../utils/AppError.js';

export async function getUserByEmail(email: string, includePassword = false): Promise<UserDoc | null> {
  const query = User.findOne({ email, deletedAt: null });
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
  if (!user) throw new AppError('User not found', 404);
  return user.toSafeObject();
}
