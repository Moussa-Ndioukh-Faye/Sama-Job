// NOTE : Tous les montants de mission (client, prestataire, admin) doivent être affichés et saisis en Franc CFA (FCFA)
/**
 * Écrans Administration - SamaJob
 * Dashboard, Dossiers, Utilisateurs, Missions, Statistiques
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  RefreshControl,
  FlatList,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { adminAPI } from '../services/api';
import Toast from 'react-native-toast-message';
import { Button, SkeletonLoader, EmptyState } from '../components';

const ADMIN_COLOR = '#6953da';

// ============================================================
// 1. ADMIN DASHBOARD SCREEN
// ============================================================
export const AdminDashboardScreen = ({ navigation }) => {
  const { colors, spacing, fontSize, borderRadius } = useTheme();
  const { user, deconnexion } = useAuth();
  const [stats, setStats] = useState(null);
  const [dossiersPending, setDossiersPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [statsRes, dossiersRes] = await Promise.all([
        adminAPI.obtenirStatistiques(),
        adminAPI.listerDossiers(),
      ]);
      setStats(statsRes.data);
      setDossiersPending(Array.isArray(dossiersRes.data) ? dossiersRes.data : []);
    } catch (error) {
      console.error('Erreur chargement dashboard admin:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const StatCard = ({ icon, label, value, color, onPress }) => (
    <TouchableOpacity
      style={[styles.statCard, { backgroundColor: colors.surface, borderRadius: borderRadius.md }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.text?.primary, fontSize: fontSize.xl }]}>
        {value ?? '-'}
      </Text>
      <Text style={[styles.statLabel, { color: colors.text?.secondary, fontSize: fontSize.xs }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.dashboardHeader, { backgroundColor: ADMIN_COLOR }]}>
          <View>
            <SkeletonLoader.Rect width={100} height={14} borderRadius={4} />
            <SkeletonLoader.Rect width={180} height={22} borderRadius={4} style={{ marginTop: 6 }} />
          </View>
        </View>
        <View style={{ padding: spacing.md }}>
          <SkeletonLoader.Rect width="100%" height={50} borderRadius={borderRadius.md} style={{ marginBottom: spacing.md }} />
          <View style={styles.statsGrid}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <SkeletonLoader.Rect key={i} width="48%" height={110} borderRadius={borderRadius.md} style={{ flexGrow: 1, flexBasis: '45%' }} />
            ))}
          </View>
        </View>
      </View>
    );
  }

  const utilisateurs = stats?.utilisateurs || {};
  const missions = stats?.missions || {};
  const prestataires = stats?.prestataires || {};

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
    >
      {/* Header */}
      <View style={[styles.dashboardHeader, { backgroundColor: ADMIN_COLOR }]}>
        <View>
          <Text style={styles.dashboardGreeting}>Administration</Text>
          <Text style={styles.dashboardName}>Bonjour, {user?.prenom || 'Admin'}</Text>
        </View>
        <TouchableOpacity onPress={deconnexion}>
          <MaterialCommunityIcons name="logout" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Alerte dossiers en attente */}
      {dossiersPending.length > 0 && (
        <TouchableOpacity
          style={[styles.alertBanner, { backgroundColor: colors.statusBg?.warning || '#FFF3E0', borderRadius: borderRadius.md, margin: spacing.md }]}
          onPress={() => navigation.navigate('Dossiers')}
        >
          <MaterialCommunityIcons name="alert-circle" size={22} color={colors.warning || '#E65100'} />
          <Text style={{ color: colors.warning || '#E65100', flex: 1, marginLeft: 8, fontWeight: '600' }}>
            {dossiersPending.length} dossier(s) en attente de validation
          </Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.warning || '#E65100'} />
        </TouchableOpacity>
      )}

      {/* Stats Grid */}
      <View style={[styles.statsGrid, { padding: spacing.md }]}>
        <StatCard
          icon="account-group"
          label="Utilisateurs"
          value={utilisateurs.total}
          color={colors.secondary || '#2196F3'}
          onPress={() => navigation.navigate('GestionUtilisateurs')}
        />
        <StatCard
          icon="briefcase"
          label="Missions"
          value={missions.total}
          color={colors.success || '#4CAF50'}
          onPress={() => navigation.navigate('GestionMissions')}
        />
        <StatCard
          icon="file-document-check"
          label="Dossiers en attente"
          value={prestataires?.en_attente ?? dossiersPending.length}
          color={colors.warning || '#FF9800'}
          onPress={() => navigation.navigate('Dossiers')}
        />
        <StatCard
          icon="account-check"
          label="Prestataires validés"
          value={prestataires?.valides}
          color="#009688"
        />
        <StatCard
          icon="briefcase-check"
          label="Missions terminées"
          value={missions.terminees}
          color="#8BC34A"
        />
        <StatCard
          icon="cash-multiple"
          label="Revenus totaux"
          value={stats?.revenus?.total ? `${Number(stats.revenus.total).toLocaleString()} F` : '0 F'}
          color={ADMIN_COLOR}
        />
      </View>

      {/* Quick Actions */}
      <Text style={[styles.sectionTitle, { color: colors.text?.primary, paddingHorizontal: spacing.md }]}>
        Actions rapides
      </Text>
      <View style={{ padding: spacing.md, gap: 10 }}>
        <TouchableOpacity
          style={[styles.quickAction, { backgroundColor: colors.surface, borderRadius: borderRadius.md }]}
          onPress={() => navigation.navigate('Dossiers')}
        >
          <MaterialCommunityIcons name="file-document-edit" size={22} color={colors.warning || '#FF9800'} />
          <Text style={[styles.quickActionText, { color: colors.text?.primary }]}>Valider les dossiers</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.text?.secondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickAction, { backgroundColor: colors.surface, borderRadius: borderRadius.md }]}
          onPress={() => navigation.navigate('GestionUtilisateurs')}
        >
          <MaterialCommunityIcons name="account-cog" size={22} color={colors.secondary || '#2196F3'} />
          <Text style={[styles.quickActionText, { color: colors.text?.primary }]}>Gérer les utilisateurs</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.text?.secondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickAction, { backgroundColor: colors.surface, borderRadius: borderRadius.md }]}
          onPress={() => navigation.navigate('GestionMissions')}
        >
          <MaterialCommunityIcons name="briefcase-edit" size={22} color={colors.success || '#4CAF50'} />
          <Text style={[styles.quickActionText, { color: colors.text?.primary }]}>Modérer les missions</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.text?.secondary} />
        </TouchableOpacity>
      </View>

      {/* Breakdown Stats */}
      <Text style={[styles.sectionTitle, { color: colors.text?.primary, paddingHorizontal: spacing.md, marginTop: spacing.sm }]}>
        Répartition utilisateurs
      </Text>
      <View style={[styles.breakdownContainer, { backgroundColor: colors.surface, margin: spacing.md, borderRadius: borderRadius.md }]}>
        <BreakdownRow label="Clients" value={utilisateurs.clients} color={colors.secondary || '#2196F3'} total={utilisateurs.total} />
        <BreakdownRow label="Prestataires" value={utilisateurs.prestataires} color={colors.success || '#4CAF50'} total={utilisateurs.total} />
        <BreakdownRow label="Admins" value={utilisateurs.admins} color={ADMIN_COLOR} total={utilisateurs.total} />
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
};

const BreakdownRow = ({ label, value, color, total }) => {
  const { colors } = useTheme();
  const pct = total > 0 ? ((value || 0) / total * 100).toFixed(0) : 0;
  return (
    <View style={styles.breakdownRow}>
      <View style={[styles.breakdownDot, { backgroundColor: color }]} />
      <Text style={[styles.breakdownLabel, { color: colors.text?.secondary }]}>{label}</Text>
      <Text style={[styles.breakdownValue, { color: colors.text?.primary }]}>{value ?? 0}</Text>
      <View style={[styles.breakdownBarBg, { backgroundColor: colors.border || '#f0f0f0' }]}>
        <View style={[styles.breakdownBar, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.breakdownPct, { color: colors.text?.tertiary }]}>{pct}%</Text>
    </View>
  );
};

// ============================================================
// 2. DOSSIERS SCREEN (Validation prestataires)
// ============================================================
export const DossiersScreen = ({ navigation }) => {
  const { colors, spacing, fontSize, borderRadius } = useTheme();
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState(null);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [motifRejet, setMotifRejet] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadDossiers = async () => {
    try {
      const res = await adminAPI.listerDossiers();
      setDossiers(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Erreur chargement dossiers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDossiers(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDossiers();
    setRefreshing(false);
  };

  const handleValider = async (id) => {
    Alert.alert(
      'Confirmer la validation',
      'Voulez-vous valider ce dossier prestataire ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Valider',
          onPress: async () => {
            setActionLoading(true);
            try {
              await adminAPI.validerDossier(id);
              Toast.show({ type: 'success', text1: 'Dossier validé avec succès' });
              setDossiers(prev => prev.filter(d => d.id !== id));
            } catch (error) {
              Toast.show({ type: 'error', text1: 'Erreur lors de la validation' });
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleRejeter = async () => {
    if (!motifRejet.trim()) {
      Toast.show({ type: 'error', text1: 'Veuillez saisir un motif de rejet' });
      return;
    }
    setActionLoading(true);
    try {
      await adminAPI.rejeterDossier(selectedDossier.id, motifRejet);
      Toast.show({ type: 'success', text1: 'Dossier rejeté' });
      setDossiers(prev => prev.filter(d => d.id !== selectedDossier.id));
      setRejectModalVisible(false);
      setMotifRejet('');
      setSelectedDossier(null);
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Erreur lors du rejet' });
    } finally {
      setActionLoading(false);
    }
  };

  const renderDossier = ({ item }) => (
    <View style={[styles.dossierCard, { backgroundColor: colors.surface, borderRadius: borderRadius.md }]}>
      <View style={styles.dossierHeader}>
        <View style={[styles.avatar, { backgroundColor: (colors.warning || '#FF9800') + '20' }]}>
          <MaterialCommunityIcons name="account-school" size={24} color={colors.warning || '#FF9800'} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.dossierName, { color: colors.text?.primary }]}>
            {item.prenom} {item.nom}
          </Text>
          <Text style={{ color: colors.text?.secondary, fontSize: 13 }}>
            {item.email || item.telephone}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: colors.statusBg?.warning || '#FFF3E0' }]}>
          <Text style={{ color: colors.warning || '#E65100', fontSize: 11, fontWeight: '600' }}>En attente</Text>
        </View>
      </View>

      <View style={[styles.dossierInfo, { borderTopColor: colors.border }]}>
        {item.domaine && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="book-open-variant" size={16} color={colors.text?.secondary} />
            <Text style={{ color: colors.text?.secondary, marginLeft: 6, fontSize: 13 }}>
              Domaine: {item.domaine}
            </Text>
          </View>
        )}
        {item.niveau_etude && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="school" size={16} color={colors.text?.secondary} />
            <Text style={{ color: colors.text?.secondary, marginLeft: 6, fontSize: 13 }}>
              Niveau: {item.niveau_etude}
            </Text>
          </View>
        )}
        {item.universite && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="domain" size={16} color={colors.text?.secondary} />
            <Text style={{ color: colors.text?.secondary, marginLeft: 6, fontSize: 13 }}>
              {item.universite}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.dossierActions}>
        <Button
          variant="primary"
          size="sm"
          icon="check"
          onPress={() => handleValider(item.id)}
          disabled={actionLoading}
          style={{ flex: 1 }}
        >
          Valider
        </Button>
        <Button
          variant="danger"
          size="sm"
          icon="close"
          onPress={() => { setSelectedDossier(item); setRejectModalVisible(true); }}
          disabled={actionLoading}
          style={{ flex: 1 }}
        >
          Rejeter
        </Button>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, padding: spacing.md }]}>
        {[1, 2, 3].map(i => (
          <View key={i} style={[styles.dossierCard, { backgroundColor: colors.surface, borderRadius: borderRadius.md, marginBottom: 12 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <SkeletonLoader.Circle size={44} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <SkeletonLoader.Rect width="60%" height={16} borderRadius={4} />
                <SkeletonLoader.Rect width="40%" height={12} borderRadius={4} style={{ marginTop: 6 }} />
              </View>
              <SkeletonLoader.Rect width={70} height={22} borderRadius={12} />
            </View>
            <View style={{ marginTop: 14 }}>
              <SkeletonLoader.Rect width="80%" height={12} borderRadius={4} style={{ marginBottom: 6 }} />
              <SkeletonLoader.Rect width="60%" height={12} borderRadius={4} />
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <SkeletonLoader.Rect width="48%" height={36} borderRadius={8} style={{ flex: 1 }} />
              <SkeletonLoader.Rect width="48%" height={36} borderRadius={8} style={{ flex: 1 }} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={dossiers}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderDossier}
        contentContainerStyle={{ padding: spacing.md }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        ListEmptyComponent={
          <EmptyState
            icon="check-circle"
            title="Tout est à jour"
            description="Aucun dossier en attente de validation"
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />

      {/* Modal Rejet */}
      <Modal visible={rejectModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderRadius: borderRadius.lg }]}>
            <Text style={[styles.modalTitle, { color: colors.text?.primary }]}>Motif du rejet</Text>
            <Text style={{ color: colors.text?.secondary, marginBottom: 12 }}>
              Prestataire: {selectedDossier?.prenom} {selectedDossier?.nom}
            </Text>
            <TextInput
              style={[styles.modalInput, { borderColor: colors.border, color: colors.text?.primary }]}
              placeholder="Expliquez le motif du rejet..."
              placeholderTextColor={colors.text?.tertiary}
              value={motifRejet}
              onChangeText={setMotifRejet}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <Button
                variant="ghost"
                onPress={() => { setRejectModalVisible(false); setMotifRejet(''); }}
                style={{ flex: 1 }}
              >
                Annuler
              </Button>
              <Button
                variant="danger"
                onPress={handleRejeter}
                loading={actionLoading}
                style={{ flex: 1 }}
              >
                Rejeter
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ============================================================
// 3. GESTION UTILISATEURS SCREEN
// ============================================================
export const GestionUtilisateursScreen = ({ navigation }) => {
  const { colors, spacing, fontSize, borderRadius } = useTheme();
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterRole, setFilterRole] = useState('tous');
  const [filterStatut, setFilterStatut] = useState('tous');
  const [suspendModalVisible, setSuspendModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [raisonSuspension, setRaisonSuspension] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadUtilisateurs = async () => {
    try {
      const filtres = {};
      if (filterRole !== 'tous') filtres.role = filterRole;
      if (filterStatut !== 'tous') filtres.statut = filterStatut;
      const res = await adminAPI.listerUtilisateurs(filtres);
      setUtilisateurs(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUtilisateurs(); }, [filterRole, filterStatut]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUtilisateurs();
    setRefreshing(false);
  };

  const handleSuspendre = async () => {
    if (!raisonSuspension.trim()) {
      Toast.show({ type: 'error', text1: 'Veuillez saisir une raison' });
      return;
    }
    setActionLoading(true);
    try {
      await adminAPI.suspendreUtilisateur(selectedUser.id, raisonSuspension);
      Toast.show({ type: 'success', text1: 'Utilisateur suspendu' });
      setSuspendModalVisible(false);
      setRaisonSuspension('');
      loadUtilisateurs();
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Erreur lors de la suspension' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactiver = async (id) => {
    Alert.alert('Confirmer', 'Réactiver cet utilisateur ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Réactiver',
        onPress: async () => {
          try {
            await adminAPI.reactiverUtilisateur(id);
            Toast.show({ type: 'success', text1: 'Utilisateur réactivé' });
            loadUtilisateurs();
          } catch (error) {
            Toast.show({ type: 'error', text1: 'Erreur lors de la réactivation' });
          }
        }
      }
    ]);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'client': return colors.secondary || '#2196F3';
      case 'prestataire': return colors.success || '#4CAF50';
      case 'admin': return ADMIN_COLOR;
      default: return '#757575';
    }
  };

  const getStatutColor = (statut) => {
    switch (statut) {
      case 'actif': return colors.success || '#4CAF50';
      case 'suspendu': return colors.error || '#F44336';
      case 'supprime': return '#757575';
      default: return '#757575';
    }
  };

  const FilterChip = ({ label, active, onPress }) => (
    <TouchableOpacity
      style={[styles.filterChip, { backgroundColor: active ? colors.primary : (colors.border || '#f0f0f0') }]}
      onPress={onPress}
    >
      <Text style={[styles.filterChipText, { color: active ? (colors.onPrimary || '#fff') : (colors.text?.secondary || '#666') }]}>{label}</Text>
    </TouchableOpacity>
  );

  const renderUser = ({ item }) => (
    <View style={[styles.userCard, { backgroundColor: colors.surface, borderRadius: borderRadius.md }]}>
      <View style={styles.userCardHeader}>
        <View style={[styles.avatar, { backgroundColor: getRoleColor(item.role) + '20' }]}>
          <MaterialCommunityIcons
            name={item.role === 'admin' ? 'shield-account' : item.role === 'prestataire' ? 'account-hard-hat' : 'account'}
            size={22}
            color={getRoleColor(item.role)}
          />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[styles.userName, { color: colors.text?.primary }]}>
            {item.prenom} {item.nom}
          </Text>
          <Text style={{ color: colors.text?.secondary, fontSize: 12 }}>
            {item.email || item.telephone}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) + '20' }]}>
            <Text style={{ color: getRoleColor(item.role), fontSize: 11, fontWeight: '600' }}>{item.role}</Text>
          </View>
          <View style={[styles.statutBadge, { backgroundColor: getStatutColor(item.statut) + '20', marginTop: 4 }]}>
            <Text style={{ color: getStatutColor(item.statut), fontSize: 10, fontWeight: '600' }}>{item.statut}</Text>
          </View>
        </View>
      </View>
      {item.role !== 'admin' && (
        <View style={[styles.userActions, { borderTopColor: colors.border }]}>
          {item.statut === 'actif' ? (
            <TouchableOpacity
              style={[styles.userActionBtn, { borderColor: colors.error || '#F44336' }]}
              onPress={() => { setSelectedUser(item); setSuspendModalVisible(true); }}
            >
              <MaterialCommunityIcons name="account-off" size={16} color={colors.error || '#F44336'} />
              <Text style={{ color: colors.error || '#F44336', marginLeft: 4, fontSize: 12, fontWeight: '600' }}>Suspendre</Text>
            </TouchableOpacity>
          ) : item.statut === 'suspendu' ? (
            <TouchableOpacity
              style={[styles.userActionBtn, { borderColor: colors.success || '#4CAF50' }]}
              onPress={() => handleReactiver(item.id)}
            >
              <MaterialCommunityIcons name="account-check" size={16} color={colors.success || '#4CAF50'} />
              <Text style={{ color: colors.success || '#4CAF50', marginLeft: 4, fontSize: 12, fontWeight: '600' }}>Réactiver</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Filtres */}
      <View style={[styles.filtersContainer, { padding: spacing.sm }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 6 }}>
          <FilterChip label="Tous" active={filterRole === 'tous'} onPress={() => setFilterRole('tous')} />
          <FilterChip label="Clients" active={filterRole === 'client'} onPress={() => setFilterRole('client')} />
          <FilterChip label="Prestataires" active={filterRole === 'prestataire'} onPress={() => setFilterRole('prestataire')} />
          <FilterChip label="Admins" active={filterRole === 'admin'} onPress={() => setFilterRole('admin')} />
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterChip label="Tous statuts" active={filterStatut === 'tous'} onPress={() => setFilterStatut('tous')} />
          <FilterChip label="Actifs" active={filterStatut === 'actif'} onPress={() => setFilterStatut('actif')} />
          <FilterChip label="Suspendus" active={filterStatut === 'suspendu'} onPress={() => setFilterStatut('suspendu')} />
        </ScrollView>
      </View>

      {loading ? (
        <View style={{ padding: spacing.md }}>
          {[1, 2, 3, 4, 5].map(i => (
            <View key={i} style={[styles.userCard, { backgroundColor: colors.surface, borderRadius: borderRadius.md, marginBottom: 10 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <SkeletonLoader.Circle size={44} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <SkeletonLoader.Rect width="50%" height={14} borderRadius={4} />
                  <SkeletonLoader.Rect width="35%" height={12} borderRadius={4} style={{ marginTop: 6 }} />
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <SkeletonLoader.Rect width={60} height={18} borderRadius={10} />
                  <SkeletonLoader.Rect width={50} height={16} borderRadius={10} style={{ marginTop: 4 }} />
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={utilisateurs}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderUser}
          contentContainerStyle={{ padding: spacing.md }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          ListEmptyComponent={
            <EmptyState
              icon="account-search"
              title="Aucun utilisateur"
              description="Aucun utilisateur trouvé avec ces filtres"
            />
          }
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}

      {/* Modal Suspension */}
      <Modal visible={suspendModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderRadius: borderRadius.lg }]}>
            <Text style={[styles.modalTitle, { color: colors.text?.primary }]}>Suspendre le compte</Text>
            <Text style={{ color: colors.text?.secondary, marginBottom: 12 }}>
              {selectedUser?.prenom} {selectedUser?.nom} ({selectedUser?.role})
            </Text>
            <TextInput
              style={[styles.modalInput, { borderColor: colors.border, color: colors.text?.primary }]}
              placeholder="Raison de la suspension..."
              placeholderTextColor={colors.text?.tertiary}
              value={raisonSuspension}
              onChangeText={setRaisonSuspension}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <Button
                variant="ghost"
                onPress={() => { setSuspendModalVisible(false); setRaisonSuspension(''); }}
                style={{ flex: 1 }}
              >
                Annuler
              </Button>
              <Button
                variant="danger"
                onPress={handleSuspendre}
                loading={actionLoading}
                style={{ flex: 1 }}
              >
                Suspendre
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ============================================================
// 4. GESTION MISSIONS SCREEN
// ============================================================
export const GestionMissionsScreen = ({ navigation }) => {
  const { colors, spacing, fontSize, borderRadius } = useTheme();
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatut, setFilterStatut] = useState('tous');
  const [actionLoading, setActionLoading] = useState(null);

  const loadMissions = async () => {
    try {
      const filtres = {};
      if (filterStatut !== 'tous') filtres.statut = filterStatut;
      const res = await adminAPI.listerMissions(filtres);
      setMissions(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Erreur chargement missions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMissions(); }, [filterStatut]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMissions();
    setRefreshing(false);
  };

  const handleSupprimer = (id) => {
    Alert.alert('Supprimer cette mission ?', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(id);
          try {
            await adminAPI.supprimerMission(id);
            Toast.show({ type: 'success', text1: 'Mission supprimée' });
            setMissions(prev => prev.filter(m => m.id !== id));
          } catch (error) {
            Toast.show({ type: 'error', text1: 'Erreur lors de la suppression' });
          } finally {
            setActionLoading(null);
          }
        }
      }
    ]);
  };

  const getStatutStyle = (statut) => {
    switch (statut) {
      case 'ouverte': return { bg: colors.statusBg?.info || '#E3F2FD', color: '#1565C0' };
      case 'en_cours': return { bg: colors.statusBg?.warning || '#FFF3E0', color: colors.warning || '#E65100' };
      case 'terminee': return { bg: colors.statusBg?.success || '#E8F5E9', color: colors.success || '#2E7D32' };
      case 'annulee': return { bg: colors.statusBg?.error || '#FFEBEE', color: colors.error || '#C62828' };
      default: return { bg: colors.border || '#F5F5F5', color: colors.text?.secondary || '#757575' };
    }
  };

  const FilterChip = ({ label, active, onPress }) => (
    <TouchableOpacity
      style={[styles.filterChip, { backgroundColor: active ? colors.primary : (colors.border || '#f0f0f0') }]}
      onPress={onPress}
    >
      <Text style={[styles.filterChipText, { color: active ? (colors.onPrimary || '#fff') : (colors.text?.secondary || '#666') }]}>{label}</Text>
    </TouchableOpacity>
  );

  const renderMission = ({ item }) => {
    const statutStyle = getStatutStyle(item.statut);
    return (
      <View style={[styles.missionCard, { backgroundColor: colors.surface, borderRadius: borderRadius.md }]}>
        <View style={styles.missionCardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.missionTitle, { color: colors.text?.primary }]} numberOfLines={1}>
              {item.titre}
            </Text>
            <Text style={{ color: colors.text?.secondary, fontSize: 12, marginTop: 2 }}>
              Par {item.client_prenom || 'Client'} {item.client_nom || ''} - {item.ville || 'N/A'}
            </Text>
          </View>
          <View style={[styles.statutBadge, { backgroundColor: statutStyle.bg }]}>
            <Text style={{ color: statutStyle.color, fontSize: 11, fontWeight: '600' }}>{item.statut}</Text>
          </View>
        </View>

        <View style={styles.missionMeta}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="cash" size={14} color={colors.text?.secondary} />
            <Text style={{ color: colors.text?.secondary, marginLeft: 4, fontSize: 12 }}>
              {Number(item.budget).toLocaleString()} FCFA
            </Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="account-group" size={14} color={colors.text?.secondary} />
            <Text style={{ color: colors.text?.secondary, marginLeft: 4, fontSize: 12 }}>
              {item.nombre_candidatures || 0} candidatures
            </Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="calendar" size={14} color={colors.text?.secondary} />
            <Text style={{ color: colors.text?.secondary, marginLeft: 4, fontSize: 12 }}>
              {item.date_creation ? new Date(item.date_creation).toLocaleDateString('fr-FR') : 'N/A'}
            </Text>
          </View>
        </View>

        <View style={[styles.missionActions, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={styles.missionActionBtn}
            onPress={() => handleSupprimer(item.id)}
            disabled={actionLoading === item.id}
            activeOpacity={0.6}
          >
            <MaterialCommunityIcons name="delete" size={16} color={colors.error} />
            <Text style={{ color: colors.error, marginLeft: 4, fontSize: 12, fontWeight: '600' }}>
              {actionLoading === item.id ? 'Suppression...' : 'Supprimer'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 50, padding: spacing.sm }}>
        <FilterChip label="Toutes" active={filterStatut === 'tous'} onPress={() => setFilterStatut('tous')} />
        <FilterChip label="Ouvertes" active={filterStatut === 'ouverte'} onPress={() => setFilterStatut('ouverte')} />
        <FilterChip label="En cours" active={filterStatut === 'en_cours'} onPress={() => setFilterStatut('en_cours')} />
        <FilterChip label="Terminées" active={filterStatut === 'terminee'} onPress={() => setFilterStatut('terminee')} />
        <FilterChip label="Annulées" active={filterStatut === 'annulee'} onPress={() => setFilterStatut('annulee')} />
      </ScrollView>

      {loading ? (
        <View style={{ padding: spacing.md }}>
          {[1, 2, 3, 4, 5].map(i => (
            <View key={i} style={[styles.missionCard, { backgroundColor: colors.surface, borderRadius: borderRadius.md, marginBottom: 10 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <SkeletonLoader.Rect width="70%" height={16} borderRadius={4} />
                  <SkeletonLoader.Rect width="50%" height={12} borderRadius={4} style={{ marginTop: 6 }} />
                </View>
                <SkeletonLoader.Rect width={65} height={22} borderRadius={10} />
              </View>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                <SkeletonLoader.Rect width={80} height={12} borderRadius={4} />
                <SkeletonLoader.Rect width={90} height={12} borderRadius={4} />
                <SkeletonLoader.Rect width={70} height={12} borderRadius={4} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={missions}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderMission}
          contentContainerStyle={{ padding: spacing.md }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          ListEmptyComponent={
            <EmptyState
              icon="briefcase-off"
              title="Aucune mission"
              description="Aucune mission trouvée avec ces filtres"
            />
          }
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}
    </View>
  );
};

// ============================================================
// 5. STATISTIQUES SCREEN
// ============================================================
export const StatistiquesScreen = () => {
  const { colors, spacing, fontSize, borderRadius } = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    try {
      const res = await adminAPI.obtenirStatistiques();
      setStats(res.data);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStats(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, padding: spacing.md }]}>
        <SkeletonLoader.Rect width="100%" height={120} borderRadius={borderRadius.md} style={{ marginBottom: 16 }} />
        {[1, 2, 3, 4].map(i => (
          <View key={i} style={[styles.statsSection, { backgroundColor: colors.surface, borderRadius: borderRadius.md, marginBottom: 12 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
              <SkeletonLoader.Circle size={20} />
              <SkeletonLoader.Rect width={120} height={16} borderRadius={4} style={{ marginLeft: 8 }} />
            </View>
            {[1, 2, 3].map(j => (
              <View key={j} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                <SkeletonLoader.Rect width="40%" height={14} borderRadius={4} />
                <SkeletonLoader.Rect width={40} height={14} borderRadius={4} />
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  }

  const utilisateurs = stats?.utilisateurs || {};
  const missions = stats?.missions || {};
  const candidatures = stats?.candidatures || {};
  const prestataires = stats?.prestataires || {};
  const revenus = stats?.revenus || {};

  const Section = ({ title, icon, children }) => (
    <View style={[styles.statsSection, { backgroundColor: colors.surface, borderRadius: borderRadius.md }]}>
      <View style={styles.statsSectionHeader}>
        <MaterialCommunityIcons name={icon} size={20} color={colors.primary} />
        <Text style={[styles.statsSectionTitle, { color: colors.text?.primary }]}>{title}</Text>
      </View>
      {children}
    </View>
  );

  const StatRow = ({ label, value, color }) => (
    <View style={[styles.statRow, { borderBottomColor: colors.border || '#f0f0f0' }]}>
      <View style={styles.statRowLeft}>
        {color && <View style={[styles.statDot, { backgroundColor: color }]} />}
        <Text style={{ color: colors.text?.secondary, fontSize: 14 }}>{label}</Text>
      </View>
      <Text style={{ color: colors.text?.primary, fontWeight: '700', fontSize: 15 }}>{value ?? 0}</Text>
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: spacing.md }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
    >
      {/* Revenus */}
      <View style={[styles.revenueCard, { backgroundColor: ADMIN_COLOR, borderRadius: borderRadius.md }]}>
        <MaterialCommunityIcons name="cash-multiple" size={32} color="#fff" />
        <Text style={styles.revenueLabel}>Revenus totaux</Text>
        <Text style={styles.revenueValue}>{Number(revenus.total || 0).toLocaleString()} FCFA</Text>
      </View>

      {/* Utilisateurs */}
      <Section title="Utilisateurs" icon="account-group">
        <StatRow label="Total" value={utilisateurs.total} />
        <StatRow label="Clients" value={utilisateurs.clients} color={colors.secondary || '#2196F3'} />
        <StatRow label="Prestataires" value={utilisateurs.prestataires} color={colors.success || '#4CAF50'} />
        <StatRow label="Administrateurs" value={utilisateurs.admins} color={ADMIN_COLOR} />
      </Section>

      {/* Missions */}
      <Section title="Missions" icon="briefcase">
        <StatRow label="Total" value={missions.total} />
        <StatRow label="Ouvertes" value={missions.ouvertes} color={colors.secondary || '#2196F3'} />
        <StatRow label="En cours" value={missions.en_cours} color={colors.warning || '#FF9800'} />
        <StatRow label="Terminées" value={missions.terminees} color={colors.success || '#4CAF50'} />
        <StatRow label="Annulées" value={missions.annulees} color={colors.error || '#F44336'} />
      </Section>

      {/* Candidatures */}
      <Section title="Candidatures" icon="file-document-multiple">
        <StatRow label="Total" value={candidatures.total} />
        <StatRow label="En attente" value={candidatures.en_attente} color={colors.warning || '#FF9800'} />
        <StatRow label="Acceptées" value={candidatures.acceptees} color={colors.success || '#4CAF50'} />
        <StatRow label="Refusées" value={candidatures.refusees} color={colors.error || '#F44336'} />
      </Section>

      {/* Prestataires */}
      <Section title="Validation prestataires" icon="account-check">
        <StatRow label="En attente" value={prestataires.en_attente} color={colors.warning || '#FF9800'} />
        <StatRow label="Validés" value={prestataires.valides} color={colors.success || '#4CAF50'} />
        <StatRow label="Rejetés" value={prestataires.rejetes} color={colors.error || '#F44336'} />
      </Section>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
};

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Dashboard
  dashboardHeader: {
    padding: 24,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dashboardGreeting: { color: '#ffffff90', fontSize: 14 },
  dashboardName: { color: '#fff', fontSize: 22, fontWeight: '700', marginTop: 4 },

  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '45%',
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: { fontWeight: '700' },
  statLabel: { marginTop: 2, textAlign: 'center' },

  sectionTitle: { fontSize: 17, fontWeight: '700', marginTop: 16, marginBottom: 8 },

  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  quickActionText: { flex: 1, marginLeft: 12, fontWeight: '600', fontSize: 15 },

  breakdownContainer: { padding: 16 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  breakdownDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  breakdownLabel: { width: 90, fontSize: 13 },
  breakdownValue: { width: 30, fontWeight: '600', fontSize: 13 },
  breakdownBarBg: { flex: 1, height: 6, borderRadius: 3, marginHorizontal: 8 },
  breakdownBar: { height: 6, borderRadius: 3 },
  breakdownPct: { width: 35, textAlign: 'right', fontSize: 12 },

  // Dossiers
  dossierCard: {
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  dossierHeader: { flexDirection: 'row', alignItems: 'center' },
  dossierName: { fontWeight: '700', fontSize: 15 },
  dossierInfo: { marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  dossierActions: { flexDirection: 'row', gap: 10, marginTop: 14 },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },

  // Users
  userCard: {
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  userCardHeader: { flexDirection: 'row', alignItems: 'center' },
  userName: { fontWeight: '600', fontSize: 14 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  statutBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  userActions: { flexDirection: 'row', marginTop: 10, paddingTop: 10, borderTopWidth: 1 },
  userActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
    borderWidth: 1,
  },

  // Filters
  filtersContainer: {},
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  filterChipText: { fontSize: 13, fontWeight: '500' },

  // Missions
  missionCard: {
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  missionCardHeader: { flexDirection: 'row', alignItems: 'center' },
  missionTitle: { fontWeight: '600', fontSize: 15 },
  missionMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  missionActions: { flexDirection: 'row', marginTop: 12, paddingTop: 10, borderTopWidth: 1 },
  missionActionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },

  // Statistiques
  revenueCard: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  revenueLabel: { color: '#ffffff90', fontSize: 14, marginTop: 8 },
  revenueValue: { color: '#fff', fontSize: 28, fontWeight: '700', marginTop: 4 },

  statsSection: {
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  statsSectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  statsSectionTitle: { fontWeight: '700', fontSize: 16, marginLeft: 8 },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
  },
  statRowLeft: { flexDirection: 'row', alignItems: 'center' },
  statDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    padding: 24,
    paddingBottom: 34,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    minHeight: 100,
    fontSize: 14,
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
});
