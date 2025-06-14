import { faker } from "@faker-js/faker";
import {
  Address,
  User,
  UserRole,
  UserStatus,
} from "../../src/modules/user/user.types";
import { CreateUserDTO, UpdateUserDTO } from "../../src/modules/user/user.dtos";

export class TestDataFactory {
  constructor() { }
  static createUser(overrides?: Partial<User>): User {
    return {
      id: faker.string.uuid(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      phoneNumber: faker.phone.number(),
      email: faker.internet.email(),
      addresses: this.createAddresses(),
      lastLoginAt: new Date(),
      createdAt: faker.date.past(),
      role: faker.helpers.arrayElement(Object.values(UserRole)),
      status: faker.helpers.arrayElement(Object.values(UserStatus)),
      updatedAt: new Date(),
      ...overrides,
    };
  }
  static createAddresses(addresses?: Address[]): Address[] {
    const addreses: Address[] = Array.from({ length: 3 })
      .fill(0)
      .map((_) => ({
        userId: faker.string.uuid(),
        id: faker.string.uuid(),
        city: faker.location.city(),
        isDefault: faker.datatype.boolean(),
        label: faker.lorem.text(),
        postalCode: faker.location.zipCode(),
        country: faker.location.country(),
        state: faker.location.state(),
        street: faker.location.street(),
        updatedAt: new Date(),
        createdAt: faker.date.past(),
      }));

    return (
      addresses || faker.helpers.arrayElements(addreses, { min: 0, max: 3 })
    );
  }
  static createUserDto(overrides?: Partial<CreateUserDTO>): CreateUserDTO {
    return {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      password: faker.internet.password(),
      email: faker.internet.email(),
      ...overrides,
    };
  }
  static updateUserDto(overrides?: Partial<UpdateUserDTO>): UpdateUserDTO {
    return {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      phoneNumber: faker.phone.number(),
      ...overrides,
    };
  }
}
