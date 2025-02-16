import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  create(@Body() createReservationDto: CreateReservationDto) {
    return this.reservationsService.create(createReservationDto);
  }

  @Get()
  findAllByUser() {
    return this.reservationsService.findAll();
  }

  @Get(':id')
  findAll(@Param('id', ParseIntPipe) id: number) {
    return this.reservationsService.findAll();
  }

  @Delete(':id')
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.reservationsService.cancel(id);
  }
}
