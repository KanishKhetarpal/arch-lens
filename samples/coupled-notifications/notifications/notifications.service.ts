import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { SendNotificationDto } from './dto/send-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(forwardRef(() => SubscriptionsService))
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  send(dto: SendNotificationDto): boolean {
    if (!this.subscriptionsService.isSubscribed(dto.userId, 'notifications')) {
      return false;
    }

    console.log(`Notifying ${dto.userId}: ${dto.message}`);
    return true;
  }

  sendWelcome(userId: string): void {
    this.send({ userId, message: 'Welcome!' });
  }
}
