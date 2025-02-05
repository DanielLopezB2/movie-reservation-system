import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsInt, IsOptional, IsString, Min, MinLength } from "class-validator";

export class CreateMovieDto {

    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    id?: number

    @IsString()
    @MinLength(1)
    title: string;

    @IsString()
    overview: string;

    @IsString()
    posterImage: string;

    @IsInt()
    @Type(() => Number)
    duration: number;

    @IsArray()
    @ArrayMinSize(1)
    @IsInt({ each: true })
    genreIds: number[];

}
