import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<any> {
    return next.handle().pipe(
      map((response) => {
        if (typeof response === 'object' && response !== null) {
          return {
            data: response.hasOwnProperty('data') ? response['data'] : response,
            message: response.hasOwnProperty('message') ? response['message'] : 'Request successful',
            status: response.hasOwnProperty('status') ? response['status'] : HttpStatus.OK,
            error: null,
          };
        }
        return {
          data: response,
          message: 'Request successful',
          status: HttpStatus.OK,
          error: null,
        };
      }),
      catchError((error) => {
        const status = error instanceof HttpException ? error.getStatus() : 500;
        return throwError(() => ({
          data: null,
          message: error.message || 'An unexpected error occurred',
          status,
          error: error.response || error.stack,
        }));
      }),
    );
  }
}
