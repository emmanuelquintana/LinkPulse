# LinkPulse - Project Rules

## 1. Arquitectura
1. El proyecto usa:
   - Next.js
   - NestJS
   - NestJS + Fastify para redirector
   - Supabase Auth
   - Supabase PostgreSQL
   - Upstash Redis
   - Prisma
2. El redirector debe estar separado del backend administrativo.
3. Redis se consulta antes de Postgres para resolver short links.
4. El tracking del clic ocurre después de resolver el redirect y preferentemente de forma asíncrona.

## 2. Respuesta estándar del API
Toda respuesta del API debe seguir este shape:

```ts
export class ApiResponse<TData = unknown> {
  code!: string;
  message!: string;
  traceId!: string;
  data!: TData;
  metadata!: PaginationMetadata;
}
```

### Reglas
- No devolver respuestas crudas al cliente final.
- No devolver errores fuera de este wrapper.
- `traceId` siempre debe existir en respuesta y logs.
- El interceptor global envuelve éxitos.
- El exception filter global envuelve errores.

## 3. Seguridad
- La autenticación oficial se valida con JWT de Supabase.
- No crear un sistema paralelo de auth.
- Rate limiting básico debe existir en endpoints sensibles y redirector.
- Validar URLs al crear links.
- Proteger contra open redirects, abuso y dominios maliciosos.

## 4. Datos
- `profiles.id` debe estar ligado a `auth.users.id`.
- Prisma gestiona solo tablas del dominio del proyecto.
- No duplicar tablas de auth de Supabase.
- Minimizar datos sensibles; IP debe almacenarse protegida o hasheada cuando aplique.

## 5. Estilo de desarrollo
- Estructura modular por dominio.
- DTOs para entradas y salidas.
- Swagger obligatorio en endpoints públicos de la API.
- Validaciones con `ValidationPipe`.
- Código listo para CI/CD.
- Tests en módulos críticos.

## 6. Carpetas sugeridas
```txt
src/
  common/
    guards/
  shared/
    decorators/
    filters/
    interceptors/
    middleware/
    response/
  health/
  profiles/
  workspaces/
  links/
```

## 7. Regla de documentación
Antes de cambios grandes:
- revisar PRD
- revisar Tech Doc
- revisar backlog
- actualizar tasks-checklist cuando una tarea quede terminada
