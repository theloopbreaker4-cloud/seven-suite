import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, HttpCode } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SlideService } from '../services/slide.service';
import { Slide } from '../schemas/slide.schema';

@Controller('slider')
export class SliderController {
  constructor(private readonly slideService: SlideService) {}

  @Get()
  getAll(@Query('all') all?: string): Promise<Slide[]> {
    return this.slideService.findAll(all !== 'true');
  }

  @Get(':id')
  getById(@Param('id') id: string): Promise<Slide | null> {
    return this.slideService.findById(id);
  }

  @Post('reorder')
  @UseGuards(JwtAuthGuard)
  reorder(@Body() body: { order: Array<{ id: string; sortOrder: number }> }): Promise<{ ok: boolean }> {
    return this.slideService.reorder(body.order).then(() => ({ ok: true }));
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() body: Partial<Slide>): Promise<Slide> {
    return this.slideService.create(body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() body: Partial<Slide>): Promise<Slide | null> {
    return this.slideService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  remove(@Param('id') id: string): Promise<Slide | null> {
    return this.slideService.remove(id);
  }
}
