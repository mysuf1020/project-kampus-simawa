import z from 'zod'

export const loginSchema = z.object({
  email: z
    .string('Email is required')
    .email('Invalid email format')
    .max(50, 'Email must be less than 50 characters'),
  password: z
    .string('Password is required')
    .max(50, 'Password must be less than 50 characters'),
})
export type LoginFormSchema = z.infer<typeof loginSchema>
