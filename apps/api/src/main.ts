import { ValidationPipe, VersioningType } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory, Reflector } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module.js";
import { TransformInterceptor } from "./shared/interceptors/transform.interceptor.js";
import { AllExceptionsFilter } from "./shared/filters/all-exceptions.filter.js";

async function bootstrap() {
  console.log("[DEBUG] DATABASE_URL at bootstrap:", process.env.DATABASE_URL);
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.setGlobalPrefix("api");
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalInterceptors(new TransformInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new AllExceptionsFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle("LinkPulse API")
    .setDescription("API para acortador de links con tracking y analytics")
    .setVersion("1.0.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "Authorization",
        in: "header",
      },
      "bearer",
    )
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, swaggerDocument);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('API_PORT') || 3001;
  await app.listen(port);

  console.log(`🚀 API running on http://localhost:${port}/api`);
  console.log(`📘 Swagger running on http://localhost:${port}/docs`);
}

bootstrap();