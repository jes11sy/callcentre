import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { comparePassword, hashPassword } from '../utils/password';
import { generateToken, generateRefreshToken } from '../utils/jwt';
import { createError } from '../middleware/errorHandler';
import { logger } from '../config/logger';

interface LoginRequest {
  login: string;
  password: string;
  role: 'admin' | 'operator';
}

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { login, password, role }: LoginRequest = req.body;

    if (!login || !password || !role) {
      throw createError('Login, password and role are required', 400);
    }

    let user;
    
    // Check user based on role
    if (role === 'admin') {
      user = await prisma.callcentreAdmin.findUnique({
        where: { login }
      });
    } else if (role === 'operator') {
      user = await prisma.callcentreOperator.findUnique({
        where: { login }
      });
    } else {
      throw createError('Invalid role', 400);
    }

    if (!user) {
      throw createError('Invalid credentials', 401);
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      throw createError('Invalid credentials', 401);
    }

    // Check operator status if operator
    if (role === 'operator') {
      const operator = user as any;
      if (operator.status !== 'active') {
        throw createError('Account is not active', 401);
      }
    }

    // Generate tokens
    const tokenPayload = {
      id: user.id,
      login: user.login,
      role,
      name: role === 'operator' ? (user as any).name : undefined
    };

    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Log successful login
    logger.info(`User logged in: ${login} (${role})`, {
      userId: user.id,
      role,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          login: user.login,
          role,
          name: role === 'operator' ? (user as any).name : undefined
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // In a production app, you might want to blacklist the token
    // For now, we'll just log the logout
    logger.info(`User logged out: ${req.user?.login} (${req.user?.role})`, {
      userId: req.user?.id,
      role: req.user?.role,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw createError('Refresh token is required', 400);
    }

    // Verify refresh token (same as access token for now)
    const payload = require('../utils/jwt').verifyToken(refreshToken);
    
    // Generate new access token
    const newAccessToken = generateToken({
      id: payload.id,
      login: payload.login,
      role: payload.role,
      name: payload.name
    });

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken
      }
    });
  } catch (error) {
    next(createError('Invalid refresh token', 401));
  }
};

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    let userDetails;

    if (req.user.role === 'admin') {
      userDetails = await prisma.callcentreAdmin.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          login: true,
          note: true,
          createdAt: true
        }
      });
    } else {
      userDetails = await prisma.callcentreOperator.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          name: true,
          login: true,
          city: true,
          status: true,
          statusWork: true,
          dateCreate: true,
          note: true,
          createdAt: true
        }
      });
    }

    if (!userDetails) {
      throw createError('User not found', 404);
    }

    res.json({
      success: true,
      data: {
        ...userDetails,
        role: req.user.role
      }
    });
  } catch (error) {
    next(error);
  }
};
