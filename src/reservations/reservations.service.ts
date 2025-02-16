import { BadRequestException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { PrismaClient } from '@prisma/client';
import { ShowtimesService } from 'src/showtimes/showtimes.service';
import { SeatsService } from 'src/seats/seats.service';
import { dateFormatter } from 'src/utils/date-formatter';

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

  async findAllByUser(userId: string) {
    try {
      const reservations = await this.reservations.findMany({
        where: {
          userId
        },
        include: {
          Showtimes: {
            select: {
              date: true,
              Movie: {
                select: {
                  title: true
                }
              }
            }
          }
        }
      });
      const formattedReservations = reservations.map((reservation) => ({
        reservation: reservation.id,
        price: reservation.price,
        movie: reservation.Showtimes?.Movie?.title,
        date: dateFormatter(reservation.Showtimes!.date)
      }));

      return {
        data: formattedReservations,
        message: 'Reservations retrieved successfully',
        status: HttpStatus.OK
      }
      
    } catch (error) {

      throw new InternalServerErrorException({
        message: 'An error occurred while retrieving the reservations.',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: error.name
      });
      
    }
  }

  async findAll() {

    const reservations = await this.reservations.findMany({
      where: {
        deletedAt: null
      }
    });

    const revenue = reservations.reduce((acc, reservation) => acc + reservation.price, 0);
    const capacity = reservations.length;

    const formattedReservations = reservations.map((reservation) => ({
      id: reservation.id,
      showtimeId: reservation.showtimeId,
      price: reservation.price
    }));

    return {
      data: {
        revenue,
        capacity,
        reservations: formattedReservations
      },
      message: 'Reservations retrieved successfully',
      status: HttpStatus.OK
    }
  }

  async cancel(id: number) {
    const reservation = await this.findById(id);
    try {

      const showtime = await this.showtimeService.findById(reservation!.showtimeId);

      if (showtime.date.getTime() < new Date().getTime()) {
        throw new BadRequestException({
          message: 'The reservation can not be cancelled because the showtime is already finished',
          status: HttpStatus.BAD_REQUEST,
          error: 'An error occurred while cancelling the reservation.'
        });
      }

      await this.reservations.update({
        data: {
          deletedAt: new Date()
        },
        where: {
          id
        }
      });
      return {
        data: {},
        message: 'Reservation cancelled successfully',
        status: HttpStatus.OK
      }

    } catch (error) {

      if (error instanceof BadRequestException) { 
        throw error;
      }

      throw new NotFoundException({
        message: `An error occurred while cancelling the reservation #${id}.`,
        status: HttpStatus.NOT_FOUND,
        error: 'Could not cancel the reservation'
      });
    }
  }
  
  async findById(id: number) {
    try {
      const reservation = await this.reservations.findFirst({
        where: {
          id,
          deletedAt: null
        }
      });

      if (!reservation) {
        throw new NotFoundException({
          message: `Reservation #${id} not found`,
          status: HttpStatus.NOT_FOUND,
          error: 'Reservation not found'
        });
      }

      return reservation;

    } catch (error) {
      throw new NotFoundException({
        message: `Reservation #${id} not found`,
        status: HttpStatus.NOT_FOUND,
        error: 'Reservation not found'
      });
    }
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
