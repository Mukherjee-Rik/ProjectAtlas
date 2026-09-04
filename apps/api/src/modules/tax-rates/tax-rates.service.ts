import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateTaxRateDto } from './dto/create-tax-rate.dto';
import { UpdateTaxRateDto } from './dto/update-tax-rate.dto';

@Injectable()
export class TaxRatesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(restaurantId: string, dto: CreateTaxRateDto) {
    return this.prisma.taxRate.create({
      data: {
        restaurantId,
        name: dto.name,
        type: dto.type,
        value: dto.value,
        ...(dto.status !== undefined && { status: dto.status }),
      },
      select: {
        id: true,
        restaurantId: true,
        name: true,
        type: true,
        value: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findAll(restaurantId: string) {
    return this.prisma.taxRate.findMany({
      where: { restaurantId },
      select: {
        id: true,
        restaurantId: true,
        name: true,
        type: true,
        value: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(id: string, restaurantId: string) {
    const taxRate = await this.prisma.taxRate.findFirst({
      where: { id, restaurantId },
      select: {
        id: true,
        restaurantId: true,
        name: true,
        type: true,
        value: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!taxRate) throw new NotFoundException('Tax rate not found');
    return taxRate;
  }

  async update(id: string, restaurantId: string, dto: UpdateTaxRateDto) {
    const existing = await this.prisma.taxRate.findFirst({
      where: { id, restaurantId },
    });
    if (!existing)
      throw new ForbiddenException(
        'Tax rate not found or does not belong to active restaurant',
      );
    return this.prisma.taxRate.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.value !== undefined && { value: dto.value }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
      select: {
        id: true,
        restaurantId: true,
        name: true,
        type: true,
        value: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: string, restaurantId: string) {
    const existing = await this.prisma.taxRate.findFirst({
      where: { id, restaurantId },
    });
    if (!existing)
      throw new ForbiddenException(
        'Tax rate not found or does not belong to active restaurant',
      );
    return this.prisma.taxRate.delete({
      where: { id },
      select: { id: true, name: true },
    });
  }
}
