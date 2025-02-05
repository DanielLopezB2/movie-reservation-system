import { Module } from '@nestjs/common';
import { SeedModule } from './seed/seed.module';

@Module({
  imports: [SeedModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
