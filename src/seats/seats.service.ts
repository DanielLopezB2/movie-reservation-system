import { HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ShowtimesService } from 'src/showtimes/showtimes.service';

@Injectable()
export class SeatsService extends PrismaClient {
  
  constructor(private readonly showtimesService: ShowtimesService) {
    super();
  }

  async findAllAvailableByShowtime(showtimeId: string) {

    const showtime = await this.showtimesService.findById(showtimeId);

    try {

      const seats = await this.seats.findMany({
        where: {
          roomId: {
            equals: showtime.roomId
          },
          deletedAt: null
        },
        include: {
          ReservedSeats: {
            where: {
              Reservations: {
                showtimeId,
                deletedAt: null
              }
            }
          },
          Rooms: {
            select: {
              name: true
            }
          }
        }
      });

      const availableSeats = seats.filter(seat => seat.ReservedSeats.length === 0);

      const serializedSeats = availableSeats.map(seat => ({
        id: seat.id,
        ubication: seat.row + seat.number,
        room: seat.Rooms?.name
      }));

      return {
        data: serializedSeats,
        message: `Available seats retrieved successfully`,
        status: HttpStatus.OK
      }

    } catch (error) {
      throw new InternalServerErrorException({
        message: 'An error occurred while cancelling the showtime.',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: error.name
      });
    }
  }

  async findOneByUbication(showtimeId: string, ubication: string) {

    const row = ubication.charAt(0);
    const number = parseInt(ubication.slice(1), 10);

    try {

      const seat = await this.seats.findFirst({
        where: {
          row,
          number,
          Rooms: {
            showtimes: {
              some: {
                id: showtimeId,
                deletedAt: null
              },
            },
          },
        },
        include: {
          ReservedSeats: {
            where: {
              Reservations: {
                showtimeId,
                deletedAt: null
              },
            },
          },
        },
      });

      if (!seat) {
        throw new NotFoundException({
          message: 'An error occurred while retrieving the seat availability.',
          status: HttpStatus.NOT_FOUND,
          error: 'This seat does not exist'
        })
      }

      if (seat.ReservedSeats.length > 0) {
        return {
          data: {},
          message: `The seat ${ubication} is already taken`,
          status: HttpStatus.OK
        };
      }

      return {
        data: {},
        message: `The seat ${ubication} is available`,
        status: HttpStatus.OK
      }
      
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'An error occurred while cancelling the showtime.',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: error.name
      });
    }
  }

}
