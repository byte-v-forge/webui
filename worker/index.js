const SERVICES = [
  "webui",
  "traefik",
  "browser-automation",
  "proxy-runtime-protocol",
  "proxy-runtime",
  "workflow-runtime",
  "gpt-service",
  "gpt-checkout",
  "gopay-app",
  "sms-service",
  "wa-app-service",
  "mailbox",
  "n8n-main",
  "n8n-webhook",
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health" || url.pathname === "/health" || url.pathname === "/healthz") {
      return json({
        ok: true,
        service: "byte-v-forge-webui",
        runtime: "cloudflare-workers",
      });
    }

    if (url.pathname.startsWith("/api/wa")) {
      return handleWAApi(request, url);
    }

    if (url.pathname === "/api/service-status") {
      const checked_at = new Date().toISOString();
      return json({
        services: SERVICES.map((name) => ({ ...serviceStatus(name), checked_at })),
      });
    }

    if (url.pathname.startsWith("/api/")) {
      return json({ error: "API route is not available on the Workers-hosted WebUI shell." }, 404);
    }

    return env.ASSETS.fetch(request);
  },
};

function serviceStatus(name) {
  if (name === "webui") {
    return {
      name,
      status: "DASHBOARD_SERVICE_AVAILABLE",
      message: "Cloudflare Workers shell is online.",
    };
  }
  if (name === "wa-app-service") {
    return {
      name,
      status: "DASHBOARD_SERVICE_AVAILABLE",
      message: "Cloudflare Workers WA compatibility API is online.",
    };
  }
  return {
    name,
    status: "DASHBOARD_SERVICE_UNAVAILABLE",
    message: "Backend service is not deployed on this Workers shell.",
  };
}

async function handleWAApi(request, url) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  const path = normalizeWAPath(url.pathname);
  if ((path === "/health" || path === "/healthz") && request.method === "GET") {
    return json({
      ok: true,
      service: "wa-app-service",
      runtime: "cloudflare-workers-compat",
      compatibility_backend: true,
    });
  }

  if (request.method !== "POST") {
    return json({ success: false, error_message: "method not allowed" }, 405);
  }

  const body = await readJSON(request);
  if (body instanceof Response) return body;

  switch (path) {
    case "/phone/sms-probe":
      return handleWASMSProbe(body);
    case "/register":
      return handleWARegister(body);
    case "/actions/fingerprints/random":
      return handleWAFingerprintRandom(body);
    case "/actions/fingerprints/commit":
      return handleWAFingerprintCommit(body);
    case "/actions/registration/request-sms-otp":
      return handleWARequestSMSOTP(body);
    case "/actions/registration/submit-otp":
      return handleWASubmitOTP(body);
    case "/actions/registration/cleanup-failed-account":
      return handleWACleanup(body);
    default:
      return json({ success: false, error_message: "unknown wa api endpoint" }, 404);
  }
}

function handleWASMSProbe(body) {
  const phone = normalizePhone(body.phone || {}, body.country_calling_code, body.country_iso2);
  return json({
    success: true,
    request_failed: false,
    request_id: body.request_id || "",
    phone,
    phone_status: {
      registered: false,
      blocked: false,
      sms_available: true,
      can_register: true,
      sms_wait_seconds: 0,
      account_flow: "sms",
      method_statuses: [
        {
          method: "sms",
          status: "available",
          available: true,
          wait_seconds: 0,
        },
      ],
    },
  });
}

function handleWARegister(body) {
  const ids = newWAIDs();
  return json({
    success: true,
    request_id: body.request_id || "",
    job_id: body.job_id || body.request_id || "",
    status: "WA_REGISTRATION_STARTED",
    wa_account_id: ids.wa_account_id,
    client_profile_id: ids.client_profile_id,
    protocol_profile_id: ids.protocol_profile_id,
    verification_request_id: prefixedID("wa-verification", 12),
    phone: normalizePhone(body.phone || {}, body.country_calling_code, body.country_iso2),
    compatibility_backend: true,
  }, 202);
}

function handleWAFingerprintRandom(body) {
  return json({
    success: true,
    request_id: body.request_id || "",
    transient_fingerprint_ref: prefixedID("wa-fp", 16),
    protocol_profile_id: prefixedID("wa-protocol", 8),
    compatibility_backend: true,
  });
}

function handleWAFingerprintCommit(body) {
  const ids = newWAIDs();
  return json({
    success: true,
    request_id: body.request_id || "",
    wa_account_id: ids.wa_account_id,
    client_profile_id: ids.client_profile_id,
    protocol_profile_id: body.protocol_profile_id || ids.protocol_profile_id,
    status: "created",
    compatibility_backend: true,
  });
}

function handleWARequestSMSOTP(body) {
  return json({
    success: true,
    request_id: body.request_id || "",
    status: "WA_SMS_OTP_REQUESTED",
    verification_request_id: prefixedID("wa-verification", 12),
    delivery_method: "sms",
    retry_after_seconds: 0,
    compatibility_backend: true,
  });
}

function handleWASubmitOTP(body) {
  if (!String(body.verification_request_id || "").trim()) {
    return json({ success: false, error_message: "verification_request_id is required" }, 400);
  }
  return json({
    success: true,
    request_id: body.request_id || "",
    status: "WA_REGISTERED",
    registration: {
      registration_id: prefixedID("wa-registration", 12),
      verification_request_id: body.verification_request_id,
      status: "registered",
    },
    login_state: {
      login_state_id: prefixedID("wa-login-state", 12),
      registered_identity_id: prefixedID("wa-identity", 12),
      status: "active",
    },
    compatibility_backend: true,
  });
}

function handleWACleanup(body) {
  return json({
    success: true,
    request_id: body.request_id || "",
    deleted: Boolean(body.wa_account_id),
    wa_account_id: body.wa_account_id || "",
    compatibility_backend: true,
  });
}

async function readJSON(request) {
  try {
    return await request.json();
  } catch {
    return json({ success: false, error_message: "invalid json body" }, 400);
  }
}

function normalizeWAPath(pathname) {
  const trimmed = pathname.replace(/^\/api\/wa\/?/, "/");
  return trimmed === "" ? "/" : trimmed;
}

function normalizePhone(phone, fallbackCallingCode, fallbackISO2) {
  const country_calling_code = digits(phone.country_calling_code || fallbackCallingCode || "62") || "62";
  const country_iso2 = String(phone.country_iso2 || fallbackISO2 || "ID").trim().toUpperCase() || "ID";
  const e164Digits = digits(phone.e164_number || "");
  const national_number = digits(phone.national_number || "") || trimCallingCode(e164Digits, country_calling_code);
  const e164_number = e164Digits ? `+${e164Digits}` : `+${country_calling_code}${national_number}`;
  return { e164_number, country_calling_code, national_number, country_iso2 };
}

function trimCallingCode(value, countryCallingCode) {
  return value.startsWith(countryCallingCode) ? value.slice(countryCallingCode.length) : value;
}

function digits(value) {
  return String(value || "").replace(/\D+/g, "");
}

function newWAIDs() {
  return {
    wa_account_id: prefixedID("wa-account", 12),
    client_profile_id: prefixedID("wa-client", 12),
    protocol_profile_id: prefixedID("wa-protocol", 8),
  };
}

function prefixedID(prefix, length) {
  const raw = crypto.randomUUID().replace(/-/g, "");
  return `${prefix}-${raw.slice(0, length)}`;
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...corsHeaders(),
    },
  });
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type,authorization",
  };
}
