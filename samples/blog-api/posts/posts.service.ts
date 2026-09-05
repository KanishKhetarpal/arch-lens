import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { CreatePostDto } from './dto/create-post.dto';
import { Post } from './interfaces/post.interface';
import { PostsRepository } from './posts.repository';

@Injectable()
export class PostsService {
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly usersService: UsersService,
  ) {}

  create(dto: CreatePostDto): Post {
    const author = this.usersService.findById(dto.authorId);
    if (!author) {
      throw new NotFoundException(`No user with id ${dto.authorId}`);
    }

    const post: Post = {
      id: String(this.postsRepository.findAll().length + 1),
      title: dto.title,
      body: dto.body,
      author,
    };
    this.postsRepository.save(post);
    return post;
  }

  findAll(): Post[] {
    return this.postsRepository.findAll();
  }
}
