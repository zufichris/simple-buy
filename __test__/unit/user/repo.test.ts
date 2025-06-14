import { beforeAll, beforeEach, describe, expect, it, mock } from "bun:test";
import { TestFactory } from "../../utils/mock";
import { TestDataFactory } from "../../utils/factory";
import { IUserRepository, UserRepository } from "../../../src/modules/user/user.repository";
import { Database } from "../../../src/shared/config/db";
import { UserRole, UserStatus } from "../../../src/modules/user/user.types";
import { CreateUserDTO } from "../../../src/modules/user/user.dtos";

describe("User Repository", function () {
  let mockDb: Database;
  let getPoolMock: any;
  let queryMock: any;
  let unsafeMock: any;
  let userRepository: IUserRepository;

  beforeAll(function () {
    console.log("Unit Test for User Repository");
  });

  beforeEach(function () {
    queryMock = mock(() => Promise.resolve([]));
    unsafeMock = mock(() => Promise.resolve([]));
    getPoolMock = mock(() => ({
      unsafe: unsafeMock,
      query: queryMock,
    }));
    mockDb = TestFactory.createMock<Database>({
      getPool: getPoolMock,
    });
    userRepository = new UserRepository(mockDb);
  });


  describe("Create User", function () {
    it("Should create a new user successfully", async function () {
      const createDto = TestDataFactory.createUserDto();
      const hashedPassword = "hashedPassword";
      const expectedUser = TestDataFactory.createUser({ firstName: createDto.firstName, lastName: createDto.lastName, email: createDto.email });
      queryMock.mockResolvedValue([expectedUser]);

      const newUser = await userRepository.create({ ...createDto, passwordHash: hashedPassword });

      expect(getPoolMock).toHaveBeenCalled();
      expect(queryMock).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO users"));
      expect(newUser).toEqual({
        id: expectedUser.id,
        firstName: expectedUser.firstName,
        lastName: expectedUser.lastName,
        email: expectedUser.email,
        phoneNumber: null,
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        lastLoginAt: null,
        createdAt: expectedUser.createdAt,
        updatedAt: expectedUser.updatedAt,
        addresses: [],
      });
    });

    it("Should throw an error when database insertion fails", async function () {
      const createDto = TestDataFactory.createUserDto();
      queryMock.mockRejectedValue(new Error("Database error"));

      await expect(userRepository.create({ ...createDto, passwordHash: "hashedPassword" })).rejects.toThrow("Database error");
    });

    it("Should handle empty result from database gracefully", async function () {
      const createDto = TestDataFactory.createUserDto();
      queryMock.mockResolvedValue([]);

      await expect(userRepository.create({ ...createDto, passwordHash: "hashedPassword" })).rejects.toThrow();
    });
  });

  // --- Test Cases for `findById` Method ---
  describe("Find By ID", function () {
    it("Should return a user when ID exists", async function () {
      const expectedUser = TestDataFactory.createUser();
      queryMock.mockResolvedValue([expectedUser]);

      const user = await userRepository.findById("some-id");

      expect(queryMock).toHaveBeenCalledWith(expect.stringContaining("SELECT * FROM users WHERE id"));
      expect(user).toEqual({
        id: expectedUser.id,
        firstName: expectedUser.firstName,
        lastName: expectedUser.lastName,
        email: expectedUser.email,
        phoneNumber: null,
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        lastLoginAt: null,
        createdAt: expectedUser.createdAt,
        updatedAt: expectedUser.updatedAt,
        addresses: [],
      });
    });

    it("Should return null when ID does not exist", async function () {
      queryMock.mockResolvedValue([]);

      const user = await userRepository.findById("non-existent-id");

      expect(user).toBeNull();
    });

    it("Should throw an error when database query fails", async function () {
      queryMock.mockRejectedValue(new Error("Database error"));

      await expect(userRepository.findById("some-id")).rejects.toThrow("Database error");
    });
  });

  describe("Find By Email", function () {
    it("Should return a user when email exists", async function () {
      const expectedUser = TestDataFactory.createUser();
      queryMock.mockResolvedValue([expectedUser]);

      const user = await userRepository.findByEmail("john.doe@example.com");

      expect(queryMock).toHaveBeenCalledWith(expect.stringContaining("SELECT * FROM users WHERE email"));
      expect(user).toEqual({
        id: expectedUser.id,
        firstName: expectedUser.firstName,
        lastName: expectedUser.lastName,
        email: expectedUser.email,
        phoneNumber: null,
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        lastLoginAt: null,
        createdAt: expectedUser.createdAt,
        updatedAt: expectedUser.updatedAt,
        addresses: [],
      });
    });

    it("Should return null when email does not exist", async function () {
      queryMock.mockResolvedValue([]);

      const user = await userRepository.findByEmail("nonexistent@example.com");

      expect(user).toBeNull();
    });

    it("Should throw an error when database query fails", async function () {
      queryMock.mockRejectedValue(new Error("Database error"));

      await expect(userRepository.findByEmail("john.doe@example.com")).rejects.toThrow("Database error");
    });
  });

  describe("Find One By", function () {
    it("Should delegate to findByEmail when email is provided", async function () {
      const expectedUser = TestDataFactory.createUser();
      queryMock.mockResolvedValue([expectedUser]);

      const user = await userRepository.findOneBy({ email: "john.doe@example.com" });

      expect(queryMock).toHaveBeenCalledWith(expect.stringContaining("SELECT * FROM users WHERE email"));
      expect(user).toEqual({
        id: expectedUser.id,
        firstName: expectedUser.firstName,
        lastName: expectedUser.lastName,
        email: expectedUser.email,
        phoneNumber: null,
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
        lastLoginAt: null,
        createdAt: expectedUser.createdAt,
        updatedAt: expectedUser.updatedAt,
        addresses: [],
      });
    });

    it("Should return null when no criteria are provided", async function () {
      const user = await userRepository.findOneBy({});

      expect(user).toBeNull();
    });

    it("Should return null when unsupported criteria are provided", async function () {
      const user = await userRepository.findOneBy({ firstName: "John" });

      expect(user).toBeNull();
    });
  });

  describe("List Users", function () {
    it("Should return all users", async function () {
      const users = [TestDataFactory.createUser(), TestDataFactory.createUser({ id: "other-id", email: "jane.doe@example.com" })];
      queryMock.mockResolvedValue(users);

      const result = await userRepository.list();

      expect(queryMock).toHaveBeenCalledWith(expect.stringContaining("SELECT * FROM users ORDER by email"));
      expect(result).toHaveLength(2);
      expect(result[0].email).toBe("jane.doe@example.com"); // Assuming ORDER BY email sorts alphabetically
    });

    it("Should return an empty array when no users exist", async function () {
      queryMock.mockResolvedValue([]);

      const result = await userRepository.list();

      expect(result).toEqual([]);
    });

    it("Should throw an error when database query fails", async function () {
      queryMock.mockRejectedValue(new Error("Database error"));

      await expect(userRepository.list()).rejects.toThrow("Database error");
    });
  });

  describe("Update User", function () {
    it("Should update a user successfully", async function () {
      const updateDto = { firstName: "Jane" };
      const expectedUser = TestDataFactory.createUser({ firstName: "Jane" });
      unsafeMock.mockResolvedValue([]);
      queryMock.mockResolvedValue([expectedUser]);

      const updatedUser = await userRepository.update("some-id", updateDto);

      expect(unsafeMock).toHaveBeenCalledWith(expect.stringContaining("UPDATE users SET firstName"), ["Jane", "some-id"]);
      expect(updatedUser?.firstName).toBe("Jane");
    });

    it("Should throw an error when no fields are provided", async function () {
      await expect(userRepository.update("some-id", {})).rejects.toThrow("No fields to update");
    });

    it("Should throw an error when user is not found after update", async function () {
      unsafeMock.mockResolvedValue([]);
      queryMock.mockResolvedValue([]);

      await expect(userRepository.update("some-id", { firstName: "Jane" })).rejects.toThrow("User not found after update");
    });

    it("Should throw an error when database update fails", async function () {
      unsafeMock.mockRejectedValue(new Error("Database error"));

      await expect(userRepository.update("some-id", { firstName: "Jane" })).rejects.toThrow("Database error");
    });
  });

  describe("Delete User", function () {
    it("Should delete a user successfully", async function () {
      queryMock.mockResolvedValue({ count: 1 });

      const result = await userRepository.delete("some-id");

      expect(queryMock).toHaveBeenCalledWith(expect.stringContaining("DELETE FROM users WHERE id"));
      expect(result).toBe(true);
    });

    it("Should return false when user does not exist", async function () {
      queryMock.mockResolvedValue({ count: 0 });

      const result = await userRepository.delete("non-existent-id");

      expect(result).toBe(false);
    });

    it("Should throw an error when database deletion fails", async function () {
      queryMock.mockRejectedValue(new Error("Database error"));

      await expect(userRepository.delete("some-id")).rejects.toThrow("Database error");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle special characters in create", async function () {
      const createDto:CreateUserDTO = { firstName: "Jöhn",password:"", lastName: "Döe", email: "jöhn.döe@example.com" };
      const expectedUser = TestDataFactory.createUser({ firstName: "Jöhn", lastName: "Döe", email: "jöhn.döe@example.com" });
      queryMock.mockResolvedValue([expectedUser]);

      const newUser = await userRepository.create({ ...createDto, passwordHash: "hashedPassword" });

      expect(newUser.firstName).toBe("Jöhn");
    });

    it("Should handle null values in update", async function () {
      const updateDto = { phoneNumber: null };
      const expectedUser = TestDataFactory.createUser({ phoneNumber: null });
      unsafeMock.mockResolvedValue([]);
      queryMock.mockResolvedValue([expectedUser]);

      const updatedUser = await userRepository.update("some-id", updateDto);

      expect(updatedUser?.phoneNumber).toBeNull();
    });
  });
});
