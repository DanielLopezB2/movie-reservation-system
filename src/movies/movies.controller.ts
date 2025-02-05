import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('movies')
export class MoviesController {

  constructor(private readonly moviesService: MoviesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('posterImage'))
  create(@Body() createMovieDto: CreateMovieDto, @UploadedFile() file: Express.Multer.File) {
    return this.moviesService.create(createMovieDto, file);
  }

  @Get()
  find(@Query('genre') genre: string) {
    if (genre) {
      const formattedGenre = genre.charAt(0).toUpperCase() + genre.slice(1).toLowerCase();
      return this.moviesService.find(formattedGenre);
    } else {
      return this.moviesService.find(genre);
    }
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateMovieDto: UpdateMovieDto) {
    return this.moviesService.update(id, updateMovieDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.moviesService.remove(id);
  }
}
