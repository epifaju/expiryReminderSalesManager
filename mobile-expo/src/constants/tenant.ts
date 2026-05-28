import type { OrganisationListItemDto } from '../services/tenantService';

export const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';
export const DEFAULT_STORE_ID = '00000000-0000-0000-0000-000000000002';

export function pickInitialOrganisationId(
  orgs: OrganisationListItemDto[],
  options: {
    keepSelection: boolean;
    selectedOrgId: string | null;
    currentOrgId: string | null;
  }
): string | null {
  const { keepSelection, selectedOrgId, currentOrgId } = options;
  if (keepSelection && selectedOrgId && orgs.some((o) => o.id === selectedOrgId)) {
    return selectedOrgId;
  }
  if (currentOrgId && currentOrgId !== DEFAULT_ORG_ID && orgs.some((o) => o.id === currentOrgId)) {
    return currentOrgId;
  }
  const preferred = orgs.find((o) => o.id !== DEFAULT_ORG_ID && o.status === 'ACTIVE');
  if (preferred) {
    return preferred.id;
  }
  return orgs[0]?.id ?? currentOrgId ?? null;
}

export function pickInitialStoreId(
  storeIds: string[],
  options: {
    keepSelection: boolean;
    selectedStoreId: string | null;
    currentStoreId: string | null;
  }
): string | null {
  const { keepSelection, selectedStoreId, currentStoreId } = options;
  if (keepSelection && selectedStoreId && storeIds.includes(selectedStoreId)) {
    return selectedStoreId;
  }
  if (currentStoreId && currentStoreId !== DEFAULT_STORE_ID && storeIds.includes(currentStoreId)) {
    return currentStoreId;
  }
  const preferred = storeIds.find((id) => id !== DEFAULT_STORE_ID);
  return preferred ?? storeIds[0] ?? currentStoreId ?? null;
}
