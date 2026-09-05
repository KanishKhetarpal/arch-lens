import { Body, Controller, Post } from '@nestjs/common';
import { SubscribeDto } from './dto/subscription.dto';
import { SubscriptionsService } from './subscriptions.service';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  subscribe(@Body() dto: SubscribeDto) {
    this.subscriptionsService.subscribe(dto);
  }
}
