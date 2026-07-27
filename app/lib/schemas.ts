import 'server-only';

import { z } from 'zod';

export const registrationSchema = z.object({
  name: z.string().min(2).max(64),
  gender: z.string().min(1).max(16),
  dob: z.string().regex(/^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/),
  email: z.string().email().max(64),
  phone: z.string().regex(/^\d{10}$/),
  userId: z.string().min(5).max(64),
  password: z.string().min(8).max(15)
});

export const loginSchema = z.object({
  loginId: z.string().min(1).max(64),
  password: z.string().min(1).max(15),
  rememberMe: z.boolean().optional()
});

export const cartUpsertSchema = z.object({
  slug: z.string().min(1).max(128),
  quantity: z.number().int().min(1).max(99)
});

export const cartRemoveSchema = z.object({
  slug: z.string().min(1).max(128).optional()
});

export const contactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(120),
  message: z.string().trim().min(1).max(2000)
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email().max(120)
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10).max(256),
  password: z.string().min(8).max(15)
});

export const adminProductSchema = z.object({
  slug: z.string().min(1).max(128),
  name: z.string().min(1).max(120),
  category: z.string().min(1).max(60),
  price: z.number().int().min(0).max(1000000),
  description: z.string().min(1).max(2000),
  badge: z.string().max(60).default(''),
  colors: z.array(z.string().max(40)).default([]),
  images: z.array(z.string().max(300)).default([]),
  detailImages: z.array(z.string().max(300)).default([]),
  details: z.array(z.string().max(300)).default([]),
  stock: z.number().int().min(0).max(1000000).default(100),
  isActive: z.boolean().default(true)
});

export const adminProductUpdateSchema = adminProductSchema.partial();
