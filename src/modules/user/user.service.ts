import type { CreateUserDTO, UpdateUserDTO } from './user.dtos';
import type { IUserRepository } from './user.repository';
import { User } from './user.types';

export class UserAlreadyExistsError extends Error {
  constructor(email: string) {
    super(`User with email "${email}" already exists.`);
    this.name = 'UserAlreadyExistsError';
  }
}

export class UserService{
  constructor(
    private readonly userRepository: IUserRepository,
  ) {}

  async createUser(createDto: CreateUserDTO): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(createDto.email);
    if (existingUser) {
      throw new UserAlreadyExistsError(createDto.email);
    }

    const passwordHash =  this.hashPassword(createDto.password);
    const userToCreate = {
      ...createDto,
      passwordHash,
    };

    return this.userRepository.create(userToCreate);
  }
  async getUserById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.list();
  }
  async updateUser(id: string, updateDto: UpdateUserDTO): Promise<User | null> {
    const userExists = await this.userRepository.findById(id);
    if (!userExists) {
      return null;
    }
    return this.userRepository.update(id, updateDto);
  }

  async deleteUser(id: string): Promise<boolean> {
    const userExists = await this.userRepository.findById(id);
    if (!userExists) {
      return false;
    }
    return this.userRepository.delete(id);
  }

private  hashPassword(pass:string){
    //TODO Dummy 
    return Bun.sha(pass).toString()
  }
}
