-- AlterTable
ALTER TABLE "Genre" ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "Genre_id_seq";

-- AlterTable
ALTER TABLE "Movie" ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "Movie_id_seq";
