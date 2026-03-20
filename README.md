# LinkPulse

LinkPulse es un SaaS para acortar URLs, administrar enlaces y rastrear clics con analytics.

## Stack oficial
- Frontend: Next.js
- Backend API: NestJS
- Redirector: NestJS + Fastify
- Auth: Supabase Auth
- Database: Supabase PostgreSQL
- Cache / Rate limiting: Upstash Redis
- ORM: Prisma

## Objetivo del MVP
- Crear short links
- Administrar enlaces por workspace
- Redirigir con baja latencia
- Registrar clics y metadatos básicos
- Mostrar analytics por enlace y por workspace

## Convención global de respuesta API
Toda respuesta del API debe respetar el wrapper estándar:

```ts
export class ApiResponse<TData = unknown> {
  code!: string;
  message!: string;
  traceId!: string;
  data!: TData;
  metadata!: PaginationMetadata;
}
```

Los éxitos se envuelven con un interceptor global.
Los errores se envuelven con un exception filter global.
`traceId` se genera o propaga desde middleware.

## Estructura de documentación
- `AI_CONTEXT.md`: contexto breve para asistentes/IA en editor
- `PROJECT_RULES.md`: reglas obligatorias del proyecto
- `docs/product/product-requirement-document.md`
- `docs/design/design-doc.md`
- `docs/technical/tech-doc.md`
- `docs/product/backlog.md`
- `docs/implementation/tasks-checklist.md`
- `docs/context/ai-project-context.md`

## Siguiente paso recomendado
Continuar con Sprint 1:
- auth real con Supabase JWT
- bootstrap de profile/workspace
- endpoints `GET /profiles/me`, `POST /workspaces`, `POST /links`
- wrapper global de respuestas activo en toda la API
