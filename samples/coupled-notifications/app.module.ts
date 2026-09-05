import { Module } from '@nestjs/common';
import { NotificationsModule } from './notifications/notifications.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';

@Module({
  imports: [NotificationsModule, SubscriptionsModule],
})
export class AppModule {}
