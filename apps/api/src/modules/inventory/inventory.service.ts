import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import {
  UnitOfMeasure,
  StockTransactionType,
  RecipeType,
} from '../../generated/prisma/enums';
import { convertQuantity } from './utils/unit-converter';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  // =========================================================================
  // 1. INVENTORY OVERVIEW & KPIS
  // =========================================================================
  async getInventoryOverview(restaurantId: string, branchId?: string) {
    const whereClause: any = { restaurantId };
    if (branchId) {
      whereClause.OR = [{ location: { branchId } }, { locationId: null }];
    }

    const ingredients = await this.prisma.ingredient.findMany({
      where: whereClause,
      include: {
        location: true,
        supplier: true,
        recipeIngredients: {
          select: { id: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const totalItems = ingredients.length;
    let totalValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    const enrichedIngredients = ingredients.map((ing) => {
      const current = Number(ing.currentStock || 0);
      const min = Number(ing.minimumReorderLevel || 0);
      const cost = Number(ing.costPerUnit || 0);
      const itemValuation = current * cost;
      totalValuation += itemValuation;

      let status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' = 'IN_STOCK';
      if (current <= 0) {
        status = 'OUT_OF_STOCK';
        outOfStockCount++;
      } else if (current <= min) {
        status = 'LOW_STOCK';
        lowStockCount++;
      }

      return {
        id: ing.id,
        name: ing.name,
        unitOfMeasure: ing.unitOfMeasure,
        currentStock: current,
        minimumReorderLevel: min,
        costPerUnit: cost,
        totalValuation: Math.round(itemValuation * 100) / 100,
        status,
        location: ing.location
          ? {
              id: ing.location.id,
              name: ing.location.name,
              code: ing.location.code,
            }
          : null,
        supplier: ing.supplier
          ? {
              id: ing.supplier.id,
              name: ing.supplier.name,
              phone: ing.supplier.phone,
            }
          : null,
        recipesCount: ing.recipeIngredients.length,
        createdAt: ing.createdAt,
        updatedAt: ing.updatedAt,
      };
    });

    // Calculate monthly wastage cost from stock ledgers
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const wastageLedgers = await this.prisma.stockLedger.findMany({
      where: {
        ingredient: { restaurantId },
        ...(branchId && { branchId }),
        transactionType: 'WASTE_SPOILAGE',
        createdAt: { gte: thirtyDaysAgo },
      },
      include: {
        ingredient: {
          select: { costPerUnit: true },
        },
      },
    });

    const monthlyWastageCost = wastageLedgers.reduce((sum, l) => {
      const qty = Math.abs(Number(l.quantityDelta || 0));
      const cost = Number(l.ingredient?.costPerUnit || 0);
      return sum + qty * cost;
    }, 0);

    // Recent movements
    const recentMovements = await this.prisma.stockLedger.findMany({
      where: {
        ingredient: { restaurantId },
        ...(branchId && { branchId }),
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        ingredient: {
          select: { name: true, unitOfMeasure: true },
        },
        order: {
          select: { orderNumber: true },
        },
      },
    });

    return {
      metrics: {
        totalItems,
        totalValuation: Math.round(totalValuation * 100) / 100,
        lowStockCount,
        outOfStockCount,
        monthlyWastageCost: Math.round(monthlyWastageCost * 100) / 100,
      },
      ingredients: enrichedIngredients,
      recentMovements: recentMovements.map((m) => ({
        id: m.id,
        ingredientName: m.ingredient?.name || 'Unknown',
        unit: m.ingredient?.unitOfMeasure || 'KG',
        transactionType: m.transactionType,
        quantityDelta: Number(m.quantityDelta),
        balanceAfter: Number(m.balanceAfter),
        orderNumber: m.order?.orderNumber || null,
        createdAt: m.createdAt,
      })),
    };
  }

  // =========================================================================
  // 2. INGREDIENTS CRUD
  // =========================================================================
  async getIngredients(restaurantId: string, branchId?: string) {
    const overview = await this.getInventoryOverview(restaurantId, branchId);
    return overview.ingredients;
  }

  async createIngredient(dto: {
    tenantId: string;
    restaurantId: string;
    name: string;
    unitOfMeasure: UnitOfMeasure;
    minimumReorderLevel: number;
    costPerUnit: number;
    initialStock?: number;
    locationId?: string;
    supplierId?: string;
  }) {
    const initial = dto.initialStock ?? 0;

    return this.prisma.$transaction(async (tx) => {
      const ingredient = await tx.ingredient.create({
        data: {
          tenantId: dto.tenantId,
          restaurantId: dto.restaurantId,
          name: dto.name,
          unitOfMeasure: dto.unitOfMeasure,
          minimumReorderLevel: dto.minimumReorderLevel,
          costPerUnit: dto.costPerUnit,
          currentStock: initial,
          locationId: dto.locationId,
          supplierId: dto.supplierId,
        },
      });

      // If initial stock provided, log opening balance in ledger
      if (initial > 0) {
        const branch = await tx.branch.findFirst({
          where: { restaurantId: dto.restaurantId },
        });

        if (branch) {
          await tx.stockLedger.create({
            data: {
              tenantId: dto.tenantId,
              branchId: branch.id,
              ingredientId: ingredient.id,
              locationId: dto.locationId,
              supplierId: dto.supplierId,
              transactionType: 'MANUAL_PURCHASE',
              quantityDelta: initial,
              balanceAfter: initial,
            },
          });
        }
      }

      return ingredient;
    });
  }

  async updateIngredient(
    id: string,
    dto: {
      name?: string;
      unitOfMeasure?: UnitOfMeasure;
      minimumReorderLevel?: number;
      costPerUnit?: number;
      locationId?: string;
      supplierId?: string;
    },
  ) {
    return this.prisma.ingredient.update({
      where: { id },
      data: dto,
    });
  }

  async deleteIngredient(id: string) {
    return this.prisma.ingredient.delete({
      where: { id },
    });
  }

  // =========================================================================
  // 3. STOCK MOVEMENTS (PURCHASE, WASTAGE, ADJUSTMENT)
  // =========================================================================

  /**
   * Record Stock In / Purchase
   */
  async recordPurchase(dto: {
    ingredientId: string;
    quantity: number;
    unitOfMeasure?: UnitOfMeasure;
    supplierId?: string;
    costPerUnit?: number;
    notes?: string;
  }) {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: { id: dto.ingredientId },
    });
    if (!ingredient) throw new NotFoundException('Ingredient not found');

    const addedQty = convertQuantity(
      dto.quantity,
      dto.unitOfMeasure || ingredient.unitOfMeasure,
      ingredient.unitOfMeasure,
    );

    const currentStock = Number(ingredient.currentStock || 0);
    const newStock = Math.round((currentStock + addedQty) * 1000) / 1000;

    return this.prisma.$transaction(async (tx) => {
      const branch = await tx.branch.findFirst({
        where: { restaurantId: ingredient.restaurantId },
      });

      // Update ingredient stock and optional new cost
      await tx.ingredient.update({
        where: { id: ingredient.id },
        data: {
          currentStock: newStock,
          costPerUnit:
            dto.costPerUnit !== undefined
              ? dto.costPerUnit
              : ingredient.costPerUnit,
          supplierId: dto.supplierId || ingredient.supplierId,
        },
      });

      // Create Stock Movement
      const movement = await tx.stockLedger.create({
        data: {
          tenantId: ingredient.tenantId,
          branchId: branch?.id || '',
          ingredientId: ingredient.id,
          locationId: ingredient.locationId,
          supplierId: dto.supplierId || ingredient.supplierId,
          transactionType: 'MANUAL_PURCHASE',
          quantityDelta: addedQty,
          balanceAfter: newStock,
        },
      });

      return {
        success: true,
        movement,
        previousStock: currentStock,
        newStock,
        unit: ingredient.unitOfMeasure,
      };
    });
  }

  /**
   * Record Spoilage / Wastage
   */
  async recordWastage(dto: {
    ingredientId: string;
    quantity: number;
    unitOfMeasure?: UnitOfMeasure;
    reason: string;
    notes?: string;
  }) {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: { id: dto.ingredientId },
    });
    if (!ingredient) throw new NotFoundException('Ingredient not found');

    const wastedQty = convertQuantity(
      dto.quantity,
      dto.unitOfMeasure || ingredient.unitOfMeasure,
      ingredient.unitOfMeasure,
    );

    const currentStock = Number(ingredient.currentStock || 0);
    const newStock = Math.max(
      0,
      Math.round((currentStock - wastedQty) * 1000) / 1000,
    );

    return this.prisma.$transaction(async (tx) => {
      const branch = await tx.branch.findFirst({
        where: { restaurantId: ingredient.restaurantId },
      });

      await tx.ingredient.update({
        where: { id: ingredient.id },
        data: { currentStock: newStock },
      });

      const movement = await tx.stockLedger.create({
        data: {
          tenantId: ingredient.tenantId,
          branchId: branch?.id || '',
          ingredientId: ingredient.id,
          locationId: ingredient.locationId,
          transactionType: 'WASTE_SPOILAGE',
          quantityDelta: -wastedQty,
          balanceAfter: newStock,
        },
      });

      return {
        success: true,
        movement,
        previousStock: currentStock,
        newStock,
        reason: dto.reason,
        unit: ingredient.unitOfMeasure,
      };
    });
  }

  /**
   * Record Stock Audit Adjustment
   */
  async recordAdjustment(dto: {
    ingredientId: string;
    physicalCount: number;
    reason?: string;
  }) {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: { id: dto.ingredientId },
    });
    if (!ingredient) throw new NotFoundException('Ingredient not found');

    const currentStock = Number(ingredient.currentStock || 0);
    const physical = Number(dto.physicalCount);
    const delta = Math.round((physical - currentStock) * 1000) / 1000;

    return this.prisma.$transaction(async (tx) => {
      const branch = await tx.branch.findFirst({
        where: { restaurantId: ingredient.restaurantId },
      });

      await tx.ingredient.update({
        where: { id: ingredient.id },
        data: { currentStock: physical },
      });

      const movement = await tx.stockLedger.create({
        data: {
          tenantId: ingredient.tenantId,
          branchId: branch?.id || '',
          ingredientId: ingredient.id,
          locationId: ingredient.locationId,
          transactionType: 'AUDIT_ADJUSTMENT',
          quantityDelta: delta,
          balanceAfter: physical,
        },
      });

      return {
        success: true,
        movement,
        previousStock: currentStock,
        newStock: physical,
        delta,
        unit: ingredient.unitOfMeasure,
      };
    });
  }

  // =========================================================================
  // 4. AUTOMATED DUAL-MODE ORDER DEDUCTION & RESTORATION ENGINE
  // =========================================================================

  /**
   * Idempotently deduct inventory when order is confirmed.
   * Handles:
   *  - COOKED_TO_ORDER: Real-time live raw ingredient deduction
   *  - BATCH_PREPARED: Prepared portion stock deduction with raw ingredient fallback
   */
  async deductStockForOrder(orderId: string, tx?: any) {
    const prismaClient = tx || this.prisma;

    // Idempotency check: Don't deduct twice for same order
    const existingDeduction = await prismaClient.stockLedger.findFirst({
      where: { referenceOrderId: orderId, transactionType: 'RECIPE_DEDUCTION' },
    });
    if (existingDeduction) {
      this.logger.log(
        `Stock for order ${orderId} has already been deducted. Skipping.`,
      );
      return;
    }

    // Fetch order with items and recipe mappings
    const order = await prismaClient.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            menuItem: {
              include: {
                recipe: {
                  include: {
                    recipeIngredients: {
                      include: {
                        ingredient: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order || !order.items || order.items.length === 0) return;

    for (const orderItem of order.items) {
      const recipe = orderItem.menuItem?.recipe;
      if (
        !recipe ||
        !recipe.recipeIngredients ||
        recipe.recipeIngredients.length === 0
      ) {
        continue;
      }

      const orderQty = orderItem.quantity;
      const recipeType = recipe.recipeType || 'COOKED_TO_ORDER';

      // =====================================================================
      // CASE A: BATCH_PREPARED (e.g. Biryani, Chowmein, Gravy, Dal, Soup)
      // =====================================================================
      if (recipeType === 'BATCH_PREPARED') {
        const preparedStock = Number(recipe.preparedStock || 0);

        if (preparedStock >= orderQty) {
          // Deduct directly from ready prepared portions
          const newPreparedStock = Math.max(
            0,
            Math.round((preparedStock - orderQty) * 100) / 100,
          );

          await prismaClient.recipe.update({
            where: { id: recipe.id },
            data: { preparedStock: newPreparedStock },
          });

          // FIFO deduction across active BatchProduction runs
          let qtyToDeduct = orderQty;
          const activeBatches = await prismaClient.batchProduction.findMany({
            where: {
              recipeId: recipe.id,
              status: 'ACTIVE',
              portionsRemaining: { gt: 0 },
            },
            orderBy: { producedAt: 'asc' },
          });

          for (const batch of activeBatches) {
            if (qtyToDeduct <= 0) break;
            const batchRemaining = Number(batch.portionsRemaining);
            const deductFromThis = Math.min(batchRemaining, qtyToDeduct);
            const remainingAfter = batchRemaining - deductFromThis;

            await prismaClient.batchProduction.update({
              where: { id: batch.id },
              data: {
                portionsRemaining: remainingAfter,
                status: remainingAfter <= 0 ? 'DEPLETED' : 'ACTIVE',
              },
            });
            qtyToDeduct -= deductFromThis;
          }

          // Record a representative stock ledger entry against the primary ingredient
          const primaryIng = recipe.recipeIngredients[0]?.ingredient;
          if (primaryIng) {
            await prismaClient.stockLedger.create({
              data: {
                tenantId: primaryIng.tenantId,
                branchId: order.branchId,
                ingredientId: primaryIng.id,
                locationId: primaryIng.locationId,
                transactionType: 'RECIPE_DEDUCTION',
                quantityDelta: -orderQty,
                balanceAfter: newPreparedStock,
                referenceOrderId: order.id,
              },
            });
          }

          this.logger.log(
            `BATCH ITEM DEDUCTION: "${orderItem.menuItem.name}" deducted ${orderQty} prepared portions (remaining: ${newPreparedStock}).`,
          );
          continue;
        } else {
          // Prepared stock is depleted or insufficient: deduct what is available and fallback to raw deduction for the rest
          if (preparedStock > 0) {
            await prismaClient.recipe.update({
              where: { id: recipe.id },
              data: { preparedStock: 0 },
            });
            this.logger.warn(
              `BATCH EXHAUSTED: "${orderItem.menuItem.name}" prepared stock exhausted! Falling back to raw ingredients for deficit.`,
            );
          }
          // Fall through to raw ingredient deduction for the remaining/full quantity
        }
      }

      // =====================================================================
      // CASE B: COOKED_TO_ORDER or FALLBACK RAW INGREDIENT DEDUCTION
      // =====================================================================
      for (const recipeIng of recipe.recipeIngredients) {
        const ingredient = recipeIng.ingredient;
        if (!ingredient) continue;

        // Calculate consumed quantity in recipe's unit then normalize to ingredient's unit
        const yieldRatio = Number(recipe.batchYieldPortions || 1);
        const rawQuantity =
          (Number(recipeIng.quantityRequired) / yieldRatio) * orderQty;

        let normalizedQty = rawQuantity;
        if (ingredient.unitOfMeasure === 'KG' && rawQuantity > 5) {
          normalizedQty = rawQuantity / 1000;
        } else if (ingredient.unitOfMeasure === 'LITER' && rawQuantity > 5) {
          normalizedQty = rawQuantity / 1000;
        }

        const currentStock = Number(ingredient.currentStock || 0);
        const newStock =
          Math.round((currentStock - normalizedQty) * 1000) / 1000;

        // Decrement stock
        await prismaClient.ingredient.update({
          where: { id: ingredient.id },
          data: { currentStock: newStock },
        });

        // Record stock ledger entry
        await prismaClient.stockLedger.create({
          data: {
            tenantId: ingredient.tenantId,
            branchId: order.branchId,
            ingredientId: ingredient.id,
            locationId: ingredient.locationId,
            supplierId: ingredient.supplierId,
            transactionType: 'RECIPE_DEDUCTION',
            quantityDelta: -normalizedQty,
            balanceAfter: newStock,
            referenceOrderId: order.id,
          },
        });

        // Check for Low Stock Alert trigger
        if (newStock <= Number(ingredient.minimumReorderLevel)) {
          this.logger.warn(
            `LOW STOCK ALERT: Ingredient "${ingredient.name}" is now at ${newStock} ${ingredient.unitOfMeasure} (Minimum: ${ingredient.minimumReorderLevel}).`,
          );

          try {
            await prismaClient.notification.create({
              data: {
                restaurantId: ingredient.restaurantId,
                title: `⚠️ Low Stock Alert: ${ingredient.name}`,
                message: `Current stock of ${ingredient.name} has dropped to ${newStock} ${ingredient.unitOfMeasure}. Minimum threshold is ${ingredient.minimumReorderLevel}.`,
                type: 'ALERT',
                metadata: {
                  alertType: 'LOW_STOCK',
                  priority: 'HIGH',
                  ingredientId: ingredient.id,
                },
              },
            });
          } catch (notifErr) {
            // Non-blocking notification creation
          }
        }
      }
    }
  }

  /**
   * Restore stock if order was cancelled before preparation
   */
  async restoreStockForOrder(orderId: string, tx?: any) {
    const prismaClient = tx || this.prisma;

    // Find previous deductions for this order
    const deductions = await prismaClient.stockLedger.findMany({
      where: { referenceOrderId: orderId, transactionType: 'RECIPE_DEDUCTION' },
      include: { ingredient: true },
    });

    if (!deductions || deductions.length === 0) return;

    // Check if already restored
    const existingRestoration = await prismaClient.stockLedger.findFirst({
      where: { referenceOrderId: orderId, transactionType: 'AUDIT_ADJUSTMENT' },
    });
    if (existingRestoration) return;

    for (const entry of deductions) {
      const ingredient = entry.ingredient;
      if (!ingredient) continue;

      const returnQty = Math.abs(Number(entry.quantityDelta));
      const currentStock = Number(ingredient.currentStock || 0);
      const restoredStock =
        Math.round((currentStock + returnQty) * 1000) / 1000;

      await prismaClient.ingredient.update({
        where: { id: ingredient.id },
        data: { currentStock: restoredStock },
      });

      await prismaClient.stockLedger.create({
        data: {
          tenantId: ingredient.tenantId,
          branchId: entry.branchId,
          ingredientId: ingredient.id,
          locationId: ingredient.locationId,
          supplierId: ingredient.supplierId,
          transactionType: 'AUDIT_ADJUSTMENT',
          quantityDelta: returnQty,
          balanceAfter: restoredStock,
          referenceOrderId: orderId,
        },
      });
    }

    this.logger.log(`Stock restored for cancelled order ${orderId}.`);
  }

  // =========================================================================
  // 5. KITCHEN BATCH PREP & PRODUCTION (BULK COOKING)
  // =========================================================================

  /**
   * Log Kitchen Batch Production (e.g. 25 Portions of Biryani prepared in morning)
   * Consumes raw ingredients in bulk and produces ready prepared portion inventory.
   */
  async logBatchProduction(dto: {
    tenantId: string;
    branchId: string;
    recipeId: string;
    portionsProduced: number;
    notes?: string;
    expiresAt?: Date;
  }) {
    const { tenantId, branchId, recipeId, portionsProduced, notes, expiresAt } =
      dto;
    if (portionsProduced <= 0) {
      throw new BadRequestException('Portions produced must be greater than 0');
    }

    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        menuItem: true,
        recipeIngredients: {
          include: { ingredient: true },
        },
      },
    });

    if (!recipe) throw new NotFoundException('Recipe not found');

    const yieldRatio = Number(recipe.batchYieldPortions || 1);
    const multiplier = portionsProduced / yieldRatio;

    return this.prisma.$transaction(async (tx) => {
      // 1. Deduct raw ingredients consumed by this batch
      for (const ring of recipe.recipeIngredients) {
        const ing = ring.ingredient;
        if (!ing) continue;

        const rawQty = Number(ring.quantityRequired) * multiplier;
        let normalizedQty = rawQty;
        if (ing.unitOfMeasure === 'KG' && rawQty > 5) {
          normalizedQty = rawQty / 1000;
        } else if (ing.unitOfMeasure === 'LITER' && rawQty > 5) {
          normalizedQty = rawQty / 1000;
        }

        const currentStock = Number(ing.currentStock || 0);
        const newStock = Math.max(
          0,
          Math.round((currentStock - normalizedQty) * 1000) / 1000,
        );

        await tx.ingredient.update({
          where: { id: ing.id },
          data: { currentStock: newStock },
        });

        // Record stock ledger entry for batch production consumption
        await tx.stockLedger.create({
          data: {
            tenantId,
            branchId,
            ingredientId: ing.id,
            locationId: ing.locationId,
            transactionType: 'BATCH_PRODUCTION',
            quantityDelta: -normalizedQty,
            balanceAfter: newStock,
          },
        });
      }

      // 2. Increment prepared ready stock on Recipe
      const currentPrepared = Number(recipe.preparedStock || 0);
      const newPreparedStock =
        Math.round((currentPrepared + portionsProduced) * 100) / 100;

      await tx.recipe.update({
        where: { id: recipe.id },
        data: {
          recipeType: 'BATCH_PREPARED',
          preparedStock: newPreparedStock,
        },
      });

      // 3. Create BatchProduction run log
      const batchProduction = await tx.batchProduction.create({
        data: {
          tenantId,
          branchId,
          recipeId: recipe.id,
          portionsProduced,
          portionsRemaining: portionsProduced,
          notes:
            notes || `Cooked batch of ${portionsProduced} portions for service`,
          expiresAt,
          status: 'ACTIVE',
        },
      });

      return {
        success: true,
        batchProduction,
        menuItemName: recipe.menuItem.name,
        portionsProduced,
        totalPreparedStock: newPreparedStock,
      };
    });
  }

  /**
   * Log Wastage / Spoilage of Prepared Batch Portions (e.g. 4 leftover Biryanis at closing)
   */
  async logBatchWastage(dto: {
    tenantId: string;
    branchId: string;
    recipeId: string;
    portionsWasted: number;
    reason: string;
    notes?: string;
  }) {
    const { tenantId, branchId, recipeId, portionsWasted, reason, notes } = dto;
    if (portionsWasted <= 0) {
      throw new BadRequestException('Portions wasted must be greater than 0');
    }

    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        menuItem: true,
        recipeIngredients: { include: { ingredient: true } },
      },
    });
    if (!recipe) throw new NotFoundException('Recipe not found');

    const currentPrepared = Number(recipe.preparedStock || 0);
    const newPreparedStock = Math.max(
      0,
      Math.round((currentPrepared - portionsWasted) * 100) / 100,
    );

    return this.prisma.$transaction(async (tx) => {
      // 1. Decrement prepared stock
      await tx.recipe.update({
        where: { id: recipe.id },
        data: { preparedStock: newPreparedStock },
      });

      // 2. Decrement remaining on active batches
      let qtyToWastage = portionsWasted;
      const batches = await tx.batchProduction.findMany({
        where: {
          recipeId: recipe.id,
          status: 'ACTIVE',
          portionsRemaining: { gt: 0 },
        },
        orderBy: { producedAt: 'asc' },
      });

      for (const batch of batches) {
        if (qtyToWastage <= 0) break;
        const rem = Number(batch.portionsRemaining);
        const deduct = Math.min(rem, qtyToWastage);
        const remAfter = rem - deduct;

        await tx.batchProduction.update({
          where: { id: batch.id },
          data: {
            portionsRemaining: remAfter,
            status: remAfter <= 0 ? 'DISCARDED' : 'ACTIVE',
            notes: notes
              ? `${batch.notes || ''} [Wastage: ${reason}]`
              : batch.notes,
          },
        });
        qtyToWastage -= deduct;
      }

      // 3. Record in stock ledger
      const primaryIng = recipe.recipeIngredients[0]?.ingredient;
      if (primaryIng) {
        await tx.stockLedger.create({
          data: {
            tenantId,
            branchId,
            ingredientId: primaryIng.id,
            locationId: primaryIng.locationId,
            transactionType: 'BATCH_WASTAGE',
            quantityDelta: -portionsWasted,
            balanceAfter: newPreparedStock,
          },
        });
      }

      return {
        success: true,
        menuItemName: recipe.menuItem.name,
        portionsWasted,
        remainingPreparedStock: newPreparedStock,
      };
    });
  }

  /**
   * Get Active & Historical Kitchen Batch Productions
   */
  async getBatchProductions(restaurantId: string, branchId?: string) {
    const batches = await this.prisma.batchProduction.findMany({
      where: {
        ...(branchId && { branchId }),
        recipe: {
          menuItem: {
            category: {
              menu: { restaurantId },
            },
          },
        },
      },
      include: {
        recipe: {
          include: {
            menuItem: {
              select: { id: true, name: true, price: true },
            },
          },
        },
      },
      orderBy: { producedAt: 'desc' },
      take: 50,
    });

    return batches.map((b) => ({
      id: b.id,
      recipeId: b.recipeId,
      menuItemId: b.recipe.menuItem.id,
      menuItemName: b.recipe.menuItem.name,
      portionsProduced: Number(b.portionsProduced),
      portionsRemaining: Number(b.portionsRemaining),
      currentRecipeStock: Number(b.recipe.preparedStock || 0),
      notes: b.notes,
      status: b.status,
      producedAt: b.producedAt,
      expiresAt: b.expiresAt,
      createdAt: b.createdAt,
    }));
  }

  // =========================================================================
  // 6. RECIPE & INGREDIENT MAPPING
  // =========================================================================
  async getRecipes(restaurantId: string) {
    const menuItems = await this.prisma.menuItem.findMany({
      where: {
        category: {
          menu: { restaurantId },
        },
      },
      include: {
        category: { select: { name: true } },
        recipe: {
          include: {
            recipeIngredients: {
              include: {
                ingredient: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return menuItems.map((item) => ({
      menuItemId: item.id,
      menuItemName: item.name,
      categoryName: item.category?.name || 'General',
      price: Number(item.price),
      hasRecipe: !!item.recipe && item.recipe.recipeIngredients.length > 0,
      recipe: item.recipe
        ? {
            id: item.recipe.id,
            recipeType: item.recipe.recipeType || 'COOKED_TO_ORDER',
            batchYieldPortions: Number(item.recipe.batchYieldPortions || 1),
            preparedStock: Number(item.recipe.preparedStock || 0),
            ingredients: item.recipe.recipeIngredients.map((ri) => ({
              id: ri.id,
              ingredientId: ri.ingredientId,
              ingredientName: ri.ingredient.name,
              quantityRequired: Number(ri.quantityRequired),
              unitOfMeasure: ri.ingredient.unitOfMeasure,
              costContribution:
                Math.round(
                  Number(ri.quantityRequired) *
                    Number(ri.ingredient.costPerUnit) *
                    100,
                ) / 100,
            })),
            totalRecipeCost: item.recipe.recipeIngredients.reduce(
              (sum, ri) =>
                sum +
                Number(ri.quantityRequired) * Number(ri.ingredient.costPerUnit),
              0,
            ),
          }
        : null,
    }));
  }

  async getRecipeForMenuItem(menuItemId: string) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { menuItemId },
      include: {
        menuItem: true,
        recipeIngredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    if (!recipe) return null;

    return {
      id: recipe.id,
      menuItemId: recipe.menuItemId,
      menuItemName: recipe.menuItem.name,
      recipeType: recipe.recipeType || 'COOKED_TO_ORDER',
      batchYieldPortions: Number(recipe.batchYieldPortions || 1),
      preparedStock: Number(recipe.preparedStock || 0),
      ingredients: recipe.recipeIngredients.map((ri) => ({
        id: ri.id,
        ingredientId: ri.ingredientId,
        ingredientName: ri.ingredient.name,
        quantityRequired: Number(ri.quantityRequired),
        unitOfMeasure: ri.ingredient.unitOfMeasure,
        costPerUnit: Number(ri.ingredient.costPerUnit),
      })),
    };
  }

  async saveRecipe(dto: {
    menuItemId: string;
    recipeType?: RecipeType;
    batchYieldPortions?: number;
    ingredients: {
      ingredientId: string;
      quantityRequired: number;
    }[];
  }) {
    return this.prisma.$transaction(async (tx) => {
      // Find existing recipe to preserve prepared stock if exists
      const existing = await tx.recipe.findUnique({
        where: { menuItemId: dto.menuItemId },
      });

      // Remove existing recipe
      await tx.recipe.deleteMany({
        where: { menuItemId: dto.menuItemId },
      });

      if (dto.ingredients.length === 0) {
        return { success: true, message: 'Recipe removed' };
      }

      // Create new recipe
      const recipe = await tx.recipe.create({
        data: {
          menuItemId: dto.menuItemId,
          recipeType: dto.recipeType || 'COOKED_TO_ORDER',
          batchYieldPortions: dto.batchYieldPortions
            ? Number(dto.batchYieldPortions)
            : 1,
          preparedStock: existing?.preparedStock || 0,
        },
      });

      // Create recipe ingredients
      await tx.recipeIngredient.createMany({
        data: dto.ingredients.map((ing) => ({
          recipeId: recipe.id,
          ingredientId: ing.ingredientId,
          quantityRequired: ing.quantityRequired,
        })),
      });

      return tx.recipe.findUnique({
        where: { id: recipe.id },
        include: {
          recipeIngredients: {
            include: {
              ingredient: true,
            },
          },
        },
      });
    });
  }

  // =========================================================================
  // 6. MOVEMENTS & AUDIT LEDGER
  // =========================================================================
  async getMovements(
    restaurantId: string,
    filter?: {
      type?: StockTransactionType;
      ingredientId?: string;
      limit?: number;
    },
    branchId?: string,
  ) {
    const where: any = {
      ingredient: { restaurantId },
      ...(branchId && { branchId }),
    };

    if (filter?.type) where.transactionType = filter.type;
    if (filter?.ingredientId) where.ingredientId = filter.ingredientId;

    const movements = await this.prisma.stockLedger.findMany({
      where,
      take: filter?.limit || 100,
      orderBy: { createdAt: 'desc' },
      include: {
        ingredient: {
          select: {
            id: true,
            name: true,
            unitOfMeasure: true,
            costPerUnit: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return movements.map((m) => ({
      id: m.id,
      transactionType: m.transactionType,
      quantityDelta: Number(m.quantityDelta),
      balanceAfter: Number(m.balanceAfter),
      ingredient: m.ingredient,
      order: m.order,
      supplier: m.supplier,
      createdAt: m.createdAt,
    }));
  }

  // =========================================================================
  // 7. SUPPLIERS & LOCATIONS
  // =========================================================================
  async createSupplier(dto: {
    tenantId: string;
    name: string;
    contactName?: string;
    email?: string;
    phone?: string;
  }) {
    return this.prisma.supplier.create({ data: dto });
  }

  async getSuppliers(tenantId: string) {
    return this.prisma.supplier.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async createLocation(dto: {
    tenantId: string;
    branchId: string;
    name: string;
    code: string;
  }) {
    return this.prisma.inventoryLocation.create({ data: dto });
  }

  async getLocations(branchId: string) {
    return this.prisma.inventoryLocation.findMany({
      where: { branchId },
      orderBy: { name: 'asc' },
    });
  }

  async getLocationsForRestaurant(restaurantId: string) {
    const branches = await this.prisma.branch.findMany({
      where: { restaurantId },
      select: { id: true },
    });
    const branchIds = branches.map((b) => b.id);
    return this.prisma.inventoryLocation.findMany({
      where: { branchId: { in: branchIds } },
      orderBy: { name: 'asc' },
    });
  }

  async getFirstBranchId(restaurantId?: string): Promise<string | null> {
    if (!restaurantId) return null;
    const branch = await this.prisma.branch.findFirst({
      where: { restaurantId },
      select: { id: true },
    });
    return branch?.id || null;
  }
}
