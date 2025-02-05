import { BadRequestException, HttpStatus, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { GenresResponse } from './interfaces/genres-response.interface';
import { MoviesResponse } from './interfaces/movies-response.interface';

@Injectable()
export class SeedService extends PrismaClient implements OnModuleInit {
  
  
  onModuleInit() {
    this.$connect;
  }

  constructor(private readonly httpService: HttpService) {
    super();
  }

  async resetTables() {

    await this.movieGenre.deleteMany();
    await this.movie.deleteMany();
    await this.genre.deleteMany();

    return {
      message: 'Tables data resetted correctly',
      status: HttpStatus.OK
    };

  }

  async seedGenres() {
    const genres = await this.getGenresFromTMDB();
    for (const genre of genres) {
      await this.genre.create({
        data: {
          id: genre.id,
          name: genre.name,
        },
      });
    }

    return {
      message: 'Genres seed executed correctly',
      status: HttpStatus.OK
    };
  }

  async seedMovies() {
    const baseImageUrl = 'https://image.tmdb.org/t/p/original';
    const movies = (await this.getPopularMovies(15)).results;
    for (const movie of movies) {
      const createdMovie = await this.movie.create({
        data: {
          id: movie.id,
          title: movie.title,
          overview: movie.overview,
          posterImage: baseImageUrl+movie.poster_path,
          duration: Math.floor(Math.random() * (250 - 100 + 1)) + 100
        },
      });

      this.seedMoviesGenresRelation(movie.genre_ids, createdMovie);
    }

    return {
      message: 'Movies seed executed correctly',
      status: HttpStatus.OK
    };
  }


  private async getGenresFromTMDB(): Promise<GenresResponse[]> {
    const url = 'https://api.themoviedb.org/3/genre/movie/list?language=en';
    try {
      const response = await firstValueFrom(this.httpService.get(url, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${process.env.TMDB_TOKEN}`,
        }
      })); 
      return response.data.genres;
    } catch (error) {
      throw new BadRequestException(error); 
    }
  }

  private async getPopularMovies(page: number): Promise<MoviesResponse> {
    const url = `https://api.themoviedb.org/3/trending/movie/week?language=en-US&page=${page}`;
    try {
      const response = await firstValueFrom(this.httpService.get(url, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${process.env.TMDB_TOKEN}`,
        }
      }));
      return response.data;
    } catch (error) {
      throw new BadRequestException(error); 
    }
  }

  private async seedMoviesGenresRelation(genreIds: number[], createdMovie: any) {
    for (const genreId of genreIds) {
      const genre = await this.genre.findUnique({
        where: { id: genreId },
      });

      if (genre) {
        await this.movieGenre.create({
          data: {
            movieId: createdMovie.id,
            genreId: genre.id,
          },
        });
      } else {
        throw new NotFoundException(`Genre with id ${genreId} not found`);
      }
    }
  }

}
