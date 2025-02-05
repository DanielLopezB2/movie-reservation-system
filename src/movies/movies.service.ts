import { BadRequestException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie, PrismaClient } from '@prisma/client';

@Injectable()
export class MoviesService extends PrismaClient {

  async create(createMovieDto: CreateMovieDto) {

    try {
      const { deletedAt, ...movie } = await this.movie.create({
        data: {
          id: createMovieDto.id ?? Number(await this.getLastId()),
          title: createMovieDto.title,
          overview: createMovieDto.overview,
          posterImage: createMovieDto.posterImage,
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
          posterImage: updateMovieDto.posterImage
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
          id
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

  private async findById(id: number) {

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

  private async getLastId() {

    const lastMovie = await this.movie.findFirst({
      orderBy: { id: 'desc' },
      select: { id: true },
    });

    const nextId = lastMovie ? Number(lastMovie.id) + 1 : 1;

    return nextId;

  }
}
