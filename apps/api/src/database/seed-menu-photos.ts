import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const PHOTO_MAPPING: Record<string, string> = {
  // Biryani
  'veg biryani':
    'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
  'chicken biryani':
    'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&auto=format&fit=crop&q=80',
  'mutton biryani':
    'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=600&auto=format&fit=crop&q=80',

  // Starters
  'paneer tikka':
    'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600&auto=format&fit=crop&q=80',
  'chicken tikka':
    'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80',
  'chicken tikka kebab':
    'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80',
  'veg spring roll':
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',

  // Main Course
  'butter chicken':
    'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&auto=format&fit=crop&q=80',
  'paneer butter masala':
    'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80',
  'dal makhani':
    'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
  'butter garlic naan':
    'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
  'garlic naan':
    'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
  'butter naan':
    'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',

  // Drinks & Desserts
  'mango lassi':
    'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&auto=format&fit=crop&q=80',
  lassi:
    'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&auto=format&fit=crop&q=80',
  'masala chai':
    'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80',
  'gulab jamun':
    'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=600&auto=format&fit=crop&q=80',
  'gulab jamun (2 pcs)':
    'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=600&auto=format&fit=crop&q=80',
  rasgulla:
    'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
};

async function seedPhotos() {
  console.log('Connecting to database...');
  await prisma.$connect();

  console.log('Attaching delicious food photos to all restaurant menus...');

  const items = await prisma.menuItem.findMany();
  let updatedCount = 0;

  for (const item of items) {
    const lowerName = item.name.toLowerCase().trim();
    const matchedUrl =
      PHOTO_MAPPING[lowerName] ||
      Object.entries(PHOTO_MAPPING).find(([key]) =>
        lowerName.includes(key),
      )?.[1] ||
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80';

    await prisma.menuItem.update({
      where: { id: item.id },
      data: { imageUrl: matchedUrl },
    });
    console.log(
      `✓ Updated [${item.name}] with photo: ${matchedUrl.slice(0, 45)}...`,
    );
    updatedCount++;
  }

  console.log(`\nSuccessfully updated ${updatedCount} menu items with photos!`);
  await prisma.$disconnect();
}

seedPhotos().catch((e) => {
  console.error('Error seeding photos:', e);
  process.exit(1);
});
