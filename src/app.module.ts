import { Module } from '@nestjs/common';
import { SeedModule } from './seed/seed.module';
import { MoviesModule } from './movies/movies.module';
import { ShowtimesModule } from './showtimes/showtimes.module';
import { RoomsModule } from './rooms/rooms.module';
import { SeatsModule } from './seats/seats.module';
import { ReservationsModule } from './reservations/reservations.module';

@Module({
  imports: [SeedModule, MoviesModule, ShowtimesModule, RoomsModule, SeatsModule, ReservationsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
