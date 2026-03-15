import type { Context } from "hono";
import { ZodError } from "zod";

export class AppError extends Error {
    constructor(
        public status: number,
        public code: string,
        message: string,
    ) {
        super(message);
    }
}

export function onError(err: Error, c: Context) {
    if (err instanceof ZodError) {
        return c.json(
            {
                error: "validation_error",
                message: "Request validation failed",
                issues: err.issues,
            },
            400,
        );
    }

    if (err instanceof AppError) {
        return c.json(
            { error: err.code, message: err.message },
            err.status as 400,
        );
    }

    console.error(err);
    return c.json(
        { error: "internal_error", message: "Internal server error" },
        500,
    );
}
