import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentNotificationDto } from './dto/payment-notification.dto';
import { ApiOperation, ApiOkResponse, ApiTags } from '@nestjs/swagger';

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
}
