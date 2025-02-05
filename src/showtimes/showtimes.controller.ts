import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { ShowtimesService } from './showtimes.service';
import { CreateShowtimeDto } from './dto/create-showtime.dto';
import { UpdateShowtimeDto } from './dto/update-showtime.dto';

@Controller('showtimes')
export class ShowtimesController {

  constructor(private readonly showtimesService: ShowtimesService) {}

  @Post()
  create(@Body() createShowtimeDto: CreateShowtimeDto) {
    return this.showtimesService.create(createShowtimeDto);
  }

  @Get()
  find() {
    return this.showtimesService.find();
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateShowtimeDto: UpdateShowtimeDto) {
    return this.showtimesService.update(id, updateShowtimeDto);
  }

  @Delete(':id')
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.showtimesService.cancel(id);
  }
  
}
