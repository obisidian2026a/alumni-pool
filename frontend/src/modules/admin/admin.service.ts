import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hash } from 'bcryptjs';
import { count, eq } from 'drizzle-orm';
import type { DrizzleDB } from '../../database/drizzle.provider';
import {
  activityLogs,
  categories,
  orderItems,
  orders,
  products,
  users,
} from '../../database/schema';

@Injectable()
export class AdminService {
  constructor(@Inject('DRIZZLE') private readonly db: DrizzleDB) {}

  async listUsers() {
    const rows = await this.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users);

    const [adminCountRow] = await this.db
      .select({ total: count() })
      .from(users)
      .where(eq(users.role, 'admin'));

    const [managerCountRow] = await this.db
      .select({ total: count() })
      .from(users)
      .where(eq(users.role, 'manager'));

    return {
      roles: [
        { role: 'admin' as const, count: adminCountRow.total },
        { role: 'manager' as const, count: managerCountRow.total },
      ],
      employees: rows,
    };
  }

  async updateUserRole(
    userId: string,
    role: 'admin' | 'manager',
    actorUserId: string,
  ) {
    const [existing] = await this.db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!existing) {
      throw new NotFoundException('User not found');
    }

    if (existing.id === actorUserId && role !== 'admin') {
      throw new BadRequestException('You cannot remove your own admin role');
    }

    if (existing.role === 'admin' && role !== 'admin') {
      const [adminCountRow] = await this.db
        .select({ total: count() })
        .from(users)
        .where(eq(users.role, 'admin'));

      if (adminCountRow.total <= 1) {
        throw new BadRequestException('At least one admin is required');
      }
    }

    const [updated] = await this.db
      .update(users)
      .set({
        role,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      });

    return updated;
  }

  async resetAndSeed() {
    await this.db.delete(activityLogs);
    await this.db.delete(orderItems);
    await this.db.delete(orders);
    await this.db.delete(products);
    await this.db.delete(categories);
    await this.db.delete(users);

    const adminPassword = await hash('AdminPass123', 12);
    const managerPassword = await hash('ManagerPass123', 12);

    const seededUsers = await this.db
      .insert(users)
      .values([
        {
          name: 'System Admin',
          email: 'admin@inventory.local',
          password: adminPassword,
          role: 'admin',
        },
        {
          name: 'Store Manager 1',
          email: 'manager1@inventory.local',
          password: managerPassword,
          role: 'manager',
        },
        {
          name: 'Store Manager 2',
          email: 'manager2@inventory.local',
          password: managerPassword,
          role: 'manager',
        },
      ])
      .returning({ id: users.id, role: users.role, email: users.email });

    const categorySeed = [
      { name: 'Electronics', description: 'Phones, accessories and devices' },
      { name: 'Computers', description: 'Laptops, desktops and peripherals' },
      { name: 'Office', description: 'Office supplies and productivity tools' },
      { name: 'Networking', description: 'Routers, switches and cables' },
      { name: 'Home', description: 'Home electronics and appliances' },
      { name: 'Gaming', description: 'Consoles and gaming accessories' },
      { name: 'Audio', description: 'Headphones, speakers and microphones' },
    ];

    const seededCategories = await this.db
      .insert(categories)
      .values(categorySeed)
      .returning({ id: categories.id, name: categories.name });

    const productsCatalog = [
      {
        name: 'iPhone 15 128GB',
        brand: 'Apple',
        description: 'Smartphone with OLED display and all-day battery life',
        categoryName: 'Electronics',
      },
      {
        name: 'Galaxy S24 256GB',
        brand: 'Samsung',
        description: 'Android flagship phone with high refresh-rate display',
        categoryName: 'Electronics',
      },
      {
        name: 'Pixel 8 Pro',
        brand: 'Google',
        description: 'AI-powered smartphone with advanced camera features',
        categoryName: 'Electronics',
      },
      {
        name: 'MacBook Air 13 M3',
        brand: 'Apple',
        description: 'Lightweight laptop for productivity and everyday work',
        categoryName: 'Computers',
      },
      {
        name: 'ThinkPad X1 Carbon Gen 12',
        brand: 'Lenovo',
        description: 'Business ultrabook with strong battery life and keyboard',
        categoryName: 'Computers',
      },
      {
        name: 'Dell XPS 15',
        brand: 'Dell',
        description: 'Premium laptop with high-resolution display',
        categoryName: 'Computers',
      },
      {
        name: 'MX Master 3S Mouse',
        brand: 'Logitech',
        description: 'Ergonomic wireless mouse for office and design workflows',
        categoryName: 'Office',
      },
      {
        name: 'Mechanical Keyboard K8 Pro',
        brand: 'Keychron',
        description: 'Hot-swappable mechanical keyboard with Bluetooth support',
        categoryName: 'Office',
      },
      {
        name: 'DeskJet 4155e Printer',
        brand: 'HP',
        description: 'All-in-one inkjet printer for home office use',
        categoryName: 'Office',
      },
      {
        name: 'RT-AX88U WiFi 6 Router',
        brand: 'ASUS',
        description: 'Dual-band router for reliable high-speed connections',
        categoryName: 'Networking',
      },
      {
        name: '24-Port Gigabit Switch',
        brand: 'TP-Link',
        description: 'Managed switch for small office network expansion',
        categoryName: 'Networking',
      },
      {
        name: 'Cat6 Ethernet Cable 10m',
        brand: 'Belkin',
        description: 'Shielded Ethernet cable for stable wired connectivity',
        categoryName: 'Networking',
      },
      {
        name: 'Dyson V12 Detect Slim',
        brand: 'Dyson',
        description: 'Cordless vacuum cleaner with laser dust detection',
        categoryName: 'Home',
      },
      {
        name: 'Ninja Foodi 10-in-1',
        brand: 'Ninja',
        description: 'Multi-cooker for pressure cooking and air frying',
        categoryName: 'Home',
      },
      {
        name: 'Philips 3200 Espresso Machine',
        brand: 'Philips',
        description: 'Bean-to-cup espresso machine with milk frother',
        categoryName: 'Home',
      },
      {
        name: 'PlayStation 5 Slim',
        brand: 'Sony',
        description: 'Next-generation console with fast SSD load times',
        categoryName: 'Gaming',
      },
      {
        name: 'Xbox Series X 1TB',
        brand: 'Microsoft',
        description: 'Powerful gaming console optimized for 4K gameplay',
        categoryName: 'Gaming',
      },
      {
        name: 'Nintendo Switch OLED',
        brand: 'Nintendo',
        description: 'Hybrid handheld and docked gaming console',
        categoryName: 'Gaming',
      },
      {
        name: 'WH-1000XM5 Headphones',
        brand: 'Sony',
        description: 'Wireless noise-cancelling over-ear headphones',
        categoryName: 'Audio',
      },
      {
        name: 'QuietComfort Ultra Earbuds',
        brand: 'Bose',
        description: 'Premium in-ear earbuds with adaptive noise cancellation',
        categoryName: 'Audio',
      },
      {
        name: 'Yeti USB Microphone',
        brand: 'Blue',
        description: 'USB condenser microphone for streaming and calls',
        categoryName: 'Audio',
      },
      {
        name: 'Galaxy Tab S9',
        brand: 'Samsung',
        description: 'Android tablet ideal for media and note taking',
        categoryName: 'Electronics',
      },
      {
        name: 'iPad Air 11',
        brand: 'Apple',
        description: 'Thin tablet with powerful processor for creative apps',
        categoryName: 'Electronics',
      },
      {
        name: 'Surface Laptop 6',
        brand: 'Microsoft',
        description: 'Portable productivity laptop with touchscreen display',
        categoryName: 'Computers',
      },
      {
        name: '27-inch 4K Monitor',
        brand: 'LG',
        description: 'High-resolution IPS monitor for work and design',
        categoryName: 'Computers',
      },
      {
        name: 'Noise Canceling Headset Zone Vibe',
        brand: 'Logitech',
        description: 'Comfortable wireless headset for video meetings',
        categoryName: 'Office',
      },
      {
        name: 'WiFi Mesh System Deco X55',
        brand: 'TP-Link',
        description: 'Whole-home mesh WiFi system with easy setup',
        categoryName: 'Networking',
      },
      {
        name: 'Robot Vacuum Roomba i5',
        brand: 'iRobot',
        description: 'App-controlled robot vacuum for daily floor cleaning',
        categoryName: 'Home',
      },
      {
        name: 'DualSense Wireless Controller',
        brand: 'Sony',
        description: 'Next-gen controller with adaptive trigger feedback',
        categoryName: 'Gaming',
      },
      {
        name: 'Portable Bluetooth Speaker Flip 6',
        brand: 'JBL',
        description: 'Durable portable speaker with punchy sound output',
        categoryName: 'Audio',
      },
      {
        name: 'External SSD T9 1TB',
        brand: 'Samsung',
        description: 'High-speed external SSD for backups and media files',
        categoryName: 'Computers',
      },
      {
        name: 'Webcam Brio 4K',
        brand: 'Logitech',
        description: 'Ultra HD webcam for video conferencing and streaming',
        categoryName: 'Office',
      },
    ] as const;

    const categoryByName = new Map(seededCategories.map((c) => [c.name, c.id]));

    const productSeed = productsCatalog.map((product, index) => {
      const categoryId =
        categoryByName.get(product.categoryName) ?? seededCategories[index % seededCategories.length].id;
      const stock = index % 5 === 0 ? 2 + (index % 2) : 15 + (index % 12);
      const minThreshold = 5 + (index % 4);
      const price = (79 + index * 11.25).toFixed(2);

      return {
        name: product.name,
        sku: `SKU-${String(index + 1).padStart(4, '0')}`,
        brand: product.brand,
        description: product.description,
        categoryId,
        price,
        stock,
        minThreshold,
        status: stock === 0 ? ('out_of_stock' as const) : ('active' as const),
      };
    });

    const seededProducts = await this.db
      .insert(products)
      .values(productSeed)
      .returning({ id: products.id, price: products.price, name: products.name });

    const activeProducts = seededProducts.slice(0, 24);
    const orderSeedRows: Array<{
      customerName: string;
      userId: string;
      status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
      totalPrice: string;
    }> = [];
    const itemSeedRows: Array<{
      orderIndex: number;
      productId: string;
      quantity: number;
      unitPrice: string;
    }> = [];

    const statuses: Array<
      'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
    > = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

    const customerNames = [
      'Ava Thompson',
      'Noah Martinez',
      'Mia Patel',
      'Liam Johnson',
      'Emma Rodriguez',
      'Ethan Walker',
      'Sophia Nguyen',
      'Lucas Bennett',
      'Isabella Garcia',
      'Mason Turner',
      'Amelia Wright',
      'James Campbell',
      'Charlotte Rivera',
      'Benjamin Flores',
      'Harper Cooper',
      'Elijah Morgan',
      'Evelyn Brooks',
      'Henry Diaz',
    ] as const;

    for (let i = 0; i < 18; i++) {
      const user = seededUsers[i % seededUsers.length];
      const itemA = activeProducts[i % activeProducts.length];
      const itemB = activeProducts[(i + 5) % activeProducts.length];
      const qtyA = 1 + (i % 3);
      const qtyB = 1 + ((i + 1) % 2);
      const total = (Number(itemA.price) * qtyA + Number(itemB.price) * qtyB).toFixed(2);

      orderSeedRows.push({
        customerName: customerNames[i],
        userId: user.id,
        status: statuses[i % statuses.length],
        totalPrice: total,
      });

      itemSeedRows.push({
        orderIndex: i,
        productId: itemA.id,
        quantity: qtyA,
        unitPrice: Number(itemA.price).toFixed(2),
      });

      itemSeedRows.push({
        orderIndex: i,
        productId: itemB.id,
        quantity: qtyB,
        unitPrice: Number(itemB.price).toFixed(2),
      });
    }

    const seededOrders = await this.db
      .insert(orders)
      .values(orderSeedRows)
      .returning({ id: orders.id });

    await this.db.insert(orderItems).values(
      itemSeedRows.map((row) => ({
        orderId: seededOrders[row.orderIndex].id,
        productId: row.productId,
        quantity: row.quantity,
        unitPrice: row.unitPrice,
      })),
    );

    const adminUser = seededUsers.find((user) => user.role === 'admin') ?? seededUsers[0];

    await this.db.insert(activityLogs).values(
      Array.from({ length: 20 }).map((_, i) => ({
        userId: adminUser.id,
        action: i % 2 === 0 ? 'PRODUCT_UPDATED' : 'ORDER_CREATED',
        entityType: i % 2 === 0 ? 'product' : 'order',
        entityId:
          i % 2 === 0
            ? seededProducts[i % seededProducts.length].id
            : seededOrders[i % seededOrders.length].id,
        metadata: {
          source: 'seed',
          index: i + 1,
        },
      })),
    );

    return {
      message: 'Database reset and seeded successfully',
      users: seededUsers.length,
      categories: seededCategories.length,
      products: seededProducts.length,
      orders: seededOrders.length,
      orderItems: itemSeedRows.length,
      activityLogs: 20,
      loginUsers: [
        { email: 'admin@inventory.local', password: 'AdminPass123', role: 'admin' },
        { email: 'manager1@inventory.local', password: 'ManagerPass123', role: 'manager' },
        { email: 'manager2@inventory.local', password: 'ManagerPass123', role: 'manager' },
      ],
    };
  }
}
