import { HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaClient, ReservedSeats } from '@prisma/client';
import { ShowtimesService } from 'src/showtimes/showtimes.service';

@Injectable()
export class SeatsService extends PrismaClient {
  
  constructor(private readonly showtimesService: ShowtimesService) {
    super();
  }

  async findAllAvailableByShowtime(showtimeId: string) {

    const showtime = await this.showtimesService.findById(showtimeId);
    const availableSeats = await this.getAvailableSeats(showtime.roomId, showtimeId);

    const serializedSeats = availableSeats!.map(seat => ({
      id: seat.id,
      ubication: seat.row + seat.number,
      room: seat.Rooms?.name
    }));

    return {
      data: serializedSeats,
      message: `Available seats retrieved successfully`,
      status: HttpStatus.OK
    }

  }

  async findOneByUbication(showtimeId: string, ubication: string) {

    const row = ubication.charAt(0);
    const number = parseInt(ubication.slice(1), 10);
    const seat = await this.getSeatByUbicationForShowtime(row, number, showtimeId, ubication);

    if (!seat) return {
      data: {},
      message: `The seat ${ubication} is already taken`,
      status: HttpStatus.OK
    };

    return {
      data: {},
      message: `The seat ${ubication} is available`,
      status: HttpStatus.OK
    }
  }

  async getAvailableSeats(roomId: number, showtimeId: string) {
      
      const seats = await this.seats.findMany({
        where: {
          roomId: {
            equals: roomId
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

      return availableSeats;

  }

  async getSeatByUbicationForShowtime(row: string, number: number, showtimeId: string, ubication: string): Promise<Boolean> {

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
        return false;
      }

      return true;

    } catch (error) {
      throw new InternalServerErrorException({
        message: 'An error occurred while searching the seats.',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: error.name
      });      
    }

  }

  async reserveSeats(seatsId: number[], reservationId: number) {

    try {

      const reservedSeats: ReservedSeats[] = [];

      for (const seatId of seatsId) {
        const reservedSeat = await this.reservedSeats.create({
          data: {
            seatId,
            reservationId
          }
        });
        reservedSeats.push(reservedSeat);
      }

      return reservedSeats;

    } catch (error) {
      throw new InternalServerErrorException({
        message: 'An error occurred while reserving the seats.',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: error.name
      });      
    }
  }

}
