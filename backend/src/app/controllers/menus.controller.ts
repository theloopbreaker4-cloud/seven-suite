import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, HttpCode } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MenuService } from '../services/menu.service';
import { Menu } from '../schemas/menu.schema';

@Controller('menus')
export class MenusController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  getAll(): Promise<Menu[]> {
    return this.menuService.findAll();
  }

  @Get(':handle')
  getByHandle(@Param('handle') handle: string): Promise<Menu | null> {
    return this.menuService.findByHandle(handle);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() body: Partial<Menu>): Promise<Menu> {
    return this.menuService.create(body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() body: Partial<Menu>): Promise<Menu | null> {
    return this.menuService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  remove(@Param('id') id: string): Promise<Menu | null> {
    return this.menuService.remove(id);
  }
}
