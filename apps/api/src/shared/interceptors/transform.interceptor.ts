import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { IGNORE_TRANSFORM_KEY } from "../decorators/ignore-transform.decorator.js";
import { ApiResponse } from "../response/api-response.js";
import { ApiResponseBuilder } from "../response/api-response.builder.js";
import { PaginationMetadata } from "../response/pagination-metadata.js";

interface RequestWithTraceId extends Request {
  traceId?: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  constructor(private readonly reflector: Reflector) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const http = context.switchToHttp();
    const request = http.getRequest<RequestWithTraceId>();
    const response = http.getResponse();

    const ignoreTransform = this.reflector.get<boolean>(
      IGNORE_TRANSFORM_KEY,
      context.getHandler(),
    );

    if (ignoreTransform) {
      return next.handle();
    }

    const traceId = request.traceId ?? "unknown-trace-id";

    return next.handle().pipe(
      map((data: any) => {
        if (data instanceof ApiResponse) {
          return data;
        }

        const statusCode = response.statusCode ?? 200;
        const customCode = `LP_API_${statusCode}`;

        const builder = ApiResponseBuilder.create<any>()
          .code(customCode)
          .message("Operation Successful")
          .traceId(traceId);

        if (
          data &&
          typeof data === "object" &&
          Array.isArray(data.items) &&
          typeof data.page === "number"
        ) {
          builder
            .data(data.items)
            .metadata(
              new PaginationMetadata(
                data.page,
                data.size ?? data.items.length ?? 0,
                data.elements ?? data.items.length ?? 0,
              ),
            );
        } else {
          builder.data(data ?? null);
        }

        return builder.build();
      }),
    );
  }
}