import { Type } from "class-transformer";
import { IsInt, IsString, Min, MinLength } from "class-validator";

export class CreateRoomDto {

    @IsString()
    @MinLength(1)
    name: string;

    @IsInt()
    @Min(1)
    @Type(() => Number)
    totalSeats: number;
}
