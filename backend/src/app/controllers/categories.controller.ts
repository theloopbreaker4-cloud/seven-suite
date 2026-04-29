import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, HttpCode } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CategoryService } from '../services/category.service';
import { Category } from '../schemas/category.schema';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  getAll(@Query('type') type?: string): Promise<Category[]> {
    return this.categoryService.findAll(type);
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string): Promise<Category | null> {
    return this.categoryService.findBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() body: Partial<Category>): Promise<Category> {
    return this.categoryService.create(body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() body: Partial<Category>): Promise<Category | null> {
    return this.categoryService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  remove(@Param('id') id: string): Promise<Category | null> {
    return this.categoryService.remove(id);
  }
}
