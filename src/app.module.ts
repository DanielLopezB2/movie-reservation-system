import { Module } from '@nestjs/common';
import { SeedModule } from './seed/seed.module';
import { MoviesModule } from './movies/movies.module';
import { ShowtimesModule } from './showtimes/showtimes.module';
import { RoomsModule } from './rooms/rooms.module';

@Module({
  imports: [SeedModule, MoviesModule, ShowtimesModule, RoomsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
