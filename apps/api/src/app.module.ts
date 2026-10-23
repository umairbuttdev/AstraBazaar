import { Module } from '@nestjs/common';
import { AppController, HealthController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AccountModule } from './account/account.module.js';
import { AdminModule } from './admin/admin.module.js';
import { AuthModule } from './auth/auth.module.js';
import { BrandsModule } from './brands/brands.module.js';
import { CartModule } from './cart/cart.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { CheckoutModule } from './checkout/checkout.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProductsModule } from './products/products.module.js';
import { WishlistModule } from './wishlist/wishlist.module.js';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    CategoriesModule,
    BrandsModule,
    ProductsModule,
    CartModule,
    WishlistModule,
    CheckoutModule,
    AccountModule,
    AdminModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
