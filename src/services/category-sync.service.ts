import {bind, BindingScope} from '@loopback/core';
import {repository} from '@loopback/repository';
import {rabbitmqSubscribe} from '../decorators/rabbitmq-subscribe.decorator';
import {CategoryRepository} from '../repositories';

@bind({scope: BindingScope.TRANSIENT})
export class CategorySyncService {
  constructor(
    @repository(CategoryRepository) private categoryRepo: CategoryRepository,
  ) { }

  @rabbitmqSubscribe({
    exchange: 'amq.topic',
    queue: 'micro-catalog/sync-videos/category',
    routingKey: 'model.category.*'
  })

  async handler({message, data}: any) {
    const action = message.fields.routingKey.split('.')[2]

    switch (action) {
      case 'created':
        await this.categoryRepo.create(data)
        break;
      case 'updated':
        await this.categoryRepo.updateById(data, data.id)
        break;
      case 'deleted':
        await this.categoryRepo.deleteById(data.id)
        break;
    }
  }
}
