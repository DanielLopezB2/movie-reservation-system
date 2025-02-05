-- AddForeignKey
ALTER TABLE "Showtimes" ADD CONSTRAINT "Showtimes_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
