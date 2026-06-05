import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { Prisma } from "@linkpulse/db";
import { ApiResponseBuilder } from "../response/api-response.builder.js";
import { PaginationMetadata } from "../response/pagination-metadata.js";

interface RequestWithTraceId extends Request {
    traceId?: string;
}

interface ResolvedError {
    status: number;
    message: string;
    code: string;
    data?: unknown;
}

const isProduction = process.env.NODE_ENV === "production";

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

        this.logger.error(
            `[${traceId}] Exception occurred on ${method} ${url}`,
            exception instanceof Error ? exception.stack : exception
        );

        const resolved = this.resolveError(exception);

        const body = ApiResponseBuilder.create<unknown>()
            .code(resolved.code)
            .message(resolved.message)
            .traceId(traceId)
            .data(resolved.data ?? null)
            .metadata(new PaginationMetadata())
            .build();

        response.status(resolved.status).json(body);
    }

    private resolveError(exception: unknown): ResolvedError {
        if (exception instanceof HttpException) {
            return this.fromHttpException(exception);
        }

        if (exception instanceof Prisma.PrismaClientKnownRequestError) {
            return this.fromPrismaKnownError(exception);
        }

        if (exception instanceof Prisma.PrismaClientValidationError) {
            return {
                status: HttpStatus.BAD_REQUEST,
                code: "LP_DB_VALIDATION",
                message:
                    "The data sent does not match what the database expects. Please check the fields and try again.",
            };
        }

        // Unknown / unexpected error: still surface something descriptive.
        const rawMessage =
            exception instanceof Error ? exception.message : String(exception);

        return {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            code: "LP_API_500",
            // In production we avoid leaking internals, but never the bare
            // "Internal Server Error" with no context for developers.
            message: isProduction
                ? "Something went wrong on our side. Please try again."
                : rawMessage || "Unexpected internal error",
        };
    }

    private fromHttpException(exception: HttpException): ResolvedError {
        const status = exception.getStatus();
        const exceptionResponse = exception.getResponse();

        let message = exception.message;
        let code = `LP_API_${status}`;
        let data: unknown = null;

        if (typeof exceptionResponse === "string") {
            message = exceptionResponse;
        } else if (
            typeof exceptionResponse === "object" &&
            exceptionResponse !== null
        ) {
            const errorBody = exceptionResponse as Record<string, any>;

            if (errorBody.message) {
                message = Array.isArray(errorBody.message)
                    ? errorBody.message.join(", ")
                    : String(errorBody.message);
            }

            if (errorBody.code) {
                code = String(errorBody.code);
            }

            data = errorBody.data ?? null;
        }

        return { status, message, code, data };
    }

    private fromPrismaKnownError(
        exception: Prisma.PrismaClientKnownRequestError
    ): ResolvedError {
        const target = this.formatPrismaTarget(exception.meta?.target);
        const code = `LP_DB_${exception.code}`;

        switch (exception.code) {
            case "P2002":
                return {
                    status: HttpStatus.CONFLICT,
                    code,
                    message: target
                        ? `A record with this ${target} already exists.`
                        : "A record with these details already exists.",
                };
            case "P2025":
                return {
                    status: HttpStatus.NOT_FOUND,
                    code,
                    message:
                        (exception.meta?.cause as string) ??
                        "The requested record was not found.",
                };
            case "P2003":
                return {
                    status: HttpStatus.CONFLICT,
                    code,
                    message:
                        "This action references a related record that does not exist or is still in use.",
                };
            case "P2021":
            case "P2022":
                // Table or column missing — schema is out of sync with the DB.
                return {
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    code,
                    message: isProduction
                        ? "A database configuration issue is preventing this action. Please contact support."
                        : `Database schema is out of sync: ${exception.message
                              .replace(/\s+/g, " ")
                              .trim()}. Run the pending Prisma migrations / regenerate the client.`,
                };
            default:
                return {
                    status: HttpStatus.BAD_REQUEST,
                    code,
                    message: isProduction
                        ? "The database rejected this request. Please review the data and try again."
                        : `Database error (${exception.code}): ${exception.message
                              .replace(/\s+/g, " ")
                              .trim()}`,
                };
        }
    }

    private formatPrismaTarget(target: unknown): string | null {
        if (Array.isArray(target)) return target.join(", ");
        if (typeof target === "string") return target;
        return null;
    }
}
