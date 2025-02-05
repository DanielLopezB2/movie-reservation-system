import { Type } from "class-transformer";
import { IsDate, IsInt, IsNumber } from "class-validator";

export class CreateShowtimeDto {

    @IsNumber()
    @Type(() => Number)
    movieId: number;

    @IsDate()
    @Type(() => Date)
    date: Date;

    @IsInt()
    @Type(() => Number)
    roomId: number;

}
