import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { SeatsService } from './seats.service';

@Controller('seats')
export class SeatsController {

  constructor(private readonly seatsService: SeatsService) {}


  @Get('showtime/:showtimeId')
  findAllAvailableByShowtime(@Param('showtimeId', ParseUUIDPipe) showtimeId: string) {
    return this.seatsService.findAllAvailableByShowtime(showtimeId);
  }

  @Get(':showtimeId/:ubication')
  findOneByUbication(@Param('showtimeId', ParseUUIDPipe) showtimeId: string, @Param('ubication') ubication: string) {
    return this.seatsService.findOneByUbication(showtimeId, ubication);
  }
}
