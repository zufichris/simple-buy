import { t, Static } from 'elysia';
import { UserRole, UserStatus } from './user.types';

const UserPublicSchema = t.Object({
  id: t.String({ format: 'uuid' }),
  firstName: t.String(),
  lastName: t.String(),
});

export const UserPublicResponseSchema = UserPublicSchema;
export type UserPublicResponse = Static<typeof UserPublicResponseSchema>;

export const AddressResponseSchema = t.Object({
  id: t.String({ format: 'uuid' }),
  street: t.String(),
  city: t.String(),
  state: t.String(),
  postalCode: t.String(),
  country: t.String({ default: 'USA' }),
  isDefault: t.Boolean(),
  label: t.Nullable(t.String({ description: 'e.g., "Home", "Work"' })),
});
export type AddressResponse = Static<typeof AddressResponseSchema>;
export const UpsertAddressSchema = t.Object({
  street: t.String({ minLength: 3 }),
  city: t.String({ minLength: 2 }),
  state: t.String({ minLength: 2 }),
  postalCode: t.String({ minLength: 5 }),
  country: t.String({ minLength: 2, default: 'USA' }),
  isDefault: t.Boolean({ default: false }),
  label: t.Optional(t.Nullable(t.String())),
});
export type UpsertAddressDTO = Static<typeof UpsertAddressSchema>;

export const UserPrivateResponseSchema = t.Composite([
  UserPublicSchema,
  t.Object({
    email: t.String({ format: 'email' }),
    phoneNumber: t.Nullable(t.String()),
    role: t.Enum(UserRole),
    status: t.Enum(UserStatus),
    addresses: t.Array(AddressResponseSchema),
    lastLoginAt: t.Nullable(t.Date()),
    createdAt: t.Date(),
    updatedAt: t.Date(),
  }),
]);
export type UserPrivateResponse = Static<typeof UserPrivateResponseSchema>;

export const CreateUserSchema = t.Object({
  firstName: t.String({ minLength: 1, maxLength: 50 }),
  lastName: t.String({ minLength: 1, maxLength: 50 }),
  email: t.String({ format: 'email' }),
  password: t.String({
    minLength: 8,
    description: 'Password must be at least 8 characters long.',
  }),
});
export type CreateUserDTO = Static<typeof CreateUserSchema>;

export const UpdateUserSchema = t.Partial(
  t.Object({
    firstName: t.String({ minLength: 1, maxLength: 50 }),
    lastName: t.String({ minLength: 1, maxLength: 50 }),
    phoneNumber: t.Nullable(t.String()),
  })
);
export type UpdateUserDTO = Static<typeof UpdateUserSchema>;
