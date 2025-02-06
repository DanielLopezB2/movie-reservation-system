import { Module } from '@nestjs/common';
import { SeatsService } from './seats.service';
import { SeatsController } from './seats.controller';
import { ShowtimesModule } from 'src/showtimes/showtimes.module';

@Module({
  controllers: [SeatsController],
  providers: [SeatsService],
  imports: [ShowtimesModule]
})
export class SeatsModule {}
