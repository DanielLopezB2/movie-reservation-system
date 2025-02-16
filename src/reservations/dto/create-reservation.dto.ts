import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsInt, IsNumber, IsOptional, IsPositive, IsUUID, Min } from "class-validator";

export class CreateReservationDto {

    @IsArray()
    @ArrayMinSize(1)
    @IsInt({ each: true })
    @Type(() => Number)
    seatsId: number[];

    @IsUUID()
    showtimeId: string;

    @IsUUID()
    userId: string;

    @IsNumber()
    @IsPositive()
    @IsOptional()
    price?: number;
}