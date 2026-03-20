import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

export interface RequestWithTraceId extends Request {
    traceId?: string;
}

@Injectable()
export class TraceIdMiddleware implements NestMiddleware {
    use(req: RequestWithTraceId, res: Response, next: NextFunction): void {
        const incomingTraceId = req.headers["x-trace-id"];
        const traceId =
            typeof incomingTraceId === "string" && incomingTraceId.trim().length > 0
                ? incomingTraceId
                : uuidv4().replace(/-/g, "").slice(0, 16);

        req.traceId = traceId;
        res.setHeader("x-trace-id", traceId);

        next();
    }
}