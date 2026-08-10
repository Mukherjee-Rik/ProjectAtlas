import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<any> {
    return next.handle().pipe(
      map((res: any) => {
        if (
          res &&
          typeof res === 'object' &&
          'data' in res &&
          'meta' in res
        ) {
          return {
            success: true,
            data: res.data,
            meta: res.meta,
          };
        }

        return {
          success: true,
          data: res,
        };
      }),
    );
  }
}
