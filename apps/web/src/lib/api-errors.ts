import { ApiError } from "./api";
import { format, type Translations } from "@/i18n/translations";

type ApiErrorsDict = Translations["apiErrors"];

interface ErrorBody {
  code?: string;
  message?: string;
  data?: unknown;
}

/**
 * Frases de negocio conocidas de la API. Cada regla mapea el mensaje en
 * inglés del backend a una clave de `t.apiErrors`; las capturas del regex se
 * interpolan en la plantilla con `format`.
 */
const BUSINESS_RULES: Array<{
  re: RegExp;
  key: Exclude<keyof ApiErrorsDict, "fields" | "validation">;
  vars?: (m: RegExpMatchArray) => Record<string, string>;
}> = [
  {
    re: /^(?:The alias|Alias) '(.+)' is already taken$/,
    key: "aliasTaken",
    vars: (m) => ({ alias: m[1] }),
  },
  { re: /^Campaign(?: with ID .+)? not found$/, key: "campaignNotFound" },
  { re: /^Link(?: with ID .+)? not found$/, key: "linkNotFound" },
  {
    re: /^(?:Workspace(?: with ID .+)? not found|Workspace no encontrado)$/,
    key: "workspaceNotFound",
  },
  { re: /^Subscriber not found$/, key: "subscriberNotFound" },
  { re: /^Member not found in this workspace$/, key: "memberNotFound" },
  { re: /^Invitation not found in this workspace$/, key: "invitationNotFound" },
  { re: /^User is already a member of this workspace$/, key: "alreadyMember" },
  { re: /^Subscriber with this email already exists/, key: "subscriberExists" },
  { re: /^Campaign has already been sent$/, key: "campaignAlreadySent" },
  { re: /^Only DRAFT campaigns can be edited$/, key: "onlyDraftEditable" },
  { re: /^The workspace owner cannot be modified$/, key: "ownerImmutable" },
  { re: /^The workspace owner cannot be removed$/, key: "ownerNotRemovable" },
  { re: /^Only the owner can delete the workspace$/, key: "onlyOwnerDelete" },
  { re: /^Only the owner can update the workspace/, key: "onlyOwnerUpdate" },
  {
    re: /^(?:You do not have access to this workspace|No tienes acceso a este workspace)$/,
    key: "noAccessWorkspace",
  },
  { re: /^You do not have access to this link$/, key: "noAccessLink" },
  { re: /^You do not have access to this campaign$/, key: "noAccessCampaign" },
  { re: /^No tienes el permiso/, key: "noPermission" },
  {
    re: /^Workspace link limit reached \((\d+) links\)/,
    key: "linkLimitReached",
    vars: (m) => ({ n: m[1] }),
  },
  { re: /^API key not found$/, key: "apiKeyNotFound" },
  { re: /^Invalid or revoked API key\.?$/, key: "apiKeyInvalid" },
  { re: /^A record with th(?:is|ese) .*already exists\.?$/, key: "duplicate" },
  { re: /^The requested record was not found\.?$/, key: "recordNotFound" },
  { re: /^This action references a related record/, key: "relatedRecordConflict" },
  // Errores comunes de Supabase Auth (login, registro, contraseña).
  { re: /^Invalid login credentials/i, key: "invalidCredentials" },
  { re: /^Email not confirmed/i, key: "emailNotConfirmed" },
  {
    re: /^Password should be at least (\d+) characters/i,
    key: "passwordTooShort",
    vars: (m) => ({ n: m[1] }),
  },
  {
    re: /^New password should be different from the old password/i,
    key: "samePassword",
  },
  {
    re: /security purposes.*only request this|rate limit/i,
    key: "tooManyRequests",
  },
  { re: /^User already registered/i, key: "userAlreadyRegistered" },
];

/**
 * Patrones de los mensajes por defecto de class-validator. Se aplican con
 * reemplazo global, de modo que un mensaje compuesto ("a, b, c") se traduce
 * por partes. El primer grupo de captura siempre es el nombre del campo.
 */
const VALIDATION_RULES: Array<{
  re: RegExp;
  key: keyof ApiErrorsDict["validation"];
  hasN?: boolean;
}> = [
  { re: /(\w+) must be longer than or equal to (\d+) characters/g, key: "minLength", hasN: true },
  { re: /(\w+) must be shorter than or equal to (\d+) characters/g, key: "maxLength", hasN: true },
  { re: /(\w+) must be an email/g, key: "isEmail" },
  { re: /(\w+) should not be empty/g, key: "notEmpty" },
  { re: /(\w+) must be a string/g, key: "isString" },
  { re: /(\w+) must be a URL address/g, key: "isUrl" },
  { re: /(\w+) must be a UUID/g, key: "isUuid" },
  { re: /(\w+) must be an integer number/g, key: "isInt" },
  { re: /(\w+) must be a number conforming to the specified constraints/g, key: "isNumber" },
  { re: /(\w+) must be a boolean value/g, key: "isBoolean" },
  { re: /(\w+) must be an array/g, key: "isArray" },
  { re: /(\w+) must be one of the following values:/g, key: "isEnum" },
  { re: /(\w+) must match .+? regular expression/g, key: "matches" },
  { re: /(\w+) must not be less than (-?\d+)/g, key: "min", hasN: true },
  { re: /(\w+) must not be greater than (-?\d+)/g, key: "max", hasN: true },
];

function fieldLabel(dict: ApiErrorsDict, prop: string): string {
  return dict.fields[prop] ?? prop;
}

/** Traduce los mensajes de class-validator contenidos en `message`. */
function translateValidation(message: string, dict: ApiErrorsDict): string {
  let out = message;
  for (const rule of VALIDATION_RULES) {
    out = out.replace(rule.re, (_match, prop: string, n?: string) =>
      format(dict.validation[rule.key], {
        field: fieldLabel(dict, prop),
        ...(rule.hasN && n !== undefined ? { n } : {}),
      }),
    );
  }
  out = out.replace(/each value in /g, dict.validation.eachValueIn);
  return out;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Convierte cualquier error de la API en un mensaje localizado y legible.
 * Orden de resolución: códigos LP_* con significado propio → frases de
 * negocio conocidas → mensajes de validación de class-validator → fallback
 * genérico por status HTTP → mensaje crudo.
 */
export function localizeApiError(
  err: unknown,
  t: Translations,
): string | undefined {
  const dict = t.apiErrors;
  const message =
    err instanceof Error ? err.message : typeof err === "string" ? err : undefined;
  const body =
    err instanceof ApiError && err.data && typeof err.data === "object"
      ? (err.data as ErrorBody)
      : null;

  // 1. Códigos estructurados con traducción dedicada.
  if (body?.code === "LP_WORKSPACE_LIMIT") {
    const plan = (body.data as { plan?: string } | null)?.plan;
    return plan === "PRO"
      ? t.workspaces.limitReachedPro
      : t.workspaces.limitReachedFree;
  }

  if (message) {
    // 2. Frases de negocio conocidas.
    for (const rule of BUSINESS_RULES) {
      const m = message.match(rule.re);
      if (m) {
        const template = dict[rule.key];
        return rule.vars ? format(template, rule.vars(m)) : template;
      }
    }

    // 3. Mensajes de validación (pueden venir varios unidos por comas).
    const translated = translateValidation(message, dict);
    if (translated !== message) return capitalize(translated);

    // Errores de red del fetch (no llegaron a la API).
    if (/failed to fetch|networkerror|load failed/i.test(message)) {
      return dict.networkError;
    }
  }

  // 4. Fallback genérico por status; mejor un mensaje claro en el idioma
  // del usuario que una frase técnica en inglés.
  if (err instanceof ApiError) {
    if (err.status === 401) return dict.unauthorized;
    if (err.status === 403) return dict.forbidden;
    if (err.status === 404) return dict.notFound;
    if (err.status >= 500) return dict.serverError;
  }

  return message;
}
