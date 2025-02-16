import { BadRequestException, HttpStatus, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { PrismaClient } from '@prisma/client';
import { ShowtimesService } from 'src/showtimes/showtimes.service';
import { SeatsService } from 'src/seats/seats.service';

@Injectable()
export class ReservationsService extends PrismaClient {

  constructor(
    private readonly showtimeService: ShowtimesService,
    private readonly seatsService: SeatsService
  ) {
    super();
  }

  async create(createReservationDto: CreateReservationDto) {

    for (const seatId of createReservationDto.seatsId) {
      if (!await this.checkReservedSeatsAvailability(seatId, createReservationDto.showtimeId)) {
        throw new BadRequestException({
          message: 'An error occurred while creating the reservation.',
          status: HttpStatus.BAD_REQUEST,
          error: 'One or more seats selected are taken'
        });
      }
    }

    try {

      let price = 0;

      if (createReservationDto.price = 2) {
        price = 19.99
      } else {
        price = 11.99
      }

      const {deletedAt, ...createdReservation} = await this.reservations.create({
        data: {
          showtimeId: createReservationDto.showtimeId,
          userId: createReservationDto.userId,
          price: price
        }
      });

      await this.showtimeService.updateAvailableTicketsCount(createReservationDto.showtimeId, createReservationDto.seatsId.length);
      await this.seatsService.reserveSeats(createReservationDto.seatsId, createdReservation.id);

      return {
        data: createdReservation,
        message: 'Reservation created successfully',
        status: HttpStatus.CREATED
      }

    } catch (error) {
      throw new InternalServerErrorException({
        message: 'An error occurred while creating the reservation.',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: error
      });
    }
  }

  async findAllByUser() {
    return `This action returns all reservations`;
  }

  async findAll() {
    return `This action returns all reservations`;
  }

  async cancel(id: number) {
    return `This action removes a #${id} reservation`;
  }

  private async checkReservedSeatsAvailability(seatId: number, showtimeId: string): Promise<Boolean> {

    try {
      const existingReservation = await this.reservedSeats.findFirst({
        where: {
          seatId,
          Reservations: {
            showtimeId,
            deletedAt: null
          },
        },
      });
      return !existingReservation;
    } catch (error) {
      throw new InternalServerErrorException({
        message: "An error occurred while checking seat availability.",
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: error,
      });
    }

  }
}
