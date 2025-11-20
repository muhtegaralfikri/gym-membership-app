import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentNotificationDto } from './dto/payment-notification.dto';
import { ApiOperation, ApiOkResponse, ApiTags, ApiBearerAuth, ApiForbiddenResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { Request } from 'express';
import { UserResponseDto } from 'src/users/dto/user-response.dto';

@ApiTags('Payments Webhook')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Endpoint untuk menerima notifikasi/webhook dari Payment Gateway (Publik)
   * POST /payments/notification
   */
  @Post('notification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle payment gateway notification (Webhook)' })
  @ApiOkResponse({ description: 'Notification received and processed.' })
  handleNotification(@Body() notificationDto: PaymentNotificationDto) {
    // "Fire-and-forget"
    // <-- FIX 2 & 3: Perbaikan formatting/indentasi
    this.paymentsService
      .handlePaymentNotification(notificationDto)
      .catch((err) => {
        // <-- FIX 4 & 5: Type guard untuk error
        if (err instanceof Error) {
          console.error('Webhook processing failed:', err.message);
        } else {
          console.error('Webhook processing failed with unknown error:', err);
        }
      });

    return { message: 'Notification received.' };
  }

  @Post('sync/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sync transaction status from Midtrans (Member)' })
  @ApiOkResponse({ description: 'Status synced.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  syncStatus(
    @Param('orderId') orderId: string,
    @Req() req: Request & { user: UserResponseDto },
  ) {
    return this.paymentsService.syncTransactionStatus(orderId, req.user.id);
  }

  @Post('admin/transactions/:id/refund')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin refund/void a transaction & rollback membership' })
  @ApiOkResponse({ description: 'Transaction refunded/voided.' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  refundTransaction(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.refundTransaction(id);
  }
}
