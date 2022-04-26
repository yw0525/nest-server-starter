import { Injectable } from '@nestjs/common';
import { PostsEntity } from './entity/posts.entity';

export interface PostsResult {
  list: PostsEntity[];
  count: number;
}

@Injectable()
export class PostsService {}
