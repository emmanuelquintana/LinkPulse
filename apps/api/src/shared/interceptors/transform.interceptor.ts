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

interface PaginatedShape {
  items: unknown[];
  page: number;
  size?: unknown;
  elements?: unknown;
}

/** Detecta la forma `{ items, page, ... }` que devuelven los endpoints paginados. */
function isPaginatedShape(data: unknown): data is PaginatedShape {
  return (
    typeof data === "object" &&
    data !== null &&
    Array.isArray((data as PaginatedShape).items) &&
    typeof (data as PaginatedShape).page === "number"
  );
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
      map((data: unknown) => {
        if (data instanceof ApiResponse) {
          return data;
        }

        const statusCode = response.statusCode ?? 200;
        const customCode = `LP_API_${statusCode}`;

        const builder = ApiResponseBuilder.create<unknown>()
          .code(customCode)
          .message("Operation Successful")
          .traceId(traceId);

        if (isPaginatedShape(data)) {
          const items = data.items;
          builder
            .data(items)
            .metadata(
              new PaginationMetadata(
                data.page,
                (data.size as number | undefined) ?? items.length,
                (data.elements as number | undefined) ?? items.length,
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