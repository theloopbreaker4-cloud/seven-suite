import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, HttpCode } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TagService } from '../services/tag.service';
import { Tag } from '../schemas/tag.schema';

@Controller('tags')
export class TagsController {
  constructor(private readonly tagService: TagService) {}

  @Get()
  getAll(): Promise<Tag[]> {
    return this.tagService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() body: Partial<Tag>): Promise<Tag> {
    return this.tagService.create(body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() body: Partial<Tag>): Promise<Tag | null> {
    return this.tagService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  remove(@Param('id') id: string): Promise<Tag | null> {
    return this.tagService.remove(id);
  }
}
