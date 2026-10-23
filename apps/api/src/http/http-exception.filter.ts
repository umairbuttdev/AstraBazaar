import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const payload =
      exception instanceof HttpException ? exception.getResponse() : null;
    const exceptionMessage =
      exception instanceof Error ? exception.message : 'Unknown server error';
    const exceptionStack =
      exception instanceof Error ? exception.stack : undefined;

    const clientMessage =
      status >= 500
        ? 'Something went wrong'
        : typeof payload === 'string'
          ? payload
          : payload &&
              typeof payload === 'object' &&
              'message' in payload &&
              (typeof payload.message === 'string' ||
                Array.isArray(payload.message))
            ? payload.message
            : 'Request could not be completed';

    const errorLabel =
      payload &&
      typeof payload === 'object' &&
      'error' in payload &&
      typeof payload.error === 'string'
        ? payload.error
        : status >= 500
          ? 'Internal Server Error'
          : 'Error';

    // Always log the original failure (especially 500s that the UI hides).
    console.error('[http-error]', {
      method: request.method,
      path: request.originalUrl ?? request.url,
      status,
      clientMessage,
      originalMessage: exceptionMessage,
      stack: exceptionStack,
      bodyKeys:
        request.body && typeof request.body === 'object'
          ? Object.keys(request.body as object)
          : [],
      variantCount: Array.isArray(
        (request.body as { variants?: unknown } | undefined)?.variants,
      )
        ? (request.body as { variants: unknown[] }).variants.length
        : undefined,
    });

    const body: Record<string, unknown> = {
      statusCode: status,
      message: clientMessage,
      error: errorLabel,
    };

    // In local/dev, surface the real cause so admin redirects show it.
    if (status >= 500 && process.env.NODE_ENV !== 'production') {
      body.detail = exceptionMessage;
    }

    response.status(status).json(body);
  }
}
