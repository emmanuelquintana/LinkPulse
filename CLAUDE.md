# Prompt para Claude: Implementación de Seguimiento de Emails en LinkPulse

Copia y pega el siguiente prompt en tu chat con Claude. Este prompt está diseñado a partir del contexto real del repositorio de LinkPulse y contiene instrucciones exactas de código, stack de tecnologías y convenciones del proyecto.

***

```markdown
Hola Claude. Necesito que implementes un sistema completo de Email Marketing y Seguimiento Avanzado de Correos (estilo Mailchimp) en nuestro monorepo LinkPulse. 

A continuación tienes toda la información de nuestro stack, convenciones de código y el plan de implementación paso a paso.

---

### Contexto del Proyecto y Stack Tecnológico
LinkPulse es un SaaS de acortamiento de enlaces y analíticas estructurado como un monorepo usando **pnpm workspaces** y **Turborepo**:
1. **Database ORM**: Prisma en PostgreSQL (Supabase).
2. **Backend API**: NestJS (en `apps/api`) que sirve la lógica administrativa.
3. **Redirector**: NestJS + Fastify (en `apps/redirector`) que procesa redirecciones a alta velocidad de forma pública.
4. **Frontend**: Next.js 14+ (en `apps/web`) utilizando Tailwind CSS v4 y Lucide React.
5. **Autenticación**: Supabase Auth (JWT guardado en cookies/headers y verificado en la API).

### Convenciones Obligatorias en NestJS:
- **Imports ESM**: Todos los imports locales en NestJS deben terminar con la extensión `.js`. Por ejemplo: 
  `import { PrismaService } from '../prisma/prisma.service.js';`
- **Respuestas Estándar de la API**: Todos los endpoints del backend API deben retornar datos crudos; un interceptor global envuelve el éxito usando la clase `ApiResponse`:
  ```ts
  export class ApiResponse<TData = unknown> {
    code!: string;
    message!: string;
    traceId!: string;
    data!: TData;
    metadata!: PaginationMetadata;
  }
  ```
  Los endpoints paginados deben retornar un objeto con `{ items: T[], page: number, size: number, elements: number }` para que el interceptor traduzca automáticamente la paginación a `data` y `metadata`.

---

## Tareas a Realizar:

### Paso 1: Actualizar el Esquema de Prisma
Modifica el archivo `prisma/schema.prisma` agregando los siguientes modelos de base de datos para habilitar audiencias, campañas, logs de envío e interacciones:

```prisma
model EmailSubscriber {
  id          String            @id @default(uuid()) @db.Uuid
  workspaceId String            @db.Uuid
  email       String
  firstName   String?           @map("first_name")
  lastName    String?           @map("last_name")
  status      String            @default("SUBSCRIBED") // SUBSCRIBED, UNSUBSCRIBED, CLEANED
  metadata    Json?             @default("{}")
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  workspace   Workspace         @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  logs        EmailLog[]
  tags        SubscriberTag[]

  @@unique([workspaceId, email])
  @@index([workspaceId])
  @@map("email_subscribers")
}

model SubscriberTag {
  id           String          @id @default(uuid()) @db.Uuid
  name         String
  subscriberId String          @db.Uuid
  subscriber   EmailSubscriber @relation(fields: [subscriberId], references: [id], onDelete: Cascade)

  @@unique([subscriberId, name])
  @@map("subscriber_tags")
}

model EmailCampaign {
  id          String            @id @default(uuid()) @db.Uuid
  workspaceId String            @db.Uuid
  subject     String
  previewText String?           @map("preview_text")
  senderEmail String            @map("sender_email")
  senderName  String            @map("sender_name")
  htmlContent String            @map("html_content") @db.Text
  status      String            @default("DRAFT") // DRAFT, SENDING, SENT
  sentAt      DateTime?         @map("sent_at")
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  workspace   Workspace         @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  logs        EmailLog[]

  @@index([workspaceId])
  @@map("email_campaigns")
}

model EmailLog {
  id           String          @id @default(uuid()) @db.Uuid
  campaignId   String          @db.Uuid
  subscriberId String          @db.Uuid
  status       String          @default("PENDING") // PENDING, DELIVERED, BOUNCED, SPAM, OPENED, CLICKED
  bounceReason String?         @map("bounce_reason") @db.Text
  sentAt       DateTime?       @map("sent_at")
  openedAt     DateTime?       @map("opened_at")
  clickedAt    DateTime?       @map("clicked_at")
  campaign     EmailCampaign   @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  subscriber   EmailSubscriber @relation(fields: [subscriberId], references: [id], onDelete: Cascade)
  opens        EmailOpen[]
  clicks       EmailClick[]

  @@index([campaignId])
  @@index([subscriberId])
  @@map("email_logs")
}

model EmailOpen {
  id         String     @id @default(uuid()) @db.Uuid
  emailLogId String     @db.Uuid
  openedAt   DateTime   @default(now())
  ipHash     String?    @db.VarChar(255)
  userAgent  String?    @db.Text
  country    String?    @db.VarChar(80)
  city       String?    @db.VarChar(120)
  deviceType DeviceType @default(UNKNOWN)
  browser    String?    @db.VarChar(120)
  os         String?    @db.VarChar(120)
  emailLog   EmailLog   @relation(fields: [emailLogId], references: [id], onDelete: Cascade)

  @@index([emailLogId])
  @@map("email_opens")
}

model EmailClick {
  id         String     @id @default(uuid()) @db.Uuid
  emailLogId String     @db.Uuid
  url        String     @db.Text
  clickedAt  DateTime   @default(now())
  ipHash     String?    @db.VarChar(255)
  userAgent  String?    @db.Text
  country    String?    @db.VarChar(80)
  city       String?    @db.VarChar(120)
  deviceType DeviceType @default(UNKNOWN)
  browser    String?    @db.VarChar(120)
  os         String?    @db.VarChar(120)
  emailLog   EmailLog   @relation(fields: [emailLogId], references: [id], onDelete: Cascade)

  @@index([emailLogId])
  @@map("email_clicks")
}
```

*Nota: Añade también las relaciones opuestas en el modelo `Workspace` en `schema.prisma`:*
```prisma
emailSubscribers EmailSubscriber[]
emailCampaigns   EmailCampaign[]
```

---

### Paso 2: Implementar el Módulo de Email Marketing en el Backend API (`apps/api`)
Crea un nuevo módulo (`EmailMarketingModule`) con controladores y servicios estructurados de la siguiente manera:

1. **`SubscribersController`**:
   - CRUD completo de suscriptores para un workspace.
   - Ruta `POST /subscribers/bulk` para importar contactos parseando un archivo CSV (soporta `firstName`, `lastName`, `email`, `tags`).

2. **`EmailCampaignsController`**:
   - CRUD de campañas (Guardar borrador, listar, obtener detalles).
   - Ruta `POST /email-campaigns/:id/send` para enviar la campaña:
     - Debe seleccionar los suscriptores activos (`SUBSCRIBED`).
     - Para cada destinatario, crear un registro `EmailLog` con ID único.
     - **Reemplazar Enlaces**: Analizar el `htmlContent` y reemplazar las URLs de las etiquetas `<a href="...">` por una URL que pase por nuestro redirector:
       `https://nuestro-redirector.com/t/c/:emailLogId?u=BASE64_SAFE_URL`
     - **Insertar Pixel de Apertura**: Inyectar al final del cuerpo HTML:
       `<img src="https://nuestro-redirector.com/t/o/:emailLogId" width="1" height="1" style="display:none" />`
     - **Desuscripción**: Inyectar en el pie de página el enlace de opt-out:
       `https://nuestro-redirector.com/t/u/:emailLogId`
     - Integrar un servicio de envío de correos. Para testing o desarrollo, usa un servicio configurable que simule los envíos escribiendo a consola, o configure un cliente con variables de entorno para **Resend** (usando `@resend/node` o fetch directo a su API).

3. **`EmailWebhooksController`**:
   - Endpoint público (sin auth Supabase) para recibir notificaciones del proveedor de correo (ej. `/api/email-marketing/webhooks/resend`).
   - Debe escuchar eventos como `delivered` (marca `EmailLog` como `DELIVERED`), `bounced` (marca `EmailLog` como `BOUNCED` y desactiva el suscriptor), y `complaint` (marca suscriptor como `UNSUBSCRIBED`).

4. **`EmailAnalyticsController`**:
   - Ruta `GET /email-campaigns/:id/stats` para computar estadísticas avanzadas:
     - Tasa de Apertura (Open Rate) = (Aperturas Únicas / Entregados) * 100
     - CTR (Click-Through Rate) = (Clics Únicos / Entregados) * 100
     - Bounce Rate, Unsubscribe Rate.
     - Gráficos de dispositivos (Mobile vs Desktop vs Tablet) usando el enum `DeviceType` registrado en la apertura/clics.
     - Historial temporal de aperturas y clics.
     - Enlaces más clickeados.

---

### Paso 3: Añadir Endpoints Públicos de Rastreo en el Redirector (`apps/redirector`)
El redirector (`apps/redirector/src`) maneja tráfico a alta velocidad sin auth. Añade las siguientes rutas asíncronas utilizando `PrismaService` y `UpstashRedisService` si aplica:

1. **Pixel de Apertura (`GET /t/o/:emailLogId`)**:
   - Busca/valida la existencia de `emailLogId`.
   - Crea asíncronamente un registro `EmailOpen` extrayendo el `User-Agent` (usa `ua-parser-js` al igual que en `redirect.service.ts` para extraer navegador, OS y tipo de dispositivo) y hasheando la IP.
   - Actualiza el estado de `EmailLog` a `OPENED` y setea `openedAt`.
   - Retorna inmediatamente una imagen GIF transparente de 1x1 bytes:
     ```ts
     const gifBuffer = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
     reply
       .type('image/gif')
       .header('Cache-Control', 'no-store, no-cache, must-revalidate, private')
       .send(gifBuffer);
     ```

2. **Redirección de Clics (`GET /t/c/:emailLogId`)**:
   - Lee el parámetro query `u` (URL destino codificada en Base64 seguro).
   - Registra de forma asíncrona el `EmailClick` con navegador, OS, dispositivo e IP hasheada.
   - Actualiza el estado de `EmailLog` a `CLICKED` y setea `clickedAt`.
   - Redirecciona (302) al usuario a la URL de destino decodificada.

3. **Enlace de Desuscripción (`GET /t/u/:emailLogId`)**:
   - Identifica el `EmailLog` y al suscriptor asociado.
   - Actualiza el estado del `EmailSubscriber` a `UNSUBSCRIBED`.
   - Redirecciona (302) a una página informativa en el frontend: `/unsubscribe-success`.

---

### Paso 4: Construir la Interfaz de Usuario en Next.js (`apps/web`)
Añade las vistas necesarias utilizando Tailwind CSS v4 y los iconos de Lucide:

1. **Audiencia (`apps/web/src/app/(dashboard)/subscribers/page.tsx`)**:
   - Vista de tabla con paginación que cargue los suscriptores.
   - Formulario para crear un suscriptor individual.
   - Dropzone o input de archivo para subir un CSV y enviarlo a `/api/subscribers/bulk`.
   - Visualización de tags aplicadas a los suscriptores.

2. **Campañas (`apps/web/src/app/(dashboard)/emails/page.tsx`)**:
   - Listado de campañas creadas.
   - Formulario de creación de campaña: Asunto, remitente, cuerpo HTML/Markdown, y selección de destinatarios (segmentable por tags).

3. **Estadísticas de Campaña (`apps/web/src/app/(dashboard)/emails/[id]/stats/page.tsx`)**:
   - Tarjetas métricas premium: Open Rate, Click Rate, Bounces, Unsubscribes.
   - Gráfico de dona/torta para mostrar dispositivos y sistemas operativos.
   - Feed de actividad reciente de la campaña.
   - Lista ordenada de enlaces más pulsados.

---

Por favor, comienza implementando las actualizaciones del esquema de base de datos y la creación de los módulos NestJS en la API. Trabaja de forma iterativa y ordenada. Si tienes alguna duda sobre el flujo, házmelo saber. ¡Comencemos!
```
***

¡Listo! Sigue este plan paso a paso y usa el prompt anterior para guiar a Claude en la implementación en tu entorno local.
