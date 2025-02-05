import { BadRequestException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateShowtimeDto } from './dto/create-showtime.dto';
import { UpdateShowtimeDto } from './dto/update-showtime.dto';
import { PrismaClient } from '@prisma/client';
import { RoomsService } from 'src/rooms/rooms.service';
import { MoviesService } from 'src/movies/movies.service';

@Injectable()
export class ShowtimesService extends PrismaClient {

  constructor(
    private readonly roomsService: RoomsService,
    private readonly moviesService: MoviesService
  ) {
    super();
  }

  async create(createShowtimeDto: CreateShowtimeDto) {
    
    const room = await this.roomsService.findById(createShowtimeDto.roomId);
    const movie = await this.moviesService.findById(createShowtimeDto.movieId);

    if (!await this.checkRoomAvailability(createShowtimeDto.roomId, createShowtimeDto.date, movie.duration)) {
      throw new BadRequestException({
        message: 'An error occurred while creating the showtime.',
        status: HttpStatus.BAD_REQUEST,
        error: 'The room is not available for the selected time'
      });
    }

    try {

      const {deletedAt, ...createdShowtime} = await this.showtimes.create({
        data: {
          ...createShowtimeDto,
          availableTickets: room.totalSeats
        }
      });

      const sanitizedShowtime = {
        ...createdShowtime,
        movieId: Number(createdShowtime.movieId)
      };

      return {
        data: sanitizedShowtime,
        message: 'Showtime created successfully',
        status: HttpStatus.CREATED
      }

    } catch (error) {
      throw new InternalServerErrorException({
        message: 'An error occurred while creating the showtime.',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: error
      });
    }
  }

  async update(id: string, updateShowtimeDto: UpdateShowtimeDto) {

    await this.findById(id);

    try {

      const { deletedAt, ...showtime } = await this.showtimes.update({
        data: updateShowtimeDto,
        where: {
          id
        }
      });

      return {
        data: showtime,
        message: 'Showtime updated successfully',
        status: HttpStatus.OK
      };
      
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'An error occurred while updating the showtime.',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: error.name
      });
    }
  }
  
  async cancel(id: string) {

    await this.findById(id);

    try {

      await this.showtimes.update({
        data: {
          deletedAt: new Date()
        },
        where: {
          id,
          deletedAt: null
        }
      });
      
      return {
        data: {},
        message: 'Showtime cancelled successfully',
        status: HttpStatus.OK
      };
      
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'An error occurred while cancelling the showtime.',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: error.name
      });
    }
  }
  
  async find() {

    const showtimes = await this.showtimes.findMany({
      where: {
        deletedAt: null
      },
      include: {
        Movie: {
          select: {
            title: true
          }
        },
        Rooms: {
          select: {
            name: true
          }
        }
      }
    });

    const formattedShowtimes = showtimes.map((showtime) => ({
      id: showtime.id,
      movieTitle: showtime.Movie?.title,
      roomName: showtime.Rooms?.name,
      date: showtime.date,
      availableTickets: showtime.availableTickets,
    }));

    return {
      data: formattedShowtimes,
      message: 'Showtimes retrieved successfully',
      status: HttpStatus.OK
    }

  }
  
  async findById(id: string) {
    
    const showtime = await this.showtimes.findFirst({
      where: {
        id,
        deletedAt: null
      }
    });

    if (!showtime) {
      throw new NotFoundException({
        message: `Showtime with id #${id} not found`,
        status: HttpStatus.NOT_FOUND,
        error: 'Showtime not found'
      });
    }

    return showtime;
  }
  

  private async checkRoomAvailability(roomId: number, date: Date, duration: number): Promise<Boolean> {
  
    const existingShowtimes = await this.showtimes.findMany({
      where: { roomId: roomId },
      orderBy: { date: 'asc' },
    });
  
    const newShowtimeStart = new Date(date);
    const newShowtimeEnd = new Date(
      newShowtimeStart.getTime() + duration * 60 * 1000
    );
  
    for (const showtime of existingShowtimes) {
      const existingStart = new Date(showtime.date);
      const existingEnd = new Date(
        existingStart.getTime() + duration * 60 * 1000
      );
  
      if (
        (newShowtimeStart >= existingStart && newShowtimeStart < existingEnd) ||
        (newShowtimeEnd > existingStart && newShowtimeEnd <= existingEnd) ||
        (newShowtimeStart <= existingStart && newShowtimeEnd >= existingEnd)
      ) {
        return false;
      }
    }
  
    return true;
  }

}
