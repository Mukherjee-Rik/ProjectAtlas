import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

async function main() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });
  const prisma = new PrismaClient({ adapter });
  console.log('Connecting to database...');
  await prisma.$connect();

  // Find the restaurant "sweta r restaurant"
  console.log('Searching for restaurant "sweta r restaurant"...');
  const restaurant = await prisma.restaurant.findFirst({
    where: {
      name: {
        contains: 'sweta',
        mode: 'insensitive',
      },
    },
    include: {
      branches: true,
      tenant: true,
    },
  });

  if (!restaurant) {
    throw new Error('Restaurant "sweta r restaurant" not found in database. Please verify name.');
  }

  console.log(`Found restaurant: ${restaurant.name} (Tenant: ${restaurant.tenant.name})`);

  const branch = restaurant.branches[0];
  if (!branch) {
    throw new Error(`No branches found for restaurant ${restaurant.name}. Please configure a branch first.`);
  }
  console.log(`Using branch: ${branch.name} (Code: ${branch.code})`);

  // 1. Create or Find Suppliers
  console.log('Ensuring Suppliers exist...');
  const meatSupplier = await prisma.supplier.upsert({
    where: { id: 'supplier-meat-sweta' },
    update: {},
    create: {
      id: 'supplier-meat-sweta',
      tenantId: restaurant.tenantId,
      name: 'Fresh Meat Farm Supplier',
      contactName: 'Robert Clean Cut',
      email: 'meat@farmfresh.com',
      phone: '+91 98877 66554',
      status: 'ACTIVE',
    },
  });

  const vegSupplier = await prisma.supplier.upsert({
    where: { id: 'supplier-veg-sweta' },
    update: {},
    create: {
      id: 'supplier-veg-sweta',
      tenantId: restaurant.tenantId,
      name: 'Daily Green Vegetables Ltd',
      contactName: 'Sanjay Sabjiwala',
      email: 'sales@dailygreen.com',
      phone: '+91 91122 33445',
      status: 'ACTIVE',
    },
  });

  // 2. Create or Find Locations
  console.log('Ensuring Storage Locations exist...');
  const coldStorage = await prisma.inventoryLocation.upsert({
    where: { branchId_code: { branchId: branch.id, code: 'COLD_FREEZER' } },
    update: {},
    create: {
      tenantId: restaurant.tenantId,
      branchId: branch.id,
      name: 'Cold Storage Freezer 1',
      code: 'COLD_FREEZER',
    },
  });

  const dryPantry = await prisma.inventoryLocation.upsert({
    where: { branchId_code: { branchId: branch.id, code: 'DRY_PANTRY' } },
    update: {},
    create: {
      tenantId: restaurant.tenantId,
      branchId: branch.id,
      name: 'Dry Pantry Shelves',
      code: 'DRY_PANTRY',
    },
  });

  // 3. Create or Find Ingredients
  console.log('Ensuring Ingredients exist...');
  
  // Chicken
  const chicken = await prisma.ingredient.upsert({
    where: { id: 'ing-chicken-sweta' },
    update: {},
    create: {
      id: 'ing-chicken-sweta',
      tenantId: restaurant.tenantId,
      restaurantId: restaurant.id,
      name: 'Chicken (Fresh)',
      unitOfMeasure: 'GRAM',
      costPerUnit: 0.35, // INR per gram
      currentStock: 50000.00, // 50kg initial stock
      minimumReorderLevel: 10000.00, // 10kg limit
      supplierId: meatSupplier.id,
      locationId: coldStorage.id,
    },
  });

  // Mutton
  const mutton = await prisma.ingredient.upsert({
    where: { id: 'ing-mutton-sweta' },
    update: {},
    create: {
      id: 'ing-mutton-sweta',
      tenantId: restaurant.tenantId,
      restaurantId: restaurant.id,
      name: 'Mutton (Prime Cut)',
      unitOfMeasure: 'GRAM',
      costPerUnit: 0.65, // INR per gram
      currentStock: 30000.00, // 30kg initial stock
      minimumReorderLevel: 5000.00, // 5kg limit
      supplierId: meatSupplier.id,
      locationId: coldStorage.id,
    },
  });

  // Onion
  const onion = await prisma.ingredient.upsert({
    where: { id: 'ing-onion-sweta' },
    update: {},
    create: {
      id: 'ing-onion-sweta',
      tenantId: restaurant.tenantId,
      restaurantId: restaurant.id,
      name: 'Onions',
      unitOfMeasure: 'GRAM',
      costPerUnit: 0.05, // INR per gram
      currentStock: 100000.00, // 100kg initial stock
      minimumReorderLevel: 20000.00, // 20kg limit
      supplierId: vegSupplier.id,
      locationId: dryPantry.id,
    },
  });

  // Garlic
  const garlic = await prisma.ingredient.upsert({
    where: { id: 'ing-garlic-sweta' },
    update: {},
    create: {
      id: 'ing-garlic-sweta',
      tenantId: restaurant.tenantId,
      restaurantId: restaurant.id,
      name: 'Garlic',
      unitOfMeasure: 'GRAM',
      costPerUnit: 0.15,
      currentStock: 10000.00, // 10kg
      minimumReorderLevel: 2000.00, // 2kg
      supplierId: vegSupplier.id,
      locationId: dryPantry.id,
    },
  });

  // Ginger
  const ginger = await prisma.ingredient.upsert({
    where: { id: 'ing-ginger-sweta' },
    update: {},
    create: {
      id: 'ing-ginger-sweta',
      tenantId: restaurant.tenantId,
      restaurantId: restaurant.id,
      name: 'Ginger',
      unitOfMeasure: 'GRAM',
      costPerUnit: 0.15,
      currentStock: 10000.00, // 10kg
      minimumReorderLevel: 2000.00, // 2kg
      supplierId: vegSupplier.id,
      locationId: dryPantry.id,
    },
  });

  console.log('Ingredients seeded successfully.');

  // 4. Find all Menu Items that contain "Biryani" in the name
  console.log('Searching for Biryani menu items...');
  const biryaniItems = await prisma.menuItem.findMany({
    where: {
      category: {
        menu: {
          restaurantId: restaurant.id,
        },
      },
      name: {
        contains: 'biryani',
        mode: 'insensitive',
      },
    },
  });

  if (biryaniItems.length === 0) {
    console.log('⚠️ No Biryani menu items found. Checking all menu items for the restaurant...');
    const allItems = await prisma.menuItem.findMany({
      where: {
        category: {
          menu: {
            restaurantId: restaurant.id,
          },
        },
      },
    });
    console.log(`All available items: ${allItems.map(i => i.name).join(', ')}`);
    console.log('Writing standard Biryani recipe config for any newly added items...');
  } else {
    console.log(`Found ${biryaniItems.length} Biryani item(s): ${biryaniItems.map(i => i.name).join(', ')}`);
  }

  // Create recipes
  for (const item of biryaniItems) {
    console.log(`Setting up recipe for: ${item.name}...`);
    
    // Choose meat type based on name
    const isMutton = item.name.toLowerCase().includes('mutton');
    const meatIngredientId = isMutton ? mutton.id : chicken.id;
    const meatName = isMutton ? 'Mutton' : 'Chicken';

    // Settle Recipe
    const recipe = await prisma.recipe.upsert({
      where: { menuItemId: item.id },
      update: {},
      create: {
        menuItemId: item.id,
      },
    });

    // Delete existing recipe ingredients to prevent duplicates on repeat runs
    await prisma.recipeIngredient.deleteMany({
      where: { recipeId: recipe.id },
    });

    // Add ingredients to recipe
    await prisma.recipeIngredient.createMany({
      data: [
        { recipeId: recipe.id, ingredientId: meatIngredientId, quantityRequired: 250.00 }, // 250g meat
        { recipeId: recipe.id, ingredientId: onion.id, quantityRequired: 100.00 },        // 100g onion
        { recipeId: recipe.id, ingredientId: garlic.id, quantityRequired: 15.00 },         // 15g garlic
        { recipeId: recipe.id, ingredientId: ginger.id, quantityRequired: 15.00 },         // 15g ginger
      ],
    });

    console.log(`Recipe configured: 250g of ${meatName}, 100g of Onion, 15g of Garlic, 15g of Ginger per plate of ${item.name}.`);
  }

  console.log('Seed completed successfully!');
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Error running seed script:', err);
  process.exit(1);
});
