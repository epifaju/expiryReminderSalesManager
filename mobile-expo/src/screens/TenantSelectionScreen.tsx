import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import tenantService, { OrganisationListItemDto, StoreListItemDto } from '../services/tenantService';
import authService from '../services/authService';
import { pickInitialOrganisationId, pickInitialStoreId } from '../constants/tenant';

interface TenantSelectionScreenProps {
  onBack: () => void;
}

export default function TenantSelectionScreen({ onBack }: TenantSelectionScreenProps) {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [orgs, setOrgs] = useState<OrganisationListItemDto[]>([]);
  const [stores, setStores] = useState<StoreListItemDto[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(authService.getOrganisationId());
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(authService.getStoreId());
  const [saving, setSaving] = useState(false);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [showStoreModal, setShowStoreModal] = useState(false);

  const currentOrgId = authService.getOrganisationId();
  const currentStoreId = authService.getStoreId();

  const selectedOrg = useMemo(
    () => orgs.find((o) => o.id === selectedOrgId) || null,
    [orgs, selectedOrgId]
  );

  const selectedStore = useMemo(
    () => stores.find((s) => s.id === selectedStoreId) || null,
    [stores, selectedStoreId]
  );

  const showTenantError = (e: any) => {
    const status = e?.response?.status;
    if (status === 401) {
      Alert.alert(
        t('common.error'),
        t('errors.sessionExpired'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('auth.logout'),
            style: 'destructive',
            onPress: () => {
              void (async () => {
                try {
                  await authService.logout();
                  onBack();
                } catch (err: any) {
                  Alert.alert(t('common.error'), err?.message || t('errors.unknownError'));
                }
              })();
            },
          },
        ]
      );
      return;
    }
    if (status === 403) {
      Alert.alert(t('common.error'), t('errors.accessDenied'));
      return;
    }
    Alert.alert(t('common.error'), e?.message || t('errors.unknownError'));
  };

  const load = async (opts?: { keepSelection?: boolean }) => {
    try {
      setLoading(true);
      const data = await tenantService.getMyOrganisations();
      setOrgs(data);

      const keepSelection = opts?.keepSelection ?? true;
      const initialOrgId = pickInitialOrganisationId(data, {
        keepSelection,
        selectedOrgId,
        currentOrgId,
      });

      setSelectedOrgId(initialOrgId);

      if (initialOrgId) {
        const s = await tenantService.getStoresByOrganisation(initialOrgId);
        setStores(s);
        const storeIds = s.map((store) => store.id);
        const initialStoreId = pickInitialStoreId(storeIds, {
          keepSelection,
          selectedStoreId,
          currentStoreId,
        });
        setSelectedStoreId(initialStoreId);
      } else {
        setStores([]);
        setSelectedStoreId(null);
      }
    } catch (e: any) {
      showTenantError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSelectOrg = async (orgId: string) => {
    setSelectedOrgId(orgId);
    setSelectedStoreId(null);
    try {
      setLoading(true);
      const s = await tenantService.getStoresByOrganisation(orgId);
      setStores(s);
      setSelectedStoreId(s[0]?.id || null);
    } catch (e: any) {
      showTenantError(e);
    } finally {
      setLoading(false);
    }
  };

  const openOrgPicker = () => setShowOrgModal(true);
  const openStorePicker = () => {
    if (!selectedOrgId) {
      Alert.alert(t('common.error'), t('validation.fillRequiredFields'));
      return;
    }
    setShowStoreModal(true);
  };

  const onSave = async () => {
    if (!selectedOrgId || !selectedStoreId) {
      Alert.alert(t('common.error'), t('validation.fillRequiredFields'));
      return;
    }
    try {
      setSaving(true);
      await authService.switchStore(selectedOrgId, selectedStoreId);
      Alert.alert(t('common.success'), t('settings.saved'));
      onBack();
    } catch (e: any) {
      showTenantError(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('settings.organisationStore')}</Text>
        </View>
        <View style={styles.loading}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>{t('app.loading')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.organisationStore')}</Text>
        <TouchableOpacity onPress={() => void load({ keepSelection: true })} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>{t('settings.refresh')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.currentBox}>
          <Text style={styles.currentTitle}>{t('settings.currentSelection')}</Text>
          <Text style={styles.currentLine}>
            {t('settings.organisation')}: {selectedOrg?.name || currentOrgId || '-'}
          </Text>
          <Text style={styles.currentLine}>
            {t('settings.store')}: {selectedStore?.name || currentStoreId || '-'}
          </Text>
        </View>

        {/* Champs "sélecteurs" (plus clair qu'une liste) */}
        <Text style={styles.sectionTitle}>{t('settings.organisation')}</Text>
        <TouchableOpacity style={styles.selector} onPress={openOrgPicker} activeOpacity={0.7}>
          <Text style={styles.selectorValue}>{selectedOrg?.name || t('settings.organisation')}</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { marginTop: 18 }]}>{t('settings.store')}</Text>
        <TouchableOpacity style={styles.selector} onPress={openStorePicker} activeOpacity={0.7}>
          <Text style={styles.selectorValue}>{selectedStore?.name || t('settings.store')}</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        {/* Modals de sélection */}
        <Modal visible={showOrgModal} transparent animationType="fade" onRequestClose={() => setShowOrgModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>{t('settings.organisation')}</Text>
              <ScrollView style={{ maxHeight: 320 }}>
                {orgs.length === 0 ? (
                  <Text style={styles.emptyText}>{t('settings.noOrganisations')}</Text>
                ) : (
                  orgs.map((o) => (
                    <TouchableOpacity
                      key={o.id}
                      style={[styles.modalItem, selectedOrgId === o.id && styles.modalItemActive]}
                      onPress={() => {
                        setShowOrgModal(false);
                        void onSelectOrg(o.id);
                      }}
                    >
                      <Text style={styles.itemTitle}>{o.name}</Text>
                      <Text style={styles.itemSubtitle}>{o.role}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
              <TouchableOpacity style={styles.modalClose} onPress={() => setShowOrgModal(false)}>
                <Text style={styles.modalCloseText}>{t('common.close')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={showStoreModal} transparent animationType="fade" onRequestClose={() => setShowStoreModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>{t('settings.store')}</Text>
              <ScrollView style={{ maxHeight: 320 }}>
                {stores.length === 0 ? (
                  <Text style={styles.emptyText}>{t('settings.noStores')}</Text>
                ) : (
                  stores.map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.modalItem, selectedStoreId === s.id && styles.modalItemActive]}
                      onPress={() => {
                        setSelectedStoreId(s.id);
                        setShowStoreModal(false);
                      }}
                    >
                      <Text style={styles.itemTitle}>{s.name}</Text>
                      {!!s.address && <Text style={styles.itemSubtitle}>{s.address}</Text>}
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
              <TouchableOpacity style={styles.modalClose} onPress={() => setShowStoreModal(false)}>
                <Text style={styles.modalCloseText}>{t('common.close')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={() => void onSave()} disabled={saving}>
          <Text style={styles.saveText}>{saving ? t('common.loading') : t('common.save')}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#667eea', padding: 20, paddingTop: 50, flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 40, height: 32, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  backText: { color: 'white', fontSize: 28, marginTop: -6 },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', flex: 1 },
  refreshBtn: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 10 },
  refreshText: { color: 'white', fontWeight: '600' },
  content: { flex: 1, padding: 20 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  currentBox: { backgroundColor: 'white', borderRadius: 12, padding: 14, marginBottom: 18, elevation: 2 },
  currentTitle: { fontSize: 12, fontWeight: '700', color: '#667eea', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.6 },
  currentLine: { color: '#333', fontSize: 14, marginTop: 2 },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 10,
    elevation: 2,
  },
  selectorValue: { flex: 1, fontSize: 16, fontWeight: '600', color: '#333' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    elevation: 2,
  },
  itemActive: { borderWidth: 2, borderColor: '#667eea' },
  itemTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  itemSubtitle: { fontSize: 12, color: '#666', marginTop: 2 },
  chevron: { fontSize: 22, color: '#ccc', marginLeft: 10 },
  emptyText: { color: '#666', marginBottom: 10 },
  saveBtn: { backgroundColor: '#007bff', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 18 },
  saveBtnDisabled: { opacity: 0.6 },
  saveText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  loadingText: { marginTop: 10, color: '#666' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: 'white', borderRadius: 12, padding: 14 },
  modalTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10, color: '#333' },
  modalItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalItemActive: { backgroundColor: '#f0f4ff' },
  modalClose: { marginTop: 12, alignSelf: 'flex-end' },
  modalCloseText: { color: '#007bff', fontWeight: '700' },
});

