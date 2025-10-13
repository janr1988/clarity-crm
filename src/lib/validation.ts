import { z } from "zod";

// User schemas
export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["SALES_LEAD", "SALES_AGENT", "MANAGER"]),
  teamId: z.string().uuid().optional(),
  avatar: z.string().url().optional(),
});

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(2).optional(),
  role: z.enum(["SALES_LEAD", "SALES_AGENT", "MANAGER"]).optional(),
  teamId: z.string().uuid().optional().nullable(),
  avatar: z.string().url().optional(),
  isActive: z.boolean().optional(),
});

// Task schemas
export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).default("TODO"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  dueDate: z.string().datetime().optional(),
  assigneeId: z.string().uuid().optional(),
  teamId: z.string().uuid().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  assigneeId: z.string().uuid().optional().nullable(),
  teamId: z.string().uuid().optional().nullable(),
});

// Activity schemas
export const createActivitySchema = z.object({
  type: z.enum(["CALL", "MEETING", "EMAIL", "NOTE", "OTHER"]),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  duration: z.number().int().positive().optional(),
  userId: z.string().uuid(),
});

export const updateActivitySchema = z.object({
  type: z.enum(["CALL", "MEETING", "EMAIL", "NOTE", "OTHER"]).optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  duration: z.number().int().positive().optional().nullable(),
});

// CallNote schemas
export const createCallNoteSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  clientCompany: z.string().optional(),
  phoneNumber: z.string().optional(),
  notes: z.string().min(1, "Notes are required"),
  summary: z.string().optional(),
  outcome: z.string().optional(),
  followUpDate: z.string().datetime().optional(),
  userId: z.string().uuid(),
});

export const updateCallNoteSchema = z.object({
  clientName: z.string().min(1).optional(),
  clientCompany: z.string().optional(),
  phoneNumber: z.string().optional(),
  notes: z.string().min(1).optional(),
  summary: z.string().optional(),
  aiSummary: z.string().optional(),
  outcome: z.string().optional(),
  followUpDate: z.string().datetime().optional().nullable(),
});

// Team schemas
export const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  description: z.string().optional(),
});

export const updateTeamSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

// Customer schemas
export const createCustomerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  company: z.string().optional().or(z.literal("")),
  position: z.string().optional().or(z.literal("")),
  status: z.enum(["LEAD", "PROSPECT", "CUSTOMER", "INACTIVE"]),
  source: z.enum(["WEBSITE", "REFERRAL", "COLD_CALL", "SOCIAL_MEDIA", "TRADE_SHOW", "OTHER"]).optional(),
  value: z.number().positive().optional(),
  notes: z.string().optional().or(z.literal("")),
  assignedTo: z.string().uuid().optional(),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  company: z.string().optional().or(z.literal("")),
  position: z.string().optional().or(z.literal("")),
  status: z.enum(["LEAD", "PROSPECT", "CUSTOMER", "INACTIVE"]).optional(),
  source: z.enum(["WEBSITE", "REFERRAL", "COLD_CALL", "SOCIAL_MEDIA", "TRADE_SHOW", "OTHER"]).optional(),
  value: z.number().positive().optional(),
  notes: z.string().optional().or(z.literal("")),
  assignedTo: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
});

// Company schemas
export const createCompanySchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters"),
  industry: z.enum([
    "TECHNOLOGY", "FINANCE", "HEALTHCARE", "MANUFACTURING", "RETAIL", 
    "EDUCATION", "ENERGY", "AUTOMOTIVE", "AEROSPACE", "CONSTRUCTION",
    "FOOD_BEVERAGE", "PHARMACEUTICALS", "TELECOMMUNICATIONS", "MEDIA", "TRANSPORTATION"
  ]).optional(),
  size: z.enum(["STARTUP", "SMALL", "MEDIUM", "LARGE", "ENTERPRISE"]).optional(),
  revenue: z.number().positive().optional(),
  employees: z.number().int().positive().optional(),
  website: z.string().url().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "PROSPECT", "PARTNER", "INACTIVE"]).optional(),
  foundedYear: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  assignedTo: z.string().uuid().optional(),
});

export const updateCompanySchema = z.object({
  name: z.string().min(2).optional(),
  industry: z.enum([
    "TECHNOLOGY", "FINANCE", "HEALTHCARE", "MANUFACTURING", "RETAIL", 
    "EDUCATION", "ENERGY", "AUTOMOTIVE", "AEROSPACE", "CONSTRUCTION",
    "FOOD_BEVERAGE", "PHARMACEUTICALS", "TELECOMMUNICATIONS", "MEDIA", "TRANSPORTATION"
  ]).optional(),
  size: z.enum(["STARTUP", "SMALL", "MEDIUM", "LARGE", "ENTERPRISE"]).optional(),
  revenue: z.number().positive().optional(),
  employees: z.number().int().positive().optional(),
  website: z.string().url().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "PROSPECT", "PARTNER", "INACTIVE"]).optional(),
  foundedYear: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  assignedTo: z.string().uuid().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
export type CreateCallNoteInput = z.infer<typeof createCallNoteSchema>;
export type UpdateCallNoteInput = z.infer<typeof updateCallNoteSchema>;
export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;

