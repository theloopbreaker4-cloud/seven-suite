import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, HttpCode } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CommentService } from '../services/comment.service';
import { Comment } from '../schemas/comment.schema';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentService: CommentService) {}

  // Public: approved comments for a specific post
  @Get('post/:postId')
  getApproved(@Param('postId') postId: string): Promise<Comment[]> {
    return this.commentService.findApproved(postId);
  }

  // Admin: all comments with optional filters
  @Get()
  @UseGuards(JwtAuthGuard)
  getAll(
    @Query('postId') postId?: string,
    @Query('approved') approved?: string,
  ): Promise<Comment[]> {
    const approvedFilter = approved === 'true' ? true : approved === 'false' ? false : undefined;
    return this.commentService.findAll(postId, approvedFilter);
  }

  // Public: submit a comment (pending approval)
  @Post()
  create(@Body() body: Partial<Comment>): Promise<Comment> {
    return this.commentService.create(body);
  }

  @Put(':id/approve')
  @UseGuards(JwtAuthGuard)
  approve(@Param('id') id: string): Promise<Comment | null> {
    return this.commentService.approve(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  remove(@Param('id') id: string): Promise<Comment | null> {
    return this.commentService.remove(id);
  }
}
