/**
 * Plantillas HTML de los correos TRANSACCIONALES / del sistema que envía la
 * propia aplicación (invitaciones, pruebas, etc.).
 *
 * Esto NO aplica al contenido de las campañas de email marketing: esas usan el
 * HTML que define el usuario. Aquí controlamos nosotros el diseño con marca.
 *
 * El HTML es table-based con estilos inline para máxima compatibilidad con
 * clientes de correo (Gmail, Outlook, Apple Mail, etc.).
 */

const BRAND = {
  name: process.env.MAIL_BRAND_NAME ?? 'LinkPulse',
  /** Color primario; por defecto el indigo del frontend (indigo-600). */
  color: process.env.MAIL_BRAND_COLOR ?? '#4f46e5',
  colorDark: process.env.MAIL_BRAND_COLOR_DARK ?? '#4338ca',
  appUrl: (process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, ''),
  /** Logo opcional. Si no hay, se usa un wordmark de texto. */
  logoUrl: process.env.MAIL_LOGO_URL ?? '',
};

/** Escapa texto que se interpola dentro del HTML para evitar inyección. */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface EmailLayoutOptions {
  /** Texto de preview que muestran algunos clientes (oculto en el cuerpo). */
  preheader?: string;
  /** Título principal del correo. */
  heading: string;
  /** Bloques de contenido ya formateados en HTML (párrafos, etc.). */
  bodyHtml: string;
  /** Botón de acción opcional. */
  cta?: { label: string; url: string };
  /** Nota al pie en gris pequeño (opcional). */
  footnote?: string;
}

const brandHeader = (): string => {
  const inner = BRAND.logoUrl
    ? `<img src="${BRAND.logoUrl}" alt="${escapeHtml(BRAND.name)}" height="28" style="height:28px;display:block;border:0;outline:none;text-decoration:none;" />`
    : `<span style="font-size:22px;font-weight:800;letter-spacing:-0.02em;color:${BRAND.color};">${escapeHtml(BRAND.name)}</span>`;
  return `
    <tr>
      <td style="padding:28px 32px 0 32px;">${inner}</td>
    </tr>`;
};

const ctaButton = (cta: { label: string; url: string }): string => `
  <tr>
    <td style="padding:8px 32px 4px 32px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td bgcolor="${BRAND.color}" style="border-radius:12px;">
            <a href="${cta.url}" target="_blank"
               style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px;">
              ${escapeHtml(cta.label)}
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;

export function renderEmailLayout(opts: EmailLayoutOptions): string {
  const year = new Date().getFullYear();
  const preheader = opts.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;height:0;width:0;">${escapeHtml(opts.preheader)}</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${escapeHtml(opts.heading)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;">
  ${preheader}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f4f6;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
               style="max-width:520px;background-color:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #eceef2;">
          ${brandHeader()}
          <tr>
            <td style="padding:20px 32px 8px 32px;font-family:Arial,Helvetica,sans-serif;">
              <h1 style="margin:0;font-size:22px;line-height:1.3;font-weight:800;color:#111827;letter-spacing:-0.01em;">
                ${escapeHtml(opts.heading)}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:4px 32px 8px 32px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#374151;">
              ${opts.bodyHtml}
            </td>
          </tr>
          ${opts.cta ? ctaButton(opts.cta) : ''}
          ${
            opts.footnote
              ? `<tr><td style="padding:16px 32px 0 32px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#9ca3af;">${opts.footnote}</td></tr>`
              : ''
          }
          <tr>
            <td style="padding:28px 32px 28px 32px;">
              <hr style="border:none;border-top:1px solid #f1f2f4;margin:0 0 16px 0;" />
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#9ca3af;">
                © ${year} ${escapeHtml(BRAND.name)} ·
                <a href="${BRAND.appUrl}" target="_blank" style="color:${BRAND.color};text-decoration:none;">${BRAND.appUrl.replace(/^https?:\/\//, '')}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/* ------------------------------------------------------------------ */
/* Plantillas concretas                                                */
/* ------------------------------------------------------------------ */

export interface InvitationTemplateData {
  workspaceName: string;
  inviteeEmail: string;
  registerUrl: string;
  inviterName?: string | null;
}

export function invitationEmailTemplate(
  data: InvitationTemplateData,
): { subject: string; html: string } {
  const ws = escapeHtml(data.workspaceName);
  const inviter = data.inviterName ? escapeHtml(data.inviterName) : '';
  const intro = inviter
    ? `<strong>${inviter}</strong> te invitó a colaborar en el espacio de trabajo <strong>${ws}</strong> en ${escapeHtml(BRAND.name)}.`
    : `Has sido invitado a colaborar en el espacio de trabajo <strong>${ws}</strong> en ${escapeHtml(BRAND.name)}.`;

  const bodyHtml = `
    <p style="margin:0 0 14px 0;">${intro}</p>
    <p style="margin:0 0 6px 0;">Crea tu cuenta con este correo y entrarás automáticamente al espacio:</p>
    <p style="margin:0 0 4px 0;font-weight:700;color:#111827;">${escapeHtml(data.inviteeEmail)}</p>
  `;

  return {
    subject: `Invitación a ${data.workspaceName} en ${BRAND.name}`,
    html: renderEmailLayout({
      preheader: `Te invitaron a ${data.workspaceName} en ${BRAND.name}`,
      heading: `Te invitaron a ${data.workspaceName}`,
      bodyHtml,
      cta: { label: 'Crear mi cuenta', url: data.registerUrl },
      footnote:
        'Si no esperabas esta invitación, puedes ignorar este correo de forma segura.',
    }),
  };
}

export function testEmailTemplate(): { subject: string; html: string } {
  return {
    subject: `✅ Correo de prueba de ${BRAND.name}`,
    html: renderEmailLayout({
      preheader: `Tu configuración de correo en ${BRAND.name} funciona`,
      heading: '¡Conexión exitosa!',
      bodyHtml: `
        <p style="margin:0 0 14px 0;">Tu configuración de correo está funcionando correctamente.</p>
        <p style="margin:0;">Ya puedes enviar campañas y notificaciones desde ${escapeHtml(BRAND.name)}.</p>
      `,
      footnote: 'Enviado desde el módulo de Email Marketing.',
    }),
  };
}
