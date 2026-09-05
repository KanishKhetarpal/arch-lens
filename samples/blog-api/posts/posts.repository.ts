import { Injectable } from '@nestjs/common';
import { Post } from './interfaces/post.interface';

@Injectable()
export class PostsRepository {
  private readonly posts: Post[] = [];

  save(post: Post): void {
    this.posts.push(post);
  }

  findAll(): Post[] {
    return this.posts;
  }
}
