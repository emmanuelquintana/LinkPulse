import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  const port = Number(process.env.REDIRECTOR_PORT ?? 3002);
  await app.listen(port, '0.0.0.0');
  console.log(`Redirector listening on http://localhost:${port}`);
}

bootstrap();
