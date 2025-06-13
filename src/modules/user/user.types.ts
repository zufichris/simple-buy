export enum UserStatus {
  ACTIVE = "ACTIVE",
  DEACTIVATED = "DEACTIVATED",
  SUSPENDED = "SUSPENDED",
}

export enum UserRole {
  CUSTOMER = "CUSTOMER",
  VENDOR = "VENDOR",
  ADMIN = "ADMIN",
}

export interface Address {
  id: string;
  userId: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  label: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  role: UserRole;
  status: UserStatus;
  addresses: Address[]; 
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
