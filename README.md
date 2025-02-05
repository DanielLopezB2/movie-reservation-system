<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# Movie Reservation System API - Daniel Lopez

* Project idea by: https://roadmap.sh/projects/movie-reservation-system

## Tech Stack

* PostgreSQL
* NestJs
* Prisma

## Project setup
1. Clone project
```
https://github.com/DanielLopezB2/movie-reservation-system
```

2. Install packages
```bash
$ npm install
```

3. Clone .env.template and rename it to .env

4. Generate a TMDB Api Key to populate the Genres and Movies

5. Change the .env variables

## API Usage

* Run seeders first

1. Reset tables
```
GET
http://localhost:3000/api/v1/seed/reset
```

2. Genres seed
```
GET
http://localhost:3000/api/v1/seed/genres
```

3. Genres seed
```
GET
http://localhost:3000/api/v1/seed/movies
```