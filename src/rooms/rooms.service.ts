import { HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class RoomsService extends PrismaClient {
  
  async create(createRoomDto: CreateRoomDto) {

    try {
      
      const totalSeats = createRoomDto.totalSeats;
      const {deletedAt, ...createdRoom} = await this.rooms.create({
        data: createRoomDto
      });
      
      await this.createSeatsForRoom(totalSeats, createdRoom.id);

      return {
        data: createdRoom,
        message: 'Room created successfully',
        status: HttpStatus.CREATED
      }

    } catch (error) {
      throw new InternalServerErrorException({
        message: 'An error occurred while creating the room.',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: error
      });
    }
  }

  async find() {
    
    const rooms = await this.rooms.findMany({
      where: {
        deletedAt: null
      }
    });

    const cleanedRooms = rooms.map((room) => {
      return {
        id: room.id,
        name: room.name,
        totalSeats: room.totalSeats,
        createdAt: room.createdAt
      }
    });

    return {
      data: cleanedRooms,
      message: 'Rooms retrieved successfully',
      status: HttpStatus.OK
    }

  }
  
  async update(id: number, updateRoomDto: UpdateRoomDto) {

    await this.findById(id);

    try {

      if (updateRoomDto.totalSeats) {
        await this.clearSeatsByRoomId(id);
        await this.createSeatsForRoom(updateRoomDto.totalSeats, id);
      }
      
      const { deletedAt, ...updatedRoom } = await this.rooms.update({
        data: {
          name: updateRoomDto.name,
          totalSeats: updateRoomDto.totalSeats
        },
        where: {
          id
        }
      });

      return {
        data: updatedRoom,
        message: 'Room updated successfully',
        status: HttpStatus.OK
      };

    } catch (error) {
      throw new InternalServerErrorException({
        message: 'An error occurred while updating the room.',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: error.name
      });
    }
  }
  
  async remove(id: number) {

    await this.findById(id);

    try {
      
      await this.rooms.update({
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
        message: 'Room deleted successfully',
        status: HttpStatus.OK
      };

    } catch (error) {

      throw new InternalServerErrorException({
        message: 'An error occurred while removing the movie.',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: error.name
      });
      
    }
  }
  
  private async findById(id: number) {

    const room = await this.rooms.findFirst({
      where: {
        id,
        deletedAt: null
      }
    });

    if (!room) {
      throw new NotFoundException({
        message: `Room with id #${id} not found`,
        status: HttpStatus.NOT_FOUND,
        error: 'Room not found'
      });
    }

    return room;

  }

  private async createSeatsForRoom(totalSeats: number, roomId: number) {

    const seatsPerRow = 10;
    const totalRows = Math.ceil(totalSeats / seatsPerRow);
    let seatNumber = 1;
      
    for (let rowIndex = 0; rowIndex < totalRows; rowIndex++) {
      const row = String.fromCharCode(65 + rowIndex);

      for (let seatIndex = 0; seatIndex < seatsPerRow; seatIndex++) {
        if (seatNumber > totalSeats) break;

        await this.seats.create({
          data: {
            roomId: roomId,
            row: row,
            number: seatIndex + 1,
          },
        });
        seatNumber++;
      }
    }

  }

  private async clearSeatsByRoomId(roomId: number) {

    await this.seats.updateMany({
      data: {
        deletedAt: new Date()
      },
      where: {
        roomId: roomId,
        deletedAt: null,
      }
    });
  }
}
