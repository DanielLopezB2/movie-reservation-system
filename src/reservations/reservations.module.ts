import { Module } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { SeatsModule } from 'src/seats/seats.module';
import { ShowtimesModule } from 'src/showtimes/showtimes.module';

@Module({
  controllers: [ReservationsController],
  providers: [ReservationsService],
  imports: [SeatsModule, ShowtimesModule]
})
export class ReservationsModule {}
