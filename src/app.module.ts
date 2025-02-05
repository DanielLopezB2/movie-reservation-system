import { Module } from '@nestjs/common';
import { SeedModule } from './seed/seed.module';
import { MoviesModule } from './movies/movies.module';

@Module({
  imports: [SeedModule, MoviesModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
