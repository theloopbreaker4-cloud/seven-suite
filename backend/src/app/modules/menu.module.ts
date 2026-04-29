import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MenusController } from '../controllers/menus.controller';
import { MenuService } from '../services/menu.service';
import { MenuSchema } from '../schemas/menu.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Menu', schema: MenuSchema }])],
  controllers: [MenusController],
  providers: [MenuService],
  exports: [MenuService],
})
export class MenuModule {}
