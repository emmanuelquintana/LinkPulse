# LinkPulse - AI Context

## Resumen del proyecto
LinkPulse es un SaaS para acortar URLs, administrarlas y medir clics con analytics básicos y avanzados.

## Stack oficial
- Frontend: Next.js
- Backend API: NestJS
- Redirector: NestJS + Fastify
- Auth: Supabase Auth
- Database: Supabase PostgreSQL
- Cache / Rate limiting: Upstash Redis
- ORM: Prisma

## Arquitectura elegida
- Supabase Auth es la fuente oficial de identidad.
- Supabase PostgreSQL almacena las tablas transaccionales y analíticas iniciales.
- Upstash Redis se usa para cache de resolución `shortCode -> originalUrl` y rate limiting.
- NestJS expone el API administrativo y la lógica de negocio.
- Un redirector independiente resuelve el short link y redirige rápidamente.
- Prisma gestiona las tablas del dominio de negocio.

## Regla obligatoria de respuestas API
La API debe responder siempre con el wrapper estándar:

```ts
export class ApiResponse<TData = unknown> {
  code!: string;
  message!: string;
  traceId!: string;
  data!: TData;
  metadata!: PaginationMetadata;
}
```

### Detalles obligatorios
- Los controllers retornan data cruda.
- Un interceptor global envuelve éxitos.
- Un exception filter global envuelve errores.
- Un middleware asegura `traceId`.
- Los endpoints paginados deben regresar `items`, `page`, `size`, `elements` para que el interceptor lo traduzca a `data + metadata`.

## Módulos actuales esperados
- health
- profiles
- workspaces
- links
- shared
- common

## Convenciones
- Usar TypeScript
- Usar imports con `.js` cuando aplique al runtime ESM
- Documentar endpoints con Swagger
- DTOs para request/response
- Guard global o guards por endpoint para auth con Supabase JWT
- No regresar wrappers manuales en controllers salvo casos especiales
- Mantener estructura modular por dominio
