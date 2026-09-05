import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './interfaces/user.interface';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  create(dto: CreateUserDto): User {
    const user: User = { id: String(this.usersRepository.findAll().length + 1), ...dto };
    this.usersRepository.save(user);
    return user;
  }

  findById(id: string): User | undefined {
    return this.usersRepository.findById(id);
  }

  findAll(): User[] {
    return this.usersRepository.findAll();
  }
}
