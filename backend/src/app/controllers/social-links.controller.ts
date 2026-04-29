import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, HttpCode } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SocialLinkService } from '../services/social-link.service';
import { SocialLink } from '../schemas/social-link.schema';

@Controller('social')
export class SocialLinksController {
  constructor(private readonly socialLinkService: SocialLinkService) {}

  @Get()
  getAll(@Query('all') all?: string): Promise<SocialLink[]> {
    return this.socialLinkService.findAll(all !== 'true');
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() body: Partial<SocialLink>): Promise<SocialLink> {
    return this.socialLinkService.create(body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() body: Partial<SocialLink>): Promise<SocialLink | null> {
    return this.socialLinkService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  remove(@Param('id') id: string): Promise<SocialLink | null> {
    return this.socialLinkService.remove(id);
  }
}
