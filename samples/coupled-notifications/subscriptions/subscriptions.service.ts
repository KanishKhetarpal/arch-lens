import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { SubscribeDto } from './dto/subscription.dto';

interface Subscription {
  userId: string;
  topic: string;
}

@Injectable()
export class SubscriptionsService {
  private readonly subscriptions: Subscription[] = [];

  constructor(
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  subscribe(dto: SubscribeDto): void {
    this.subscriptions.push(dto);
    this.notificationsService.sendWelcome(dto.userId);
  }

  isSubscribed(userId: string, topic: string): boolean {
    return this.subscriptions.some((sub) => sub.userId === userId && sub.topic === topic);
  }
}
