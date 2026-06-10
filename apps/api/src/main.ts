import { ValidationPipe, VersioningType } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory, Reflector } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module.js";
import { TransformInterceptor } from "./shared/interceptors/transform.interceptor.js";
import { AllExceptionsFilter } from "./shared/filters/all-exceptions.filter.js";

async function bootstrap() {
  console.log("[DEBUG] DATABASE_URL at bootstrap:", process.env.DATABASE_URL);
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  // Sube el límite del body para aceptar payloads grandes (p.ej. avatar en
  // base64, HTML de campañas). Se mantiene la captura de rawBody para el
  // webhook de Stripe.
  app.useBodyParser("json", { limit: "5mb" });
  app.useBodyParser("urlencoded", { extended: true, limit: "5mb" });

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
    .addApiKey(
      { type: "apiKey", name: "x-api-key", in: "header" },
      "api-key",
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