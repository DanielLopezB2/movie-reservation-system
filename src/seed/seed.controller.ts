import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SeedService } from './seed.service';

@Controller('seed')
export class SeedController {
  
  constructor(private readonly seedService: SeedService) {}

  @Get('genres')
  seedGenres() {
    return this.seedService.seedGenres();
  }

  @Get('movies')
  seedMovies() {
    return this.seedService.seedMovies();
  }

  @Get('reset')
  resetTables() {
    return this.seedService.resetTables();
  }

}
