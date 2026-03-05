import { cache } from 'react';
import {prisma } from '@/lib/db';
import { getCurrentUser } from './auth-actions';

export const getMerchantDashboardData = cache(async () => {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const [merchant, stats, last7Days, bestSelling, recentOrders] = await Promise.all([
     prisma.merchant.findUnique({
        where: { userId: user.id },
        select: {
          user: { 
            select: { 
              name: true,
              email: true 
            } 
          },
          companyName: true,
          balance: true,
        },
      }),

     prisma.$queryRaw<Array<{
        totalOrders: number;
        pendingOrders: number;
        deliveredOrders: number;
        cancelledOrders: number;
        totalRevenue: number;
        pendingRevenue: number;
        totalProducts: number;
        totalStock: number;
        lowStockProducts: number;
        outOfStockProducts: number;
        inventoryValue: number;
        totalPaid: number;
      }>>`
        SELECT 
          (SELECT COUNT(*) FROM "Order" WHERE "merchantId" = m.id) as "totalOrders",
          (SELECT COUNT(*) FROM "Order" WHERE "merchantId" = m.id AND status = 'PENDING') as "pendingOrders",
          (SELECT COUNT(*) FROM "Order" WHERE "merchantId" = m.id AND status = 'DELIVERED') as "deliveredOrders",
          (SELECT COUNT(*) FROM "Order" WHERE "merchantId" = m.id AND status IN ('CANCELLED', 'REJECTED')) as "cancelledOrders",
          (SELECT COALESCE(SUM("totalPrice"), 0) FROM "Order" WHERE "merchantId" = m.id AND status = 'DELIVERED') as "totalRevenue",
          (SELECT COALESCE(SUM("totalPrice"), 0) FROM "Order" WHERE "merchantId" = m.id AND status NOT IN ('DELIVERED', 'CANCELLED', 'REJECTED')) as "pendingRevenue",
          (SELECT COUNT(*) FROM "Product" WHERE "merchantId" = m.id AND "deliveredCount" > 0) as "totalProducts",
          (SELECT COALESCE(SUM("stockQuantity"), 0) FROM "Product" WHERE "merchantId" = m.id) as "totalStock",
          (SELECT COUNT(*) FROM "Product" WHERE "merchantId" = m.id AND "stockQuantity" > 0 AND "stockQuantity" <= "lowStockAlert") as "lowStockProducts",
          (SELECT COUNT(*) FROM "Product" WHERE "merchantId" = m.id AND "stockQuantity" = 0) as "outOfStockProducts",
          (SELECT COALESCE(SUM("stockQuantity"), 0) FROM "Product" WHERE "merchantId" = m.id) as "inventoryValue",
          (SELECT COALESCE(SUM(amount), 0) FROM "MoneyTransfer" WHERE "merchantId" = m.id) as "totalPaid"
        FROM "Merchant" m
        WHERE m."userId" = ${user.id}
      `,

     prisma.$queryRaw<Array<{
        date: string;
        revenue: number;
        orders: number;
      }>>`
        SELECT 
          TO_CHAR(date_trunc('day', o."createdAt"), 'Dy') as date,
          COALESCE(SUM(o."totalPrice"), 0) as revenue,
          COUNT(*) as orders
        FROM "Order" o
        WHERE o."merchantId" = (SELECT id FROM "Merchant" WHERE "userId" = ${user.id})
          AND o.status = 'DELIVERED'
          AND o."createdAt" >= NOW() - INTERVAL '7 days'
        GROUP BY date_trunc('day', o."createdAt")
        ORDER BY date_trunc('day', o."createdAt") DESC
        LIMIT 7
      `,

     prisma.$queryRaw<Array<{
        productId: number;
        productName: string;
        productImage: string | null;
        quantity: number;
        revenue: number;
      }>>`
        SELECT 
          p.id as "productId",
          p.name as "productName",
          p.image as "productImage",
          SUM(oi.quantity) as quantity,
          SUM(oi.quantity) as revenue
        FROM "OrderItem" oi
        JOIN "Product" p ON p.id = oi."productId"
        JOIN "Order" o ON o.id = oi."orderId"
        WHERE o."merchantId" = (SELECT id FROM "Merchant" WHERE "userId" = ${user.id})
          AND o.status = 'DELIVERED'
          AND p."merchantId" = (SELECT id FROM "Merchant" WHERE "userId" = ${user.id})
        GROUP BY p.id, p.name, p.image
        ORDER BY quantity DESC
        LIMIT 5
      `,

     prisma.order.findMany({
        where: {
          merchant: { userId: user.id },
        },
        select: {
          id: true,
          orderCode: true,
          customerName: true,
          totalPrice: true,
          status: true,
          createdAt: true,
          orderItems: {
            select: {
              id: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
            take: 3,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }) as any, // Type assertion to avoid TypeScript errors
    ]);

    if (!merchant) return null;

    const statsData = stats[0] || {
      totalOrders: 0,
      pendingOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
      totalRevenue: 0,
      pendingRevenue: 0,
      totalProducts: 0,
      totalStock: 0,
      lowStockProducts: 0,
      outOfStockProducts: 0,
      inventoryValue: 0,
      totalPaid: 0,
    };

    return {
      merchant,
      stats: {
        orders: {
          total: Number(statsData.totalOrders),
          pending: Number(statsData.pendingOrders),
          delivered: Number(statsData.deliveredOrders),
          cancelled: Number(statsData.cancelledOrders),
        },
        revenue: {
          total: Number(statsData.totalRevenue),
          pending: Number(statsData.pendingRevenue),
        },
        products: {
          total: Number(statsData.totalProducts),
          totalStock: Number(statsData.totalStock),
          lowStock: Number(statsData.lowStockProducts),
          outOfStock: Number(statsData.outOfStockProducts),
          inventoryValue: Number(statsData.inventoryValue),
        },
        payments: {
          currentBalance: merchant.balance,
          totalPaid: Number(statsData.totalPaid),
        },
      },
      last7Days: last7Days.map(day => ({
        date: day.date,
        revenue: Number(day.revenue),
        orders: Number(day.orders),
      })),
      bestSellingProducts: bestSelling.map(item => ({
        product: {
          id: Number(item.productId),
          name: item.productName,
          image: item.productImage,
        },
        quantity: Number(item.quantity),
        revenue: Number(item.revenue),
      })),
      recentOrders,
    };
  } catch (error) {
    console.error('[v0] Error fetching dashboard data:', error);
    return null;
  }
});