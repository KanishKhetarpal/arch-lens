import { Injectable } from '@nestjs/common';
import { User } from './interfaces/user.interface';

@Injectable()
export class UsersRepository {
  private readonly users: User[] = [];

  save(user: User): void {
    this.users.push(user);
  }

  findById(id: string): User | undefined {
    return this.users.find((user) => user.id === id);
  }

  findAll(): User[] {
    return this.users;
  }
}
