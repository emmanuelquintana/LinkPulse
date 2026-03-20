import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { ApiResponseBuilder } from "../response/api-response.builder.js";
import { PaginationMetadata } from "../response/pagination-metadata.js";
import { maskData } from "../../common/utils/obfuscation.js";

interface RequestWithTraceId extends Request {
    traceId?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const request = ctx.getRequest<RequestWithTraceId>();
        const response = ctx.getResponse<Response>();

        const traceId = request.traceId ?? "unknown-trace-id";
        const url = request.url;
        const method = request.method;

        // Mask potential sensitive data in URL (query params) if any
        this.logger.error(
            `[${traceId}] Exception occurred on ${method} ${url}`,
            exception instanceof Error ? exception.stack : exception
        );

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = "Internal Server Error";
        let code = "LP_API_500";
        let data: unknown = null;

        if (exception instanceof HttpException) {
            status = exception.getStatus();

            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === "string") {
                message = exceptionResponse;
            } else if (typeof exceptionResponse === "object" && exceptionResponse !== null) {
                const errorBody = exceptionResponse as Record<string, any>;

                if (errorBody.message) {
                    message = Array.isArray(errorBody.message)
                        ? errorBody.message.join(", ")
                        : String(errorBody.message);
                }

                if (errorBody.code) {
                    code = String(errorBody.code);
                } else {
                    code = `LP_API_${status}`;
                }

                data = errorBody.data ?? null;
            } else {
                code = `LP_API_${status}`;
            }
        }

        const body = ApiResponseBuilder.create<unknown>()
            .code(code)
            .message(message)
            .traceId(traceId)
            .data(data)
            .metadata(new PaginationMetadata())
            .build();

        response.status(status).json(body);
    }
}