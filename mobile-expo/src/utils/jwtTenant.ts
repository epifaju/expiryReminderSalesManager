export interface JwtTenantClaims {
  organisationId: string | null;
  storeId: string | null;
}

/** Lit orgId / storeId du JWT (source de vérité côté API). */
export function parseJwtTenantClaims(token: string): JwtTenantClaims {
  try {
    const parts = token.split('.');
    if (parts.length < 2) {
      return { organisationId: null, storeId: null };
    }
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = JSON.parse(globalThis.atob(padded)) as { orgId?: string; storeId?: string };
    return {
      organisationId: typeof json.orgId === 'string' ? json.orgId : null,
      storeId: typeof json.storeId === 'string' ? json.storeId : null,
    };
  } catch {
    return { organisationId: null, storeId: null };
  }
}
