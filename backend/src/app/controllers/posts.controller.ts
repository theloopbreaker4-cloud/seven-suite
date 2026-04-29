import { Controller, Get, Post, Put, Delete, Param, Body, Query, HttpCode, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PostService } from '../services/post.service';
import { Post as PostDoc } from '../schemas/post.schema';

@Controller('posts')
export class PostsController {
  constructor(private readonly postService: PostService) {}

  @Get()
  getAll(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<PostDoc[]> {
    return this.postService.findAll(
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get('all')
  @UseGuards(JwtAuthGuard)
  getAllAdmin(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.postService.findAllAdmin(
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string): Promise<PostDoc | null> {
    return this.postService.findBySlug(slug);
  }

  @Post()
  create(@Body() body: Partial<PostDoc>): Promise<PostDoc> {
    return this.postService.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Partial<PostDoc>): Promise<PostDoc | null> {
    return this.postService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string): Promise<PostDoc | null> {
    return this.postService.remove(id);
  }
}
