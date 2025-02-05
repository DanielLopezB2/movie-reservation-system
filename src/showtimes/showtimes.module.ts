import { Module } from '@nestjs/common';
import { ShowtimesService } from './showtimes.service';
import { ShowtimesController } from './showtimes.controller';
import { RoomsModule } from 'src/rooms/rooms.module';
import { MoviesModule } from 'src/movies/movies.module';

@Module({
  controllers: [ShowtimesController],
  providers: [ShowtimesService],
  imports: [RoomsModule, MoviesModule]
})
export class ShowtimesModule {}
