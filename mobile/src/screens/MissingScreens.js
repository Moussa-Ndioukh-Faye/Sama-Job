/**
 * Écrans manquants - SamaJob
 * Déposer Dossier, Notifications, Évaluation
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { prestataireAPI, notificationAPI, missionAPI } from '../services/api';
import Toast from 'react-native-toast-message';
import { Button, FormInput, SkeletonLoader, EmptyState } from '../components';

// ============================================================
// 1. DÉPOSER DOSSIER SCREEN (Prestataire)
// ============================================================
export const DeposerDossierScreen = ({ navigation }) => {
  const { colors, spacing, fontSize, borderRadius } = useTheme();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dossier, setDossier] = useState(null);

  const [formData, setFormData] = useState({
    domaine: '',
    niveau_etude: '',
    universite: '',
    carte_etudiant: '',
    cv: '',
  });

  const NIVEAUX = ['Bac', 'Bac+1', 'Bac+2', 'Bac+3', 'Licence', 'Master 1', 'Master 2', 'Doctorat', 'Autre'];

  const DOMAINES = [
    'Informatique', 'Plomberie', 'Électricité', 'Menuiserie',
    'Peinture', 'Jardinage', 'Nettoyage', 'Mécanique',
    'Comptabilité', 'Marketing', 'Design', 'Autre',
  ];

  useEffect(() => {
    loadDossier();
  }, []);

  const loadDossier = async () => {
    try {
      const res = await prestataireAPI.obtenirDossier();
      if (res.data) {
        setDossier(res.data);
        setFormData({
          domaine: res.data.domaine || '',
          niveau_etude: res.data.niveau_etude || '',
          universite: res.data.universite || '',
          carte_etudiant: res.data.carte_etudiant || '',
          cv: res.data.cv || '',
        });
      }
    } catch (error) {
      // Pas de dossier existant
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.domaine) {
      Toast.show({ type: 'error', text1: 'Veuillez sélectionner un domaine' });
      return;
    }
    if (!formData.niveau_etude) {
      Toast.show({ type: 'error', text1: 'Veuillez sélectionner un niveau d\'étude' });
      return;
    }

    setSubmitting(true);
    try {
      await prestataireAPI.deposerDossier(formData);
      Toast.show({ type: 'success', text1: 'Dossier déposé', text2: 'Votre dossier est en attente de validation' });
      navigation.goBack();
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: error.response?.data?.message || 'Impossible de déposer le dossier' });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatutBadge = () => {
    if (!dossier) return null;
    const statut = dossier.statut_validation;
    const config = {
      en_attente: { bg: colors.statusBg?.warning || '#FFF3E0', color: colors.warning, label: 'En attente de validation', icon: 'clock-outline' },
      valide: { bg: colors.statusBg?.success || '#E8F5E9', color: colors.success, label: 'Dossier validé', icon: 'check-circle' },
      rejete: { bg: colors.statusBg?.error || '#FFEBEE', color: colors.error, label: 'Dossier rejeté', icon: 'close-circle' },
    };
    const c = config[statut] || config.en_attente;
    return (
      <View style={[styles.statutBanner, { backgroundColor: c.bg, borderRadius: borderRadius.md }]}>
        <MaterialCommunityIcons name={c.icon} size={22} color={c.color} />
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text style={{ color: c.color, fontWeight: '700', fontSize: 14 }}>{c.label}</Text>
          {statut === 'rejete' && dossier.motif_rejet && (
            <Text style={{ color: c.color, fontSize: 12, marginTop: 4 }}>Motif : {dossier.motif_rejet}</Text>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: spacing.md }}>
        <SkeletonLoader.Rect width="70%" height={24} borderRadius={4} />
        <SkeletonLoader.Rect width="100%" height={16} borderRadius={4} style={{ marginTop: 8 }} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 24 }}>
          {[1,2,3,4,5,6].map(i => (
            <SkeletonLoader.Rect key={i} width={90} height={36} borderRadius={20} />
          ))}
        </View>
        <SkeletonLoader.Rect width="40%" height={16} borderRadius={4} style={{ marginTop: 24 }} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {[1,2,3,4,5].map(i => (
            <SkeletonLoader.Rect key={i} width={70} height={36} borderRadius={20} />
          ))}
        </View>
        <SkeletonLoader.Rect width="100%" height={48} borderRadius={8} style={{ marginTop: 24 }} />
        <SkeletonLoader.Rect width="100%" height={48} borderRadius={8} style={{ marginTop: 16 }} />
        <SkeletonLoader.Rect width="100%" height={48} borderRadius={8} style={{ marginTop: 16 }} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: spacing.md }}>
      <Text style={[styles.screenTitle, { color: colors.text?.primary || '#333' }]}>Mon dossier prestataire</Text>
      <Text style={{ color: colors.text?.secondary || '#666', marginBottom: 16 }}>
        Déposez votre dossier pour être validé et pouvoir postuler aux missions.
      </Text>

      {getStatutBadge()}

      {/* Domaine */}
      <Text style={[styles.label, { color: colors.text?.primary || '#333' }]}>Domaine d'expertise *</Text>
      <View style={styles.chipGrid}>
        {DOMAINES.map((d) => (
          <TouchableOpacity
            key={d}
            style={[
              styles.chip,
              {
                backgroundColor: formData.domaine === d ? colors.primary : colors.surface,
                borderColor: formData.domaine === d ? colors.primary : colors.border,
                borderRadius: borderRadius.full || 20,
              },
            ]}
            onPress={() => setFormData({ ...formData, domaine: d })}
            activeOpacity={0.7}
          >
            <Text style={{ color: formData.domaine === d ? colors.onPrimary : colors.text?.primary || '#333', fontSize: 13 }}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Niveau d'étude */}
      <Text style={[styles.label, { color: colors.text?.primary || '#333', marginTop: 16 }]}>Niveau d'étude *</Text>
      <View style={styles.chipGrid}>
        {NIVEAUX.map((n) => (
          <TouchableOpacity
            key={n}
            style={[
              styles.chip,
              {
                backgroundColor: formData.niveau_etude === n ? colors.primary : colors.surface,
                borderColor: formData.niveau_etude === n ? colors.primary : colors.border,
                borderRadius: borderRadius.full || 20,
              },
            ]}
            onPress={() => setFormData({ ...formData, niveau_etude: n })}
            activeOpacity={0.7}
          >
            <Text style={{ color: formData.niveau_etude === n ? colors.onPrimary : colors.text?.primary || '#333', fontSize: 13 }}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Université */}
      <View style={{ marginTop: 16 }}>
        <FormInput
          label="Université / École"
          placeholder="Ex: Université Cheikh Anta Diop"
          value={formData.universite}
          onChangeText={(t) => setFormData({ ...formData, universite: t })}
          leftIcon="school"
        />
      </View>

      {/* Carte étudiant URL */}
      <FormInput
        label="Carte étudiant (lien ou référence)"
        placeholder="Lien vers votre carte étudiant"
        value={formData.carte_etudiant}
        onChangeText={(t) => setFormData({ ...formData, carte_etudiant: t })}
        leftIcon="card-account-details"
      />

      {/* CV URL */}
      <FormInput
        label="CV (lien ou référence)"
        placeholder="Lien vers votre CV"
        value={formData.cv}
        onChangeText={(t) => setFormData({ ...formData, cv: t })}
        leftIcon="file-document"
      />

      {/* Submit */}
      <Button
        variant="primary"
        size="lg"
        onPress={handleSubmit}
        loading={submitting}
        disabled={submitting}
        fullWidth
        style={{ marginTop: 8 }}
      >
        {dossier ? 'Mettre à jour le dossier' : 'Déposer le dossier'}
      </Button>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

// ============================================================
// 2. NOTIFICATIONS SCREEN
// ============================================================
export const NotificationsScreen = () => {
  const { colors, spacing, borderRadius } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = async () => {
    try {
      const res = await notificationAPI.obtenirNotifications();
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadNotifications(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationAPI.marquerCommeLue(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, lue: true } : n));
    } catch (error) {
      console.error('Erreur marquage notification:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.marquerToutesLues();
      setNotifications(prev => prev.map(n => ({ ...n, lue: true })));
      Toast.show({ type: 'success', text1: 'Toutes les notifications marquées comme lues' });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Erreur' });
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'mission': return { name: 'briefcase', color: colors.success };
      case 'candidature': return { name: 'file-document', color: colors.secondary };
      case 'message': return { name: 'chat', color: '#9C27B0' };
      case 'validation': return { name: 'check-decagram', color: colors.warning };
      case 'evaluation': return { name: 'star', color: colors.warning };
      default: return { name: 'bell', color: colors.text?.tertiary || '#757575' };
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "À l'instant";
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `Il y a ${diffH}h`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `Il y a ${diffD}j`;
    return d.toLocaleDateString('fr-FR');
  };

  const unreadCount = notifications.filter(n => !n.lue).length;

  const renderNotification = ({ item }) => {
    const icon = getTypeIcon(item.type);
    return (
      <TouchableOpacity
        style={[
          styles.notifCard,
          {
            backgroundColor: item.lue ? colors.surface : (colors.primary + '08'),
            borderRadius: borderRadius.md || 8,
            borderLeftColor: item.lue ? 'transparent' : colors.primary,
            borderLeftWidth: item.lue ? 0 : 3,
          },
        ]}
        onPress={() => !item.lue && handleMarkRead(item.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.notifIcon, { backgroundColor: icon.color + '15' }]}>
          <MaterialCommunityIcons name={icon.name} size={22} color={icon.color} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.notifTitle, { color: colors.text?.primary || '#333', fontWeight: item.lue ? '400' : '700' }]}>
            {item.titre}
          </Text>
          <Text style={{ color: colors.text?.secondary || '#666', fontSize: 13, marginTop: 2 }} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={{ color: colors.text?.tertiary || '#999', fontSize: 11, marginTop: 4 }}>
            {formatDate(item.date_creation)}
          </Text>
        </View>
        {!item.lue && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ padding: spacing.md }}>
          {[1,2,3,4,5].map(i => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <SkeletonLoader.Circle size={42} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <SkeletonLoader.Rect width="60%" height={16} borderRadius={4} />
                <SkeletonLoader.Rect width="90%" height={14} borderRadius={4} style={{ marginTop: 6 }} />
                <SkeletonLoader.Rect width="30%" height={12} borderRadius={4} style={{ marginTop: 6 }} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {unreadCount > 0 && (
        <TouchableOpacity
          style={[styles.markAllBtn, { borderBottomColor: colors.border }]}
          onPress={handleMarkAllRead}
        >
          <MaterialCommunityIcons name="check-all" size={18} color={colors.primary} />
          <Text style={{ color: colors.primary, marginLeft: 6, fontWeight: '600', fontSize: 13 }}>
            Tout marquer comme lu ({unreadCount})
          </Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderNotification}
        contentContainerStyle={{ padding: spacing.md }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        ListEmptyComponent={
          <EmptyState
            icon="bell-off-outline"
            title="Aucune notification"
            description="Vous recevrez des notifications pour vos missions, candidatures et messages."
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
    </View>
  );
};

// ============================================================
// 3. ÉVALUATION SCREEN (Client évalue prestataire)
// ============================================================
export const EvaluationScreen = ({ route, navigation }) => {
  const { colors, spacing, borderRadius } = useTheme();
  const { missionId, prestataireName } = route.params || {};
  const [submitting, setSubmitting] = useState(false);

  const [evaluation, setEvaluation] = useState({
    note: 0,
    commentaire: '',
    qualite: 0,
    communication: 0,
    ponctualite: 0,
    professionnalisme: 0,
  });

  const StarRating = ({ value, onChange, label }) => (
    <View style={{ marginBottom: 16 }}>
      <Text style={[styles.label, { color: colors.text?.primary || '#333' }]}>{label}</Text>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => onChange(star)} activeOpacity={0.6}>
            <MaterialCommunityIcons
              name={star <= value ? 'star' : 'star-outline'}
              size={36}
              color={star <= value ? colors.warning : colors.border}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const handleSubmit = async () => {
    if (evaluation.note === 0) {
      Toast.show({ type: 'error', text1: 'Veuillez donner une note globale' });
      return;
    }
    if (!evaluation.commentaire.trim()) {
      Toast.show({ type: 'error', text1: 'Veuillez laisser un commentaire' });
      return;
    }

    setSubmitting(true);
    try {
      await missionAPI.evaluerPrestataire(missionId, {
        note: evaluation.note,
        commentaire: evaluation.commentaire.trim(),
        qualite: evaluation.qualite || evaluation.note,
        communication: evaluation.communication || evaluation.note,
        ponctualite: evaluation.ponctualite || evaluation.note,
        professionnalisme: evaluation.professionnalisme || evaluation.note,
      });
      Toast.show({ type: 'success', text1: 'Merci !', text2: 'Votre évaluation a été enregistrée' });
      navigation.goBack();
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: error.response?.data?.message || 'Impossible d\'enregistrer l\'évaluation' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: spacing.md }}
    >
      <Text style={[styles.screenTitle, { color: colors.text?.primary || '#333' }]}>Évaluer le prestataire</Text>
      {prestataireName && (
        <Text style={{ color: colors.text?.secondary || '#666', marginBottom: 20, fontSize: 15 }}>
          {prestataireName}
        </Text>
      )}

      <StarRating
        value={evaluation.note}
        onChange={(v) => setEvaluation({ ...evaluation, note: v })}
        label="Note globale *"
      />

      <Text style={[styles.sectionLabel, { color: colors.text?.primary || '#333' }]}>Critères détaillés (optionnel)</Text>

      <StarRating
        value={evaluation.qualite}
        onChange={(v) => setEvaluation({ ...evaluation, qualite: v })}
        label="Qualité du travail"
      />
      <StarRating
        value={evaluation.communication}
        onChange={(v) => setEvaluation({ ...evaluation, communication: v })}
        label="Communication"
      />
      <StarRating
        value={evaluation.ponctualite}
        onChange={(v) => setEvaluation({ ...evaluation, ponctualite: v })}
        label="Ponctualité"
      />
      <StarRating
        value={evaluation.professionnalisme}
        onChange={(v) => setEvaluation({ ...evaluation, professionnalisme: v })}
        label="Professionnalisme"
      />

      <FormInput
        label="Commentaire *"
        placeholder="Partagez votre expérience avec ce prestataire..."
        value={evaluation.commentaire}
        onChangeText={(t) => setEvaluation({ ...evaluation, commentaire: t })}
        multiline
        numberOfLines={5}
        leftIcon="comment-text"
      />

      <Button
        variant="primary"
        size="lg"
        onPress={handleSubmit}
        loading={submitting}
        disabled={submitting}
        fullWidth
        icon="send"
      >
        Envoyer l'évaluation
      </Button>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  screenTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  sectionLabel: { fontSize: 16, fontWeight: '700', marginBottom: 12, marginTop: 8 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
  },

  statutBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 20,
  },

  // Notifications
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  notifIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifTitle: { fontSize: 14 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
});
