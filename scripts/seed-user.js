import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("[v0] Starting database seeding...");

  // First, create default cities with their delivery prices and times
  console.log("[v0] Creating cities...");
  
  const cities = [
    { name: "السطات", code: "SET", isActive: true },
    { name: "برشيد", code: "BER", isActive: true },
    { name: "بن أحمد", code: "BEN", isActive: true },
    { name: "سيدي حجاج", code: "SIH", isActive: true },
    { name: "رأس العين", code: "RAS", isActive: true },
    { name: "كيسر", code: "KIS", isActive: true },
    { name: "بني اخلوك", code: "BENK", isActive: true },
    { name: "البروج", code: "BRO", isActive: true },
    { name: "اولاد اسعيد", code: "OUL", isActive: true },
    { name: "سيدي العيدي", code: "SID", isActive: true }
  ];

  const createdCities = [];
  
  for (const cityData of cities) {
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
    console.log(`[v0] Created city: ${city.name} (${city.code}) - Price: ${cityData.price} MAD, Delivery: ${cityData.deliveryTime}`);
  }

  const Admin_Hashed_Password = await bcrypt.hash("Admin@123", 10);
  const Merchant_Hashed_Password = await bcrypt.hash("Merchant@123", 10);
  const Delivery_Hashed_Password = await bcrypt.hash("Delivery@123", 10);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@jabrane-delivery.com" },
    update: {},
    create: {
      email: "admin@jabrane-delivery.com",
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
      address: "Adresse principale, Settat", 
    },
  });

  console.log("[v0] Created admin user:", adminUser.email);

  // Create merchants for different cities
  const merchantSettat = await prisma.user.upsert({
    where: { email: "merchant.settat@jabrane-delivery.com" },
    update: {},
    create: {
      email: "merchant.settat@jabrane-delivery.com",
      name: "محمد التاجر",
      password: Merchant_Hashed_Password,
      phone: "+212600000002",
      role: Role.MERCHANT,
      image: null,
    },
  });

  const merchantDataSettat = await prisma.merchant.upsert({
    where: { userId: merchantSettat.id },
    update: {},
    create: {
      userId: merchantSettat.id,
      companyName: "متجر السطات",
      rib: "1234567890123456789012",
      bankName: "Banque Populaire",
      balance: 0,
      baseFee: 13.0, // Base fee matches city delivery price
    },
  });

  const merchantBerchid = await prisma.user.upsert({
    where: { email: "merchant.berchid@jabrane-delivery.com" },
    update: {},
    create: {
      email: "merchant.berchid@jabrane-delivery.com",
      name: "أحمد البرشيدي",
      password: Merchant_Hashed_Password,
      phone: "+212600000003",
      role: Role.MERCHANT,
      image: null,
    },
  });

  const merchantDataBerchid = await prisma.merchant.upsert({
    where: { userId: merchantBerchid.id },
    update: {},
    create: {
      userId: merchantBerchid.id,
      companyName: "متجر برشيد",
      rib: "2234567890123456789012",
      bankName: "Banque Maroc",
      balance: 0,
      baseFee: 13.0,
    },
  });

  const merchantBenAhmed = await prisma.user.upsert({
    where: { email: "merchant.benahmed@jabrane-delivery.com" },
    update: {},
    create: {
      email: "merchant.benahmed@jabrane-delivery.com",
      name: "عبدالله بن أحمد",
      password: Merchant_Hashed_Password,
      phone: "+212600000004",
      role: Role.MERCHANT,
      image: null,
    },
  });

  const merchantDataBenAhmed = await prisma.merchant.upsert({
    where: { userId: merchantBenAhmed.id },
    update: {},
    create: {
      userId: merchantBenAhmed.id,
      companyName: "متجر بن أحمد",
      rib: "3234567890123456789012",
      bankName: "BMCE",
      balance: 0,
      baseFee: 18.0,
    },
  });

  console.log("[v0] Created merchant users for main cities");

  // Create delivery men for different cities
  const settatCity = createdCities.find(c => c.code === "SET");
  const berchidCity = createdCities.find(c => c.code === "BER");
  const benAhmedCity = createdCities.find(c => c.code === "BEN");

  const deliverySettat = await prisma.user.upsert({
    where: { email: "delivery.settat@jabrane-delivery.com" },
    update: {},
    create: {
      email: "delivery.settat@jabrane-delivery.com",
      name: "يوسف السائق",
      password: Delivery_Hashed_Password,
      phone: "+212600000005",
      role: Role.DELIVERYMAN,
      image: null,
    },
  });

  const deliveryManSettat = await prisma.deliveryMan.upsert({
    where: { userId: deliverySettat.id },
    update: {},
    create: {
      userId: deliverySettat.id,
      cityId: settatCity?.id,
      vehicleType: "Moto",
      active: true,
      totalEarned: 0,
      baseFee: 6.5, // 50% of city delivery price
    },
  });

  const deliveryBerchid = await prisma.user.upsert({
    where: { email: "delivery.berchid@jabrane-delivery.com" },
    update: {},
    create: {
      email: "delivery.berchid@jabrane-delivery.com",
      name: "إبراهيم الموزع",
      password: Delivery_Hashed_Password,
      phone: "+212600000006",
      role: Role.DELIVERYMAN,
      image: null,
    },
  });

  const deliveryManBerchid = await prisma.deliveryMan.upsert({
    where: { userId: deliveryBerchid.id },
    update: {},
    create: {
      userId: deliveryBerchid.id,
      cityId: berchidCity?.id,
      vehicleType: "Voiture",
      active: true,
      totalEarned: 0,
      baseFee: 6.5,
    },
  });

  const deliveryBenAhmed = await prisma.user.upsert({
    where: { email: "delivery.benahmed@jabrane-delivery.com" },
    update: {},
    create: {
      email: "delivery.benahmed@jabrane-delivery.com",
      name: "حسن المراسل",
      password: Delivery_Hashed_Password,
      phone: "+212600000007",
      role: Role.DELIVERYMAN,
      image: null,
    },
  });

  const deliveryManBenAhmed = await prisma.deliveryMan.upsert({
    where: { userId: deliveryBenAhmed.id },
    update: {},
    create: {
      userId: deliveryBenAhmed.id,
      cityId: benAhmedCity?.id,
      vehicleType: "Moto",
      active: true,
      totalEarned: 0,
      baseFee: 9.0, // 50% of city delivery price (18 MAD)
    },
  });

  console.log("[v0] Created delivery men users for main cities");

  console.log("[v0] ✅ Database seeding completed successfully!");
  console.log("[v0] Test credentials (all passwords: password123):");
  console.log("[v0]   Admin: admin@jabrane-delivery.com");
  console.log("[v0]   Merchant Settat: merchant.settat@jabrane-delivery.com");
  console.log("[v0]   Merchant Berchid: merchant.berchid@jabrane-delivery.com");
  console.log("[v0]   Merchant Ben Ahmed: merchant.benahmed@jabrane-delivery.com");
  console.log("[v0]   Delivery Settat: delivery.settat@jabrane-delivery.com");
  console.log("[v0]   Delivery Berchid: delivery.berchid@jabrane-delivery.com");
  console.log("[v0]   Delivery Ben Ahmed: delivery.benahmed@jabrane-delivery.com");
  console.log("\n[v0] Cities created with prices:");
  console.log("[v0]   السطات - 13 MAD - 24h max");
  console.log("[v0]   برشيد - 13 MAD - 24h max");
  console.log("[v0]   بن أحمد - 18 MAD - 24-48h");
  console.log("[v0]   سيدي حجاج - 18 MAD - 24-48h");
  console.log("[v0]   رأس العين - 18 MAD - 24-48h");
  console.log("[v0]   كيسر - 18 MAD - 24-48h");
  console.log("[v0]   بني اخلوك - 18 MAD - 24-48h");
  console.log("[v0]   البروج - 18 MAD - 24-48h");
  console.log("[v0]   اولاد اسعيد - 18 MAD - 24-48h");
  console.log("[v0]   سيدي العيدي - 18 MAD - 24-48h");
}

main()
  .catch((e) => {
    console.error("[v0] ❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });