import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception.code === 'P2002') {
      status = HttpStatus.CONFLICT;
      message = `Conflict: ${exception.meta?.target} already exists`;
    }

    if (exception.code === 'P2025') {
      status = HttpStatus.NOT_FOUND;
      message = 'Record not found';
    }

    if (exception.code === 'P2003') {
      status = HttpStatus.BAD_REQUEST;
      message = 'Invalid relation or foreign key constraint';
    }

    if (exception.code === 'P2014') {
      status = HttpStatus.BAD_REQUEST;
      message = 'Invalid ID or relation reference';
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: exception.code,
    });
  }
}
