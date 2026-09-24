  import type { NextFunction, Response } from 'express';
  import User from '../modules/auth/user.model.js';
  import { AppError } from '../utils/AppError.js';
  import { asyncHandler } from '../utils/asyncHandler.js';
  import { verifyAccessToken } from '../services/token.service.js';
  import { ACCESS_COOKIE_NAME } from '../constants/index.js';
  import { USER_STATUS } from '../constants/index.js';
  import {getOwnedOrganizationId} from "./getOwnedOrganizationId.js"
  /**
   * Protects routes. Requires a valid access token from the httpOnly access
   * cookie or a Bearer Authorization header, and loads the user into req.user.
   * Rejects blocked, pending or deleted accounts.
   */
  export const authenticate = asyncHandler(async (req, _res: Response, next: NextFunction) => {
     console.log("AUTHENTICATE START");
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.split(' ')[1] : req.cookies?.[ACCESS_COOKIE_NAME];
    console.log("TOKEN EXISTS:", !!token);
    if (!token) {
      throw new AppError('Not authenticated. Please login.', 401);
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
      console.log("TOKEN PAYLOAD:", payload);
    } catch(error) {
      console.log("TOKEN VERIFY ERROR:", error);
      throw new AppError('Session expired. Please login again.', 401);
    }

     console.log("PAYLOAD ID:", payload.id);

    const user = await User.findById(payload.id).where({ $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }] });

    console.log("USER FOUND:", !!user);

    if (!user) throw new AppError('Account no longer exists', 401);

    console.log("USER STATUS:", user.status);

    if (user.status !== USER_STATUS.ACTIVE) {
      throw new AppError(user.status === 'BLOCKED' ? 'Your account has been blocked' : 'Please verify your email before logging in', 403);
    }

    const organizationId = await getOwnedOrganizationId(user.id);

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      organizationId,
    };

    console.log("REQ.USER CREATED:", req.user);

    req.sessionId = payload.sessionId;

    console.log("AUTHENTICATE SUCCESS");
    next();
  });
