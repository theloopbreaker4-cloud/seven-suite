import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, HttpCode } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PageService } from '../services/page.service';
import { Page } from '../schemas/page.schema';

@Controller('pages')
export class PagesController {
  constructor(private readonly pageService: PageService) {}

  @Get()
  getAll(): Promise<Page[]> {
    return this.pageService.findAll();
  }

  @Get('all')
  @UseGuards(JwtAuthGuard)
  getAllAdmin(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.pageService.findAllAdmin(
      limit ? parseInt(limit, 10) : 100,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string): Promise<Page | null> {
    return this.pageService.findBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() body: Partial<Page>): Promise<Page> {
    return this.pageService.create(body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() body: Partial<Page>): Promise<Page | null> {
    return this.pageService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  remove(@Param('id') id: string): Promise<Page | null> {
    return this.pageService.remove(id);
  }
}
