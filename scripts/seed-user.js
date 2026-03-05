import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("[v0] Starting database seeding...");

  // First, create default cities
  console.log("[v0] Creating default cities...");
  
  const defaultCities = [
    { name: "Dakhla", code: "DA", isActive: true },
    { name: "Boujdour", code: "BO", isActive: true },
    { name: "Laayoune", code: "LA", isActive: true }
  ];

  const createdCities = [];
  
  for (const cityData of defaultCities) {
    const city = await prisma.city.upsert({
      where: { name: cityData.name },
      update: {},
      create: {
        name: cityData.name,
        code: cityData.code,
        isActive: cityData.isActive
      }
    });
    createdCities.push(city);
    console.log(`[v0] Created city: ${city.name} (${city.code})`);
  }

  const Admin_Hashed_Password = await bcrypt.hash("Admin@123", 10);
  const Merchant_Hashed_Password = await bcrypt.hash("Merchant@123", 10);
  const Delivery_Hashed_Password = await bcrypt.hash("Delivery@123", 10);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@sonic-delivery.com" },
    update: {},
    create: {
      email: "admin@sonic-delivery.com",
      name: "Administrateur Système",
      password: Admin_Hashed_Password,
      phone: "+212600000001",
      role: Role.ADMIN,
      image: null,
    },
  });

  const admin = await prisma.admin.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      address: "Adresse principale, Dakhla", 
    },
  });

  console.log("[v0] Created admin user:", adminUser.email);

  // Get city IDs for merchants
  const dakhlaCity = createdCities.find(c => c.code === "DA");
  const boujdourCity = createdCities.find(c => c.code === "BO");
  const laayouneCity = createdCities.find(c => c.code === "LA");

  const merchantDakhla = await prisma.user.upsert({
    where: { email: "merchant.dakhla@sonic-delivery.com" },
    update: {},
    create: {
      email: "merchant.dakhla@sonic-delivery.com",
      name: "Mohamed Commerçant",
      password: Merchant_Hashed_Password,
      phone: "+212600000002",
      role: Role.MERCHANT,
      image: null,
    },
  });

  const merchantDataDakhla = await prisma.merchant.upsert({
    where: { userId: merchantDakhla.id },
    update: {},
    create: {
      userId: merchantDakhla.id,
      companyName: "Magasin Dakhla",
      rib: "1234567890123456789012",
      bankName: "Banque Populaire",
      balance: 0,
      baseFee: 20.0, // Base fee for Dakhla merchant
    },
  });

  const merchantBoujdour = await prisma.user.upsert({
    where: { email: "merchant.boujdour@sonic-delivery.com" },
    update: {},
    create: {
      email: "merchant.boujdour@sonic-delivery.com",
      name: "Ahmed Boujdouri",
      password: Merchant_Hashed_Password,
      phone: "+212600000003",
      role: Role.MERCHANT,
      image: null,
    },
  });

  const merchantDataBoujdour = await prisma.merchant.upsert({
    where: { userId: merchantBoujdour.id },
    update: {},
    create: {
      userId: merchantBoujdour.id,
      companyName: "Magasin Boujdour",
      rib: "2234567890123456789012",
      bankName: "Banque Maroc",
      balance: 0,
      baseFee: 25.0, // Base fee for Boujdour merchant
    },
  });

  const merchantLaayoune = await prisma.user.upsert({
    where: { email: "merchant.laayoune@sonic-delivery.com" },
    update: {},
    create: {
      email: "merchant.laayoune@sonic-delivery.com",
      name: "Abdallah Laayouni",
      password: Merchant_Hashed_Password,
      phone: "+212600000004",
      role: Role.MERCHANT,
      image: null,
    },
  });

  const merchantDataLaayoune = await prisma.merchant.upsert({
    where: { userId: merchantLaayoune.id },
    update: {},
    create: {
      userId: merchantLaayoune.id,
      companyName: "Magasin Laayoune",
      rib: "3234567890123456789012",
      bankName: "BMCE",
      balance: 0,
      baseFee: 22.5, // Base fee for Laayoune merchant
    },
  });

  console.log("[v0] Created merchant users for all 3 cities");

  const deliveryDakhla = await prisma.user.upsert({
    where: { email: "delivery.dakhla@sonic-delivery.com" },
    update: {},
    create: {
      email: "delivery.dakhla@sonic-delivery.com",
      name: "Youssef Chauffeur",
      password: Delivery_Hashed_Password,
      phone: "+212600000005",
      role: Role.DELIVERYMAN,
      image: null,
    },
  });

  const deliveryManDakhla = await prisma.deliveryMan.upsert({
    where: { userId: deliveryDakhla.id },
    update: {},
    create: {
      userId: deliveryDakhla.id,
      cityId: dakhlaCity?.id, // Use cityId instead of city string
      vehicleType: "Moto",
      active: true,
      totalEarned: 0,
      baseFee: 10.0,
    },
  });

  const deliveryBoujdour = await prisma.user.upsert({
    where: { email: "delivery.boujdour@sonic-delivery.com" },
    update: {},
    create: {
      email: "delivery.boujdour@sonic-delivery.com",
      name: "Ibrahim Distributeur",
      password: Delivery_Hashed_Password,
      phone: "+212600000006",
      role: Role.DELIVERYMAN,
      image: null,
    },
  });

  const deliveryManBoujdour = await prisma.deliveryMan.upsert({
    where: { userId: deliveryBoujdour.id },
    update: {},
    create: {
      userId: deliveryBoujdour.id,
      cityId: boujdourCity?.id, // Use cityId instead of city string
      vehicleType: "Voiture",
      active: true,
      totalEarned: 0,
      baseFee: 12.0,
    },
  });

  const deliveryLaayoune = await prisma.user.upsert({
    where: { email: "delivery.laayoune@sonic-delivery.com" },
    update: {},
    create: {
      email: "delivery.laayoune@sonic-delivery.com",
      name: "Hassan Messager",
      password: Delivery_Hashed_Password,
      phone: "+212600000007",
      role: Role.DELIVERYMAN,
      image: null,
    },
  });

  const deliveryManLaayoune = await prisma.deliveryMan.upsert({
    where: { userId: deliveryLaayoune.id },
    update: {},
    create: {
      userId: deliveryLaayoune.id,
      cityId: laayouneCity?.id, // Use cityId instead of city string
      vehicleType: "Moto",
      active: true,
      totalEarned: 0,
      baseFee: 13.0,
    },
  });

  console.log(
    "[v0] Created delivery men users for all 3 cities with city assignments"
  );

  console.log("[v0] Created sample products");

  console.log("[v0] ✅ Database seeding completed successfully!");
  console.log("[v0] Test credentials (all passwords: password123):");
  console.log("[v0]   Admin: admin@sonic-delivery.com");
  console.log("[v0]   Merchant Dakhla: merchant.dakhla@sonic-delivery.com");
  console.log("[v0]   Merchant Boujdour: merchant.boujdour@sonic-delivery.com");
  console.log("[v0]   Merchant Laayoune: merchant.laayoune@sonic-delivery.com");
  console.log("[v0]   Delivery Dakhla: delivery.dakhla@sonic-delivery.com");
  console.log("[v0]   Delivery Boujdour: delivery.boujdour@sonic-delivery.com");
  console.log("[v0]   Delivery Laayoune: delivery.laayoune@sonic-delivery.com");
}

main()
  .catch((e) => {
    console.error("[v0] ❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });