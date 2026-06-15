import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Category } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  private map(c: Category) {
    return {
      publicId: c.publicId,
      name: c.name,
      type: c.type,
      icon: c.icon,
      color: c.color,
      isSystem: c.isSystem,
    };
  }

  /** system (workspaceId=null) + custom ของ workspace นี้ */
  async list(workspaceId: bigint) {
    const categories = await this.prisma.category.findMany({
      where: {
        deletedAt: null,
        OR: [{ workspaceId: null }, { workspaceId }],
      },
      orderBy: [{ isSystem: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });
    return categories.map((c) => this.map(c));
  }

  async create(workspaceId: bigint, dto: CreateCategoryDto) {
    const category = await this.prisma.category.create({
      data: {
        workspaceId,
        name: dto.name,
        type: dto.type,
        icon: dto.icon,
        color: dto.color,
        isSystem: false,
      },
    });
    return this.map(category);
  }

  /** soft delete — เฉพาะ custom (system ลบไม่ได้); transaction.category → SET NULL */
  async remove(workspaceId: bigint, publicId: string) {
    const category = await this.prisma.category.findFirst({
      where: { workspaceId, publicId, isSystem: false, deletedAt: null },
      select: { id: true },
    });
    if (!category) throw new NotFoundException('ไม่พบหมวดหมู่ (หรือเป็นหมวดระบบ)');
    await this.prisma.category.update({
      where: { id: category.id },
      data: { deletedAt: new Date() },
    });
  }
}
