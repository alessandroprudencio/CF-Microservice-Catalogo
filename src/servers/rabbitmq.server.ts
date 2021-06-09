import {Context} from '@loopback/context';
import {Server} from '@loopback/core';
import {Channel, connect, Connection, ConsumeMessage} from 'amqplib';
import {Replies} from 'amqplib/properties';

/*
Disparar uma mensagem a cada evento de cada model do Laravel:criar, editar,excluir e relacionamentos
Vários microsserviços poderão  ser notificados dos eventos que ocorreram
Alguns microsserviços poderão querer ser notificados somente de alguns eventos "somente quando tem novos uploads"
 */

export class RabbitmqServer extends Context implements Server {
  private _listening: boolean;

  conn: Connection;

  async start(): Promise<void> {
    try {
      this.conn = await connect({
        hostname: 'rabbitmq',
        username: 'admin',
        password: 'admin',
      });
      this._listening = true;
      await this.boot();
    } catch (error) {
      this._listening = false;
    }
  }

  async boot() {
    const channel: Channel = await this.conn.createChannel();

    const queue: Replies.AssertQueue = await channel.assertQueue('first-queue');

    const exchange: Replies.AssertExchange = await channel.assertExchange(
      'amq.direct',
      'direct',
    );

    await channel.bindQueue(queue.queue, exchange.exchange, 'my-routing-key');

    // const result = channel.sendToQueue(
    //   'first-queue',
    //   Buffer.from(JSON.stringify({message: 'insert new category'})),
    // );

    channel.publish(
      'amq.direct',
      'my-routing-key',
      Buffer.from(JSON.stringify({message: 'insert new category'})),
    );

    await channel.consume(queue.queue, (msg: ConsumeMessage | null) => {
      console.log(msg?.content.toString());
    });
  }

  async stop(): Promise<void> {
    await this.conn.close();
    this._listening = false;
  }

  get listening(): boolean {
    return this._listening;
  }
}
