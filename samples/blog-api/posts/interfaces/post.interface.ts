import { User } from '../../users/interfaces/user.interface';

export interface Post {
  id: string;
  title: string;
  body: string;
  author: User;
}
