import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import authService from '../services/authService';
import { useTranslation } from 'react-i18next';
import adminTenantService, {
  AdminOrganisationDto,
  AdminStoreDto,
  AdminUserListItemDto,
  AdminOrganisationMemberDto,
} from '../services/adminTenantService';

interface Props {
  onBack: () => void;
}

const isAdmin = () =>
  authService
    .getUser()
    ?.roles?.some((role) => role === 'ROLE_ADMIN' || role === 'ADMIN' || role === 'ROLE_PLATFORM_ADMIN') ?? false;

const AdminTenantManagementScreen: React.FC<Props> = ({ onBack }) => {
  const { t } = useTranslation();
  const canUse = useMemo(() => isAdmin(), []);

  const [loading, setLoading] = useState(false);
  const [activeOnly, setActiveOnly] = useState(true);

  const [orgs, setOrgs] = useState<AdminOrganisationDto[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<AdminOrganisationDto | null>(null);
  const [stores, setStores] = useState<AdminStoreDto[]>([]);
  const [members, setMembers] = useState<AdminOrganisationMemberDto[]>([]);

  const [newOrgName, setNewOrgName] = useState('');
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreAddress, setNewStoreAddress] = useState('');

  const [userQuery, setUserQuery] = useState('');
  const [userResults, setUserResults] = useState<AdminUserListItemDto[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUserListItemDto | null>(null);
  const [memberRole, setMemberRole] = useState('MANAGER');

  const refreshAll = async (keepSelection = true, selectedOrgId?: string | null) => {
    if (!canUse) return;
    setLoading(true);
    try {
      const nextOrgs = await adminTenantService.listOrganisations(activeOnly);
      setOrgs(nextOrgs);

      let nextSelected: AdminOrganisationDto | null = selectedOrg;
      if (!keepSelection) {
        nextSelected = null;
      } else if (selectedOrgId) {
        nextSelected = nextOrgs.find((o) => o.id === selectedOrgId) ?? null;
      } else if (selectedOrg) {
        nextSelected = nextOrgs.find((o) => o.id === selectedOrg.id) ?? null;
      }
      setSelectedOrg(nextSelected);

      if (nextSelected) {
        const [nextStores, nextMembers] = await Promise.all([
          adminTenantService.listStoresByOrganisation(nextSelected.id, activeOnly),
          adminTenantService.listMembers(nextSelected.id, activeOnly),
        ]);
        setStores(nextStores);
        setMembers(nextMembers);
      } else {
        setStores([]);
        setMembers([]);
      }
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.message || e?.message || 'Erreur lors du chargement.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshAll(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOnly]);

  const onCreateOrg = async () => {
    const name = newOrgName.trim();
    if (!name) return;
    try {
      setLoading(true);
      const created = await adminTenantService.createOrganisation(name);
      setNewOrgName('');
      setSelectedOrg(created);
      await refreshAll(true, created.id);
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.message || e?.message || 'Création impossible.');
    } finally {
      setLoading(false);
    }
  };

  const onCreateStore = async () => {
    if (!selectedOrg) return;
    const name = newStoreName.trim();
    const address = newStoreAddress.trim();
    if (!name) return;
    try {
      setLoading(true);
      const createdStore = await adminTenantService.createStore(selectedOrg.id, name, address || undefined);
      setNewStoreName('');
      setNewStoreAddress('');
      await refreshAll(true, selectedOrg.id);
      try {
        await authService.switchStore(selectedOrg.id, createdStore.id);
        Alert.alert(
          t('common.success'),
          t('settings.storeCreatedAndSelected', { name: createdStore.name })
        );
      } catch (switchErr: any) {
        Alert.alert(
          t('common.success'),
          t('settings.storeCreatedSelectManually', { name: createdStore.name })
        );
      }
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.message || e?.message || 'Création impossible.');
    } finally {
      setLoading(false);
    }
  };

  const onSearchUsers = async () => {
    const q = userQuery.trim();
    if (!q) {
      setUserResults([]);
      setSelectedUser(null);
      return;
    }
    try {
      setLoading(true);
      const users = await adminTenantService.searchUsers(q);
      setUserResults(users);
      setSelectedUser(null);
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.message || e?.message || 'Recherche impossible.');
    } finally {
      setLoading(false);
    }
  };

  const onAddMember = async () => {
    if (!selectedOrg || !selectedUser) return;
    const role = memberRole.trim();
    if (!role) return;
    try {
      setLoading(true);
      await adminTenantService.addMember(selectedOrg.id, selectedUser.id, role, 'ACTIVE');
      Alert.alert('OK', 'Membre ajouté (ou mis à jour).');
      setSelectedUser(null);
      setUserResults([]);
      setUserQuery('');
      await refreshAll(true, selectedOrg.id);
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.message || e?.message || 'Ajout impossible.');
    } finally {
      setLoading(false);
    }
  };

  const toggleActiveOnly = () => setActiveOnly((v) => !v);

  if (!canUse) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.back}>‹ Retour</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🛠️ Administration (SaaS)</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.warning}>Accès refusé. (Admin requis)</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.back}>‹ Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🛠️ Administration (SaaS)</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={styles.row}>
          <TouchableOpacity style={styles.smallBtn} onPress={() => void refreshAll(true, selectedOrg?.id)} disabled={loading}>
            <Text style={styles.smallBtnText}>{loading ? '...' : 'Actualiser'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.smallBtn} onPress={toggleActiveOnly} disabled={loading}>
            <Text style={styles.smallBtnText}>{activeOnly ? 'Actifs' : 'Tous'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Organisations</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Créer une organisation</Text>
          <View style={styles.row}>
            <TextInput
              value={newOrgName}
              onChangeText={setNewOrgName}
              placeholder="Nom"
              style={styles.input}
            />
            <TouchableOpacity style={styles.primaryBtn} onPress={() => void onCreateOrg()} disabled={loading}>
              <Text style={styles.primaryBtnText}>Créer</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Sélection</Text>
          {orgs.length === 0 ? (
            <Text style={styles.muted}>Aucune organisation.</Text>
          ) : (
            orgs.map((o) => {
              const selected = selectedOrg?.id === o.id;
              return (
                <TouchableOpacity
                  key={o.id}
                  style={[styles.listItem, selected && styles.listItemSelected]}
                  onPress={() => {
                    setSelectedOrg(o);
                    void refreshAll(true, o.id);
                  }}
                >
                  <Text style={styles.listTitle}>
                    {o.name} {!o.isActive ? '(inactive)' : ''}
                  </Text>
                  <Text style={styles.listSub}>{o.id}</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <Text style={styles.sectionTitle}>Stores</Text>
        {!selectedOrg ? (
          <Text style={styles.muted}>Sélectionne une organisation.</Text>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.label}>Créer un store</Text>
              <Text style={styles.muted}>Organisation: {selectedOrg.name}</Text>
              <TextInput
                value={newStoreName}
                onChangeText={setNewStoreName}
                placeholder="Nom du store"
                style={styles.input}
              />
              <TextInput
                value={newStoreAddress}
                onChangeText={setNewStoreAddress}
                placeholder="Adresse (optionnel)"
                style={styles.input}
              />
              <TouchableOpacity style={styles.primaryBtnWide} onPress={() => void onCreateStore()} disabled={loading}>
                <Text style={styles.primaryBtnText}>Créer store</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              {stores.length === 0 ? (
                <Text style={styles.muted}>Aucun store.</Text>
              ) : (
                stores.map((s) => (
                  <View key={s.id} style={styles.listItem}>
                    <Text style={styles.listTitle}>
                      {s.name} {!s.isActive ? '(inactive)' : ''}
                    </Text>
                    {!!s.address && <Text style={styles.listSub}>{s.address}</Text>}
                    <Text style={styles.listSub}>{s.id}</Text>
                  </View>
                ))
              )}
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>Membres</Text>
        {!selectedOrg ? (
          <Text style={styles.muted}>Sélectionne une organisation.</Text>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.label}>Ajouter un membre</Text>
              <Text style={styles.muted}>Recherche par username/email.</Text>
              <View style={styles.row}>
                <TextInput
                  value={userQuery}
                  onChangeText={setUserQuery}
                  placeholder="ex: alice ou alice@email.com"
                  style={styles.input}
                />
                <TouchableOpacity style={styles.primaryBtn} onPress={() => void onSearchUsers()} disabled={loading}>
                  <Text style={styles.primaryBtnText}>Go</Text>
                </TouchableOpacity>
              </View>

              {userResults.length > 0 && (
                <View style={{ marginTop: 8 }}>
                  {userResults.map((u) => {
                    const picked = selectedUser?.id === u.id;
                    const label = `${u.username} (${u.email})`;
                    return (
                      <TouchableOpacity
                        key={u.id}
                        style={[styles.listItem, picked && styles.listItemSelected]}
                        onPress={() => setSelectedUser(u)}
                      >
                        <Text style={styles.listTitle}>{label}</Text>
                        <Text style={styles.listSub}>id: {u.id}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <TextInput
                value={memberRole}
                onChangeText={setMemberRole}
                placeholder="Role (ex: MANAGER)"
                style={styles.input}
              />
              <TouchableOpacity
                style={[styles.primaryBtnWide, !selectedUser && styles.disabled]}
                onPress={() => void onAddMember()}
                disabled={!selectedUser || loading}
              >
                <Text style={styles.primaryBtnText}>Ajouter membre</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              {members.length === 0 ? (
                <Text style={styles.muted}>Aucun membre.</Text>
              ) : (
                members.map((m) => (
                  <View key={`${m.organisationId}:${m.userId}`} style={styles.listItem}>
                    <Text style={styles.listTitle}>
                      {m.username} — {m.role} — {m.status}
                    </Text>
                    <Text style={styles.listSub}>userId: {m.userId}</Text>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#667eea', padding: 20, paddingTop: 50 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: 'white', marginTop: 8 },
  back: { color: 'white', fontSize: 16, fontWeight: '600' },
  content: { flex: 1, padding: 16 },
  warning: { fontSize: 16, color: '#b00020', backgroundColor: '#fff', padding: 12, borderRadius: 10 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', marginTop: 10, marginBottom: 8 },
  card: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  label: { fontWeight: '700', marginBottom: 6, color: '#333' },
  muted: { color: '#666', marginBottom: 6 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  primaryBtn: {
    backgroundColor: '#667eea',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  primaryBtnWide: {
    backgroundColor: '#667eea',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  primaryBtnText: { color: 'white', fontWeight: '700' },
  smallBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  smallBtnText: { fontWeight: '700', color: '#333' },
  listItem: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  listItemSelected: { borderColor: '#667eea', backgroundColor: '#eef0ff' },
  listTitle: { fontWeight: '700', color: '#333' },
  listSub: { color: '#666', marginTop: 2, fontSize: 12 },
  disabled: { opacity: 0.6 },
});

export default AdminTenantManagementScreen;

