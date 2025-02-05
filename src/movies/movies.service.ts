import { BadRequestException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie, PrismaClient } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';
import { dateFormatter } from 'src/utils/date-formatter';

@Injectable()
export class MoviesService extends PrismaClient {

  async create(createMovieDto: CreateMovieDto, file: Express.Multer.File) {

    try {

      if (!file) throw new BadRequestException({
        message: `Couldn't create the movie.`,
        status: HttpStatus.BAD_REQUEST,
        error: 'Poster image is required'
      });

      if (!file.buffer) throw new BadRequestException({
        message: `Couldn't create the movie.`,
        status: HttpStatus.BAD_REQUEST,
        error: 'Invalid file upload'
      });

      const uploadDir = path.join(__dirname, '..', '..', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, file.originalname);
      fs.writeFileSync(filePath, file.buffer);

      const { deletedAt, ...movie } = await this.movie.create({
        data: {
          id: createMovieDto.id ?? Number(await this.getLastId()),
          title: createMovieDto.title,
          overview: createMovieDto.overview,
          posterImage: `/uploads/${file.originalname}`,
          duration: createMovieDto.duration,
          MovieGenre: {
            create: createMovieDto.genreIds.map((genreId) => ({
              genre: {
                connect: {id: genreId}
              }
            }))
          }
        }
      });
  
      const createdMovie =  {
        ...movie,
        id: Number(movie.id),
      }

      return {
        data: createdMovie,
        message: 'Movie created successfully',
        status: HttpStatus.CREATED
      }

    } catch (error) {
      if (error.code === "P2002") {
        throw new BadRequestException({
          message: `Couldn't create the movie.`,
          status: HttpStatus.BAD_REQUEST,
          error: 'The movie ID is duplicated'
        });
      } else if (error.code === "P2025") {
        throw new BadRequestException({
          message: `Couldn't create the movie.`,
          status: HttpStatus.BAD_REQUEST,
          error: 'The Genre ID does not exist'
        });
      } else {
        throw new InternalServerErrorException({
          message: 'An error occurred while creating the movie.',
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: error
        });
      }
    }
  }

  async find(genre?: string) {

    let movies: Movie[];

    if (genre) {
      
      const genreEntity = await this.genre.findFirst({
        where: {
          name: genre
        }
      });

      if (!genreEntity) throw new NotFoundException({
        message: 'An error occurred while searching the movies.',
        status: HttpStatus.NOT_FOUND,
        error: 'The genre does not exist'
      });

      movies = await this.movie.findMany({
        where: {
          MovieGenre: {
            some: {
              genreId: genreEntity.id
            }
          },
          deletedAt: null
        }
      });

    } else {

      movies = await this.movie.findMany({
        where: {
          deletedAt: null
        }
      });

    }

    const cleanedMovies = movies.map((movie) => {
      return {
        id: Number(movie.id),
        title: movie.title,
        overview: movie.overview,
        posterImage: movie.posterImage,
        duration: movie.duration,
        createdAt: movie.createdAt
      }
    });

    return {
      data: cleanedMovies,
      message: 'Movies retrieved successfully',
      status: HttpStatus.OK
    }    

  }

  async update(id: number, updateMovieDto: UpdateMovieDto) {

    await this.findById(id);

    try {
      const { deletedAt, ...movie } = await this.movie.update({
        data: {
          id: updateMovieDto.id,
          title: updateMovieDto.title,
          duration: updateMovieDto.duration,
          overview: updateMovieDto.overview,
        },
        where: {
          id
        }
      });

      const updatedMovie = {
        ...movie,
        id: Number(movie.id)
      };

      return {
        data: updatedMovie,
        message: 'Movie updated successfully',
        status: HttpStatus.OK
      };
      
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'An error occurred while updating the movie.',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: error.name
      });
    }
  }

  async remove(id: number) {
    
    await this.findById(id);

    try {
      await this.movie.update({
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
        message: 'Movie deleted successfully',
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

  async findById(id: number) {

    const movie = await this.movie.findFirst({
      where: {
        id,
        deletedAt: null
      }
    });

    if (!movie) {
      throw new NotFoundException({
        message: `Movie with id #${id} not found`,
        status: HttpStatus.NOT_FOUND,
        error: 'Movie not found'
      });
    }

    return movie;

  }

  async findMovieWithShowtimes(date: Date) {

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const movies = await this.movie.findMany({
      where: {
        Showtimes: {
          some: {
            date: {
              gte: startDate,
              lte: endDate
            }
          }
        },
        deletedAt: null
      },
      include: {
        Showtimes: {
          select: {
            date: true
          }
        }
      }
    });

    
    const cleanedMovies = movies.map((movie) => {
      return {
        id: Number(movie.id),
        title: movie.title,
        overview: movie.overview,
        posterImage: movie.posterImage,
        duration: movie.duration,
        showtimes: movie.Showtimes
          .filter((showtime) => {
            const showtimeDate = new Date(showtime.date);
            return showtimeDate >= startDate && showtimeDate <= endDate;
          })
          .map((showtime) => dateFormatter(showtime.date)),
      }
    });

    return {
      data: cleanedMovies,
      message: 'Movies retrieved successfully',
      status: HttpStatus.OK
    }
  }


  private async getLastId() {

    const lastMovie = await this.movie.findFirst({
      orderBy: { id: 'desc' },
      select: { id: true },
    });

    const nextId = lastMovie ? Number(lastMovie.id) + 1 : 1;

    return nextId;

  }
}
