import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BlogService } from './blog.service';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { StaffAuthGuard } from '../common/guards/staff-auth.guard';
import { StaffRoleGuard } from '../common/guards/staff-role.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { StaffRole } from '../staff/schema/staff.schema';
import { AuditOperation } from '../common/decorators/audit-operation.decorator';

@ApiTags('Blog')
@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get()
  @ApiOperation({ summary: 'Listar posts del blog (público: solo publicados)' })
  async findAll(@Query('includeUnpublished') includeUnpublished?: string) {
    return this.blogService.findAll(includeUnpublished === 'true');
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Obtener post por slug (público)' })
  async findBySlug(@Param('slug') slug: string) {
    return this.blogService.findBySlug(slug);
  }

  @Get(':id')
  @UseGuards(StaffAuthGuard, StaffRoleGuard)
  @Roles(StaffRole.SUPER_ADMIN, StaffRole.ADMIN, StaffRole.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener post por ID (admin)' })
  async findOne(@Param('id') id: string) {
    return this.blogService.findOne(id);
  }

  @Post()
  @UseGuards(StaffAuthGuard, StaffRoleGuard)
  @Roles(StaffRole.SUPER_ADMIN, StaffRole.ADMIN, StaffRole.EDITOR)
  @ApiBearerAuth()
  @AuditOperation('CREATE_BLOG_POST')
  @ApiOperation({ summary: 'Crear nuevo post del blog' })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async create(@Body() dto: CreateBlogPostDto) {
    return this.blogService.create(dto);
  }

  @Put(':id')
  @UseGuards(StaffAuthGuard, StaffRoleGuard)
  @Roles(StaffRole.SUPER_ADMIN, StaffRole.ADMIN, StaffRole.EDITOR)
  @ApiBearerAuth()
  @AuditOperation('UPDATE_BLOG_POST')
  @ApiOperation({ summary: 'Actualizar post del blog' })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async update(@Param('id') id: string, @Body() dto: UpdateBlogPostDto) {
    return this.blogService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(StaffAuthGuard, StaffRoleGuard)
  @Roles(StaffRole.SUPER_ADMIN, StaffRole.ADMIN)
  @ApiBearerAuth()
  @AuditOperation('DELETE_BLOG_POST')
  @ApiOperation({ summary: 'Eliminar post del blog' })
  async remove(@Param('id') id: string) {
    return this.blogService.remove(id);
  }
}
