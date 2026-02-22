// NOTE : Tous les montants de mission (client, prestataire, admin) doivent être affichés et saisis en Franc CFA (FCFA)
/**
 * Écran d'Inscription - MODERNISÉ EN WIZARD 3 ÉTAPES
 * Wizard fluide avec animations et meilleur UX
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useForm } from '../hooks';
import { FormInput, Button, StepIndicator } from '../components';
import { SlideInUpView, FadeInView } from '../components/FadeInView';

const InscriptionScreen = ({ navigation }) => {
  const { inscription } = useAuth();
  const { colors, spacing, fontSize, borderRadius, elevation, typography } = useTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const [role, setRole] = useState('prestataire');

  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useForm({
    initialValues: {
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      motDePasse: '',
      confirmPassword: '',
      entreprise: '',
      domaine: '',
    },
    validationRules: {
      nom: {
        required: true,
        minLength: 2,
        requiredMessage: 'Nom requis',
        minLengthMessage: 'Nom trop court',
      },
      prenom: {
        required: true,
        minLength: 2,
        requiredMessage: 'Prénom requis',
        minLengthMessage: 'Prénom trop court',
      },
      email: {
        required: true,
        email: true,
        requiredMessage: 'Email requis',
        emailMessage: 'Email invalide',
      },
      telephone: {
        required: true,
        requiredMessage: 'Téléphone requis',
        // La validation du format est faite dans validateStep (avec normalisation des espaces)
      },
      motDePasse: {
        required: true,
        minLength: 8,
        requiredMessage: 'Mot de passe requis',
        minLengthMessage: 'Minimum 8 caractères',
      },
      confirmPassword: {
        required: true,
        requiredMessage: 'Confirmation requise',
      },
      entreprise: {
        required: role === 'client',
        requiredMessage: 'Entreprise requise',
      },
      domaine: {
        required: role === 'prestataire',
        requiredMessage: 'Domaine requis',
      },
    },
    validateOnBlur: true,
    onSubmit: async (formValues) => {
      // Normaliser le téléphone avant envoi (supprimer espaces/tirets)
      const phoneNorm = (formValues.telephone || '').replace(/[\s\-\(\)]/g, '');
      const userData = {
        nom: formValues.nom,
        prenom: formValues.prenom,
        email: formValues.email,
        telephone: phoneNorm,
        motDePasse: formValues.motDePasse,
        role,
        ...(role === 'client' && { entreprise: formValues.entreprise }),
        ...(role === 'prestataire' && { domaine: formValues.domaine }),
      };

      const result = await inscription(userData);

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Inscription réussie',
          text2: 'Bienvenue sur SamaJob !',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Erreur',
          text2: result.error || 'Erreur lors de l\'inscription',
        });
      }
    },
  });

  const DOMAINES = [
    { id: 'informatique', label: 'Informatique', icon: 'laptop' },
    { id: 'plomberie', label: 'Plomberie', icon: 'pipe' },
    { id: 'electricite', label: 'Électricité', icon: 'flash' },
    { id: 'menuiserie', label: 'Menuiserie', icon: 'tools' },
    { id: 'peinture', label: 'Peinture', icon: 'palette' },
    { id: 'jardinage', label: 'Jardinage', icon: 'leaf' },
    { id: 'nettoyage', label: 'Nettoyage', icon: 'spray-bottle' },
    { id: 'mecanique', label: 'Mécanique', icon: 'wrench' },
    { id: 'comptabilite', label: 'Comptabilité', icon: 'calculator' },
    { id: 'marketing', label: 'Marketing', icon: 'chart-line' },
    { id: 'design', label: 'Design', icon: 'palette' },
    { id: 'autre', label: 'Autre', icon: 'help-circle' },
  ];

  // Normalise un numéro de téléphone : supprime espaces, tirets, parenthèses
  const normalizePhone = (phone) => (phone || '').replace(/[\s\-\(\)]/g, '');

  const validateStep = (step) => {
    let fieldsToValidate = [];

    switch (step) {
      case 1:
        fieldsToValidate = ['nom', 'prenom'];
        break;
      case 2:
        fieldsToValidate = ['email', 'telephone'];
        break;
      case 3:
        fieldsToValidate = ['motDePasse', 'confirmPassword'];
        if (role === 'client') fieldsToValidate.push('entreprise');
        if (role === 'prestataire') fieldsToValidate.push('domaine');
        break;
    }

    // Marquer tous les champs comme touchés pour afficher les erreurs dans l'UI
    fieldsToValidate.forEach((field) => handleBlur(field));

    // Valider directement depuis `values` (pas depuis `errors` qui est stale après setState)
    const isEmpty = (v) => !v || v.toString().trim() === '';

    for (const field of fieldsToValidate) {
      if (isEmpty(values[field])) return false;
    }

    // Validations spécifiques par étape
    if (step === 1) {
      if (values.nom.trim().length < 2 || values.prenom.trim().length < 2) return false;
    }

    if (step === 2) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(values.email)) return false;

      // Normaliser le téléphone (accepte les espaces : +221 77 123 45 67)
      const phoneNorm = normalizePhone(values.telephone);
      const phoneRegex = /^(\+221)?[0-9]{9}$/;
      if (!phoneRegex.test(phoneNorm)) {
        Toast.show({
          type: 'error',
          text1: 'Numéro invalide',
          text2: 'Format accepté : +221XXXXXXXXX ou 9 chiffres',
        });
        return false;
      }
    }

    if (step === 3) {
      if (values.motDePasse.length < 8) return false;
      // Le backend exige au moins 1 majuscule, 1 minuscule et 1 chiffre
      const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
      if (!pwdRegex.test(values.motDePasse)) {
        Toast.show({
          type: 'error',
          text1: 'Mot de passe trop faible',
          text2: 'Il doit contenir au moins 1 majuscule, 1 minuscule et 1 chiffre',
        });
        return false;
      }
      if (values.motDePasse !== values.confirmPassword) {
        Toast.show({
          type: 'error',
          text1: 'Mots de passe différents',
          text2: 'La confirmation ne correspond pas au mot de passe',
        });
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    } else {
      Toast.show({
        type: 'error',
        text1: 'Champs invalides',
        text2: 'Veuillez remplir tous les champs correctement',
      });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    if (selectedRole === 'client') {
      handleChange('domaine', '');
    } else {
      handleChange('entreprise', '');
    }
  };

  const renderStep1 = () => (
    <SlideInUpView duration={500} delay={100}>
      <View>
        <Text style={[styles.stepTitle, { color: colors.text.primary, ...typography.h3 }]}>
          Créez votre compte
        </Text>
        <Text style={[styles.stepSubtitle, { color: colors.text.secondary }]}>
          Êtes-vous un client ou un prestataire ?
        </Text>

        <View style={styles.roleContainer}>
          {[
            { id: 'prestataire', label: 'Je suis Prestataire', icon: 'briefcase', desc: 'Je vends mes services' },
            { id: 'client', label: 'Je suis Client', icon: 'shopping', desc: 'Je cherche des services' },
          ].map((r) => (
            <TouchableOpacity
              key={r.id}
              style={[
                styles.roleCard,
                {
                  backgroundColor: role === r.id ? colors.primary : colors.surface,
                  borderColor: role === r.id ? colors.primary : colors.border,
                  borderWidth: 2,
                },
              ]}
              onPress={() => handleRoleSelect(r.id)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={r.icon}
                size={32}
                color={role === r.id ? '#FFFFFF' : colors.primary}
                style={{ marginBottom: spacing.sm }}
              />
              <Text style={[styles.roleLabel, { color: role === r.id ? '#FFFFFF' : colors.text.primary }]}>
                {r.label}
              </Text>
              <Text style={[styles.roleDesc, { color: role === r.id ? 'rgba(255,255,255,0.8)' : colors.text.secondary }]}>
                {r.desc}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ marginTop: spacing.lg }}>
          <FormInput
            label="Nom"
            placeholder="Votre nom"
            value={values.nom}
            onChangeText={(text) => handleChange('nom', text)}
            onBlur={() => handleBlur('nom')}
            error={touched.nom ? errors.nom : null}
            leftIcon="account-outline"
            required
          />

          <FormInput
            label="Prénom"
            placeholder="Votre prénom"
            value={values.prenom}
            onChangeText={(text) => handleChange('prenom', text)}
            onBlur={() => handleBlur('prenom')}
            error={touched.prenom ? errors.prenom : null}
            leftIcon="account-outline"
            required
          />
        </View>
      </View>
    </SlideInUpView>
  );

  const renderStep2 = () => (
    <SlideInUpView duration={500} delay={100}>
      <View>
        <Text style={[styles.stepTitle, { color: colors.text.primary, ...typography.h3 }]}>
          Vos coordonnées
        </Text>
        <Text style={[styles.stepSubtitle, { color: colors.text.secondary }]}>
          Comment pouvons-nous vous contacter ?
        </Text>

        <FormInput
          label="Adresse email"
          placeholder="exemple@email.com"
          value={values.email}
          onChangeText={(text) => handleChange('email', text)}
          onBlur={() => handleBlur('email')}
          error={touched.email ? errors.email : null}
          keyboardType="email-address"
          autoCapitalize="none"
          leftIcon="email-outline"
          required
        />

        <FormInput
          label="Numéro de téléphone"
          placeholder="+221 77 123 45 67"
          value={values.telephone}
          onChangeText={(text) => handleChange('telephone', text)}
          onBlur={() => handleBlur('telephone')}
          error={touched.telephone ? errors.telephone : null}
          keyboardType="phone-pad"
          leftIcon="phone-outline"
          required
        />
      </View>
    </SlideInUpView>
  );

  const renderStep3 = () => (
    <SlideInUpView duration={500} delay={100}>
      <View>
        <Text style={[styles.stepTitle, { color: colors.text.primary, ...typography.h3 }]}>
          Finalisez votre profil
        </Text>
        <Text style={[styles.stepSubtitle, { color: colors.text.secondary }]}>
          Créez un mot de passe sécurisé
        </Text>

        <FormInput
          label="Mot de passe"
          placeholder="••••••••"
          value={values.motDePasse}
          onChangeText={(text) => handleChange('motDePasse', text)}
          onBlur={() => handleBlur('motDePasse')}
          error={touched.motDePasse ? errors.motDePasse : null}
          secureTextEntry
          showPasswordToggle
          showStrength
          leftIcon="lock-outline"
          required
        />
        {values.motDePasse.length > 0 && (
          <View style={{ marginTop: -8, marginBottom: 12, paddingHorizontal: 4 }}>
            {[
              { ok: values.motDePasse.length >= 8, label: '8 caractères minimum' },
              { ok: /[A-Z]/.test(values.motDePasse), label: '1 majuscule' },
              { ok: /[a-z]/.test(values.motDePasse), label: '1 minuscule' },
              { ok: /\d/.test(values.motDePasse), label: '1 chiffre' },
            ].map((rule) => (
              <View key={rule.label} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                <MaterialCommunityIcons
                  name={rule.ok ? 'check-circle' : 'circle-outline'}
                  size={14}
                  color={rule.ok ? colors.success || '#4CAF50' : colors.text.tertiary}
                  style={{ marginRight: 6 }}
                />
                <Text style={{ fontSize: 12, color: rule.ok ? colors.success || '#4CAF50' : colors.text.tertiary }}>
                  {rule.label}
                </Text>
              </View>
            ))}
          </View>
        )}

        <FormInput
          label="Confirmer le mot de passe"
          placeholder="••••••••"
          value={values.confirmPassword}
          onChangeText={(text) => handleChange('confirmPassword', text)}
          onBlur={() => handleBlur('confirmPassword')}
          error={touched.confirmPassword ? errors.confirmPassword : null}
          secureTextEntry
          leftIcon="lock-check-outline"
          required
        />

        {role === 'prestataire' ? (
          <View style={{ marginTop: spacing.lg }}>
            <Text style={[styles.sectionLabel, { color: colors.text.primary }]}>
              Sélectionnez votre domaine
            </Text>
            <View style={styles.domaineGrid}>
              {DOMAINES.map((d) => (
                <TouchableOpacity
                  key={d.id}
                  style={[
                    styles.domaineCard,
                    {
                      backgroundColor: values.domaine === d.id ? colors.primary : colors.surface,
                      borderColor: colors.border,
                      borderWidth: values.domaine === d.id ? 0 : 1,
                    },
                  ]}
                  onPress={() => handleChange('domaine', d.id)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={d.icon}
                    size={24}
                    color={values.domaine === d.id ? '#FFFFFF' : colors.primary}
                    style={{ marginBottom: spacing.xs }}
                  />
                  <Text
                    style={[
                      styles.domaineLabel,
                      { color: values.domaine === d.id ? '#FFFFFF' : colors.text.primary, fontSize: fontSize.xs },
                    ]}
                  >
                    {d.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {touched.domaine && errors.domaine && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {errors.domaine}
              </Text>
            )}
          </View>
        ) : (
          <FormInput
            label="Nom de votre entreprise"
            placeholder="Ma Startup SAS"
            value={values.entreprise}
            onChangeText={(text) => handleChange('entreprise', text)}
            onBlur={() => handleBlur('entreprise')}
            error={touched.entreprise ? errors.entreprise : null}
            leftIcon="office-building"
            required
          />
        )}
      </View>
    </SlideInUpView>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={[styles.scrollContainer, { padding: spacing.lg }]} showsVerticalScrollIndicator={false}>
        <FadeInView>
          <StepIndicator currentStep={currentStep} totalSteps={3} style={{ marginBottom: spacing.lg }} />
        </FadeInView>

        <View style={styles.formContainer}>
          {renderStepContent()}
        </View>

        <View style={[styles.navigationContainer, { marginTop: spacing.xl }]}>
          {currentStep > 1 && (
            <Button
              variant="outline"
              size="lg"
              onPress={handlePrevious}
              icon="arrow-left"
              style={{ flex: 1 }}
            >
              Précédent
            </Button>
          )}

          <Button
            variant={currentStep === 3 ? 'success' : 'primary'}
            size="lg"
            onPress={currentStep === 3 ? handleSubmit : handleNext}
            loading={currentStep === 3 && isSubmitting}
            disabled={currentStep === 3 && isSubmitting}
            icon={currentStep === 3 ? 'check' : 'arrow-right'}
            iconPosition="right"
            style={{ flex: 1, marginLeft: currentStep > 1 ? spacing.md : 0 }}
          >
            {currentStep === 3 ? 'Créer compte' : 'Suivant'}
          </Button>
        </View>

        <View style={[styles.loginContainer, { marginTop: spacing.xl }]}>
          <Text style={[{ color: colors.text.secondary, fontSize: fontSize.base }]}>
            Vous avez déjà un compte ?{' '}
          </Text>
          <Button
            variant="ghost"
            onPress={() => navigation.navigate('Connexion')}
            hapticFeedback={false}
            style={{ padding: 0 }}
          >
            <Text style={[{ color: colors.primary, fontWeight: '700' }]}>
              Se connecter
            </Text>
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  formContainer: {
    marginBottom: 16,
  },
  stepTitle: {
    fontWeight: '700',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  roleCard: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  roleDesc: {
    fontSize: 12,
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  domaineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  domaineCard: {
    width: '48%',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  domaineLabel: {
    textAlign: 'center',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
  },
  navigationContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default InscriptionScreen;

