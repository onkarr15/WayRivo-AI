import { z } from 'zod';
import { UserRole } from '@prisma/client';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  phone: z.string().optional(),
  role: z.nativeEnum(UserRole).default(UserRole.USER),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const verifyResetTokenSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z
    .string()
    .min(12, 'Password must be at least 12 characters long')
    .max(128, 'Password cannot exceed 128 characters'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  avatarUrl: z.string().url().optional().or(z.literal('')).nullable(),
  preferredDestinations: z.array(z.string()).optional(),
  travelInterests: z.array(z.string()).optional(),
  budgetPreference: z.string().optional(),
  preferredCurrency: z.string().length(3).optional(),
  // Address Information
  country: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  // Agency / Expert Information
  organizationName: z.string().optional().nullable(),
  agencyName: z.string().optional().nullable(),
  websiteUrl: z.string().optional().nullable(),
  specializations: z.string().optional().nullable(),
  yearsOfExperience: z.coerce.number().optional().nullable(),
  description: z.string().optional().nullable(),
  languages: z.array(z.string()).optional(),
});

export const deleteAccountSchema = z.object({
  confirmation: z.string().min(1, "Please type 'DELETE' to confirm"),
  password: z.string().optional(),
  reason: z.string().optional(),
});
