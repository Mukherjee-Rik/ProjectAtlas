import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { TenantAccessGuard } from '../auth/guards/tenant-access.guard';
import { RestaurantAccessGuard } from '../auth/guards/restaurant-access.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentRestaurant } from '../auth/decorators/current-restaurant.decorator';
import { CurrentBranch } from '../auth/decorators/current-branch.decorator';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { PERMISSIONS } from '../auth/permissions/permissions';
import {
  RESTAURANT_HEADER,
  TENANT_HEADER,
  BRANCH_HEADER,
} from '../auth/constants/tenant.constants';
import type { CurrentRestaurant as CurrentRestaurantType } from '../auth/types/current-restaurant.type';
import type { CurrentBranch as CurrentBranchType } from '../auth/types/current-branch.type';
import type { CurrentTenant as CurrentTenantType } from '../auth/types/current-tenant.type';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  UnitOfMeasure,
  StockTransactionType,
  RecipeType,
} from '../../generated/prisma/enums';

// DTOs
export class CreateIngredientDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(UnitOfMeasure)
  unitOfMeasure: UnitOfMeasure;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minimumReorderLevel: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  costPerUnit: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  initialStock?: number;

  @IsString()
  @IsOptional()
  locationId?: string;

  @IsString()
  @IsOptional()
  supplierId?: string;
}

export class UpdateIngredientDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(UnitOfMeasure)
  @IsOptional()
  unitOfMeasure?: UnitOfMeasure;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  minimumReorderLevel?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  costPerUnit?: number;

  @IsString()
  @IsOptional()
  locationId?: string;

  @IsString()
  @IsOptional()
  supplierId?: string;
}

export class RecordPurchaseDto {
  @IsString()
  @IsNotEmpty()
  ingredientId: string;

  @IsNumber()
  @Min(0.001)
  @Type(() => Number)
  quantity: number;

  @IsEnum(UnitOfMeasure)
  @IsOptional()
  unitOfMeasure?: UnitOfMeasure;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  costPerUnit?: number;

  @IsString()
  @IsOptional()
  supplierId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class RecordWastageDto {
  @IsString()
  @IsNotEmpty()
  ingredientId: string;

  @IsNumber()
  @Min(0.001)
  @Type(() => Number)
  quantity: number;

  @IsEnum(UnitOfMeasure)
  @IsOptional()
  unitOfMeasure?: UnitOfMeasure;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class RecordAdjustmentDto {
  @IsString()
  @IsNotEmpty()
  ingredientId: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  physicalCount: number;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class LogBatchProductionDto {
  @IsString()
  @IsNotEmpty()
  recipeId: string;

  @IsNumber()
  @Min(0.1)
  @Type(() => Number)
  portionsProduced: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class LogBatchWastageDto {
  @IsString()
  @IsNotEmpty()
  recipeId: string;

  @IsNumber()
  @Min(0.1)
  @Type(() => Number)
  portionsWasted: number;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class RecipeIngredientItemDto {
  @IsString()
  @IsNotEmpty()
  ingredientId: string;

  @IsNumber()
  @Min(0.001)
  @Type(() => Number)
  quantityRequired: number;
}

export class SaveRecipeDto {
  @IsString()
  @IsNotEmpty()
  menuItemId: string;

  @IsEnum(RecipeType)
  @IsOptional()
  recipeType?: RecipeType;

  @IsNumber()
  @Min(0.1)
  @IsOptional()
  @Type(() => Number)
  batchYieldPortions?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeIngredientItemDto)
  ingredients: RecipeIngredientItemDto[];
}

export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  contactName?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;
}

export class CreateLocationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;
}

@ApiTags('Inventory')
@ApiBearerAuth('access-token')
@ApiHeader({ name: TENANT_HEADER, required: true })
@ApiHeader({ name: RESTAURANT_HEADER, required: true })
@UseGuards(
  JwtAuthGuard,
  PermissionsGuard,
  TenantAccessGuard,
  RestaurantAccessGuard,
)
@Controller({ path: 'inventory', version: '1' })
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // =========================================================================
  // 1. OVERVIEW & KPIS
  // =========================================================================
  @Get('overview')
  @Permissions(PERMISSIONS.MENUS_READ)
  async getOverview(
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
    @CurrentBranch() branch?: CurrentBranchType,
  ) {
    if (!restaurant)
      throw new BadRequestException('No active restaurant selected');
    return this.inventoryService.getInventoryOverview(
      restaurant.id,
      branch?.id,
    );
  }

  // =========================================================================
  // 2. INGREDIENTS
  // =========================================================================
  @Get('ingredients')
  @Permissions(PERMISSIONS.MENUS_READ)
  async getIngredients(
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
    @CurrentBranch() branch?: CurrentBranchType,
  ) {
    if (!restaurant)
      throw new BadRequestException('No active restaurant selected');
    return this.inventoryService.getIngredients(restaurant.id, branch?.id);
  }

  @Post('ingredients')
  @Permissions(PERMISSIONS.MENUS_UPDATE)
  async createIngredient(
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
    @Headers(TENANT_HEADER) tenantId: string,
    @Body() dto: CreateIngredientDto,
  ) {
    if (!restaurant)
      throw new BadRequestException('No active restaurant selected');
    return this.inventoryService.createIngredient({
      tenantId: tenantId || restaurant.tenantId,
      restaurantId: restaurant.id,
      ...dto,
    });
  }

  @Patch('ingredients/:id')
  @Permissions(PERMISSIONS.MENUS_UPDATE)
  async updateIngredient(
    @Param('id') id: string,
    @Body() dto: UpdateIngredientDto,
  ) {
    return this.inventoryService.updateIngredient(id, dto);
  }

  @Delete('ingredients/:id')
  @Permissions(PERMISSIONS.MENUS_DELETE)
  async deleteIngredient(@Param('id') id: string) {
    return this.inventoryService.deleteIngredient(id);
  }

  // =========================================================================
  // 3. STOCK MOVEMENTS (PURCHASE, WASTAGE, ADJUSTMENT)
  // =========================================================================
  @Post('movements/purchase')
  @Permissions(PERMISSIONS.MENUS_UPDATE)
  async recordPurchase(@Body() dto: RecordPurchaseDto) {
    return this.inventoryService.recordPurchase(dto);
  }

  @Post('movements/wastage')
  @Permissions(PERMISSIONS.MENUS_UPDATE)
  async recordWastage(@Body() dto: RecordWastageDto) {
    return this.inventoryService.recordWastage(dto);
  }

  @Post('movements/adjustment')
  @Permissions(PERMISSIONS.MENUS_UPDATE)
  async recordAdjustment(@Body() dto: RecordAdjustmentDto) {
    return this.inventoryService.recordAdjustment(dto);
  }

  @Get('movements')
  @Permissions(PERMISSIONS.MENUS_READ)
  async getMovements(
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
    @CurrentBranch() branch?: CurrentBranchType,
    @Query('type') type?: StockTransactionType,
    @Query('ingredientId') ingredientId?: string,
    @Query('limit') limit?: number,
  ) {
    if (!restaurant)
      throw new BadRequestException('No active restaurant selected');
    return this.inventoryService.getMovements(
      restaurant.id,
      {
        type,
        ingredientId,
        limit: limit ? Number(limit) : undefined,
      },
      branch?.id,
    );
  }

  // =========================================================================
  // 4. RECIPES
  // =========================================================================
  @Get('recipes')
  @Permissions(PERMISSIONS.MENUS_READ)
  async getRecipes(@CurrentRestaurant() restaurant: CurrentRestaurantType) {
    if (!restaurant)
      throw new BadRequestException('No active restaurant selected');
    return this.inventoryService.getRecipes(restaurant.id);
  }

  @Get('recipes/:menuItemId')
  @Permissions(PERMISSIONS.MENUS_READ)
  async getRecipeForMenuItem(@Param('menuItemId') menuItemId: string) {
    return this.inventoryService.getRecipeForMenuItem(menuItemId);
  }

  @Post('recipes')
  @Permissions(PERMISSIONS.MENUS_UPDATE)
  async saveRecipe(@Body() dto: SaveRecipeDto) {
    return this.inventoryService.saveRecipe(dto);
  }

  // =========================================================================
  // 5. KITCHEN BATCH PREP & PRODUCTION
  // =========================================================================
  @Post('batch-production')
  @Permissions(PERMISSIONS.MENUS_UPDATE)
  async logBatchProduction(
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
    @CurrentBranch() branch: CurrentBranchType,
    @CurrentTenant() tenant: CurrentTenantType | undefined,
    @Body() dto: LogBatchProductionDto,
  ) {
    if (!restaurant)
      throw new BadRequestException('No active restaurant selected');
    const targetBranchId =
      branch?.id ||
      (await this.inventoryService.getFirstBranchId(restaurant.id));
    if (!targetBranchId)
      throw new BadRequestException('No active branch selected');
    const targetTenantId = tenant?.id || restaurant.tenantId;

    return this.inventoryService.logBatchProduction({
      tenantId: targetTenantId,
      branchId: targetBranchId,
      ...dto,
    });
  }

  @Post('batch-wastage')
  @Permissions(PERMISSIONS.MENUS_UPDATE)
  async logBatchWastage(
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
    @CurrentBranch() branch: CurrentBranchType,
    @CurrentTenant() tenant: CurrentTenantType | undefined,
    @Body() dto: LogBatchWastageDto,
  ) {
    if (!restaurant)
      throw new BadRequestException('No active restaurant selected');
    const targetBranchId =
      branch?.id ||
      (await this.inventoryService.getFirstBranchId(restaurant.id));
    if (!targetBranchId)
      throw new BadRequestException('No active branch selected');
    const targetTenantId = tenant?.id || restaurant.tenantId;

    return this.inventoryService.logBatchWastage({
      tenantId: targetTenantId,
      branchId: targetBranchId,
      ...dto,
    });
  }

  @Get('batch-productions')
  @Permissions(PERMISSIONS.MENUS_READ)
  async getBatchProductions(
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
    @CurrentBranch() branch?: CurrentBranchType,
  ) {
    if (!restaurant)
      throw new BadRequestException('No active restaurant selected');
    return this.inventoryService.getBatchProductions(restaurant.id, branch?.id);
  }

  // =========================================================================
  // 5. SUPPLIERS & LOCATIONS
  // =========================================================================
  @Get('suppliers')
  @Permissions(PERMISSIONS.MENUS_READ)
  async getSuppliers(
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
    @CurrentTenant() tenant?: CurrentTenantType,
  ) {
    const targetTenantId = tenant?.id || restaurant?.tenantId;
    if (!targetTenantId)
      throw new BadRequestException('No active tenant selected');
    return this.inventoryService.getSuppliers(targetTenantId);
  }

  @Post('suppliers')
  @Permissions(PERMISSIONS.MENUS_UPDATE)
  async createSupplier(
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
    @CurrentTenant() tenant: CurrentTenantType | undefined,
    @Body() dto: CreateSupplierDto,
  ) {
    const targetTenantId = tenant?.id || restaurant?.tenantId;
    if (!targetTenantId)
      throw new BadRequestException('No active tenant selected');
    return this.inventoryService.createSupplier({
      tenantId: targetTenantId,
      ...dto,
    });
  }

  @Get('locations')
  @Permissions(PERMISSIONS.MENUS_READ)
  async getLocations(
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
    @CurrentBranch() branch?: CurrentBranchType,
  ) {
    if (branch?.id) {
      return this.inventoryService.getLocations(branch.id);
    }
    if (restaurant?.id) {
      return this.inventoryService.getLocationsForRestaurant(restaurant.id);
    }
    return [];
  }

  @Post('locations')
  @Permissions(PERMISSIONS.MENUS_UPDATE)
  async createLocation(
    @CurrentRestaurant() restaurant: CurrentRestaurantType,
    @CurrentBranch() branch: CurrentBranchType,
    @CurrentTenant() tenant: CurrentTenantType | undefined,
    @Body() dto: CreateLocationDto,
  ) {
    const targetBranchId =
      branch?.id ||
      (await this.inventoryService.getFirstBranchId(restaurant?.id));
    if (!targetBranchId)
      throw new BadRequestException('No active branch selected');
    const targetTenantId = tenant?.id || restaurant?.tenantId;
    return this.inventoryService.createLocation({
      tenantId: targetTenantId || '',
      branchId: targetBranchId,
      ...dto,
    });
  }
}
