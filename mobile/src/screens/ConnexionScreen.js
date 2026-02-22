// NOTE : Tous les montants de mission (client, prestataire, admin) doivent être affichés et saisis en Franc CFA (FCFA)
/**
 * Écran de Connexion - SamaJob
 * Design inspiré du logo avec header vert + formulaire carte blanche
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useForm } from '../hooks';
import { FormInput, Button } from '../components';
import { FadeInView, SlideInUpView } from '../components/FadeInView';

const ConnexionScreen = ({ navigation }) => {
  const { connexion } = useAuth();
  const { colors, spacing, fontSize, borderRadius, elevation, typography } = useTheme();
  const [useEmail, setUseEmail] = useState(true);

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
      email: '',
      telephone: '',
      motDePasse: '',
    },
    validationRules: {
      email: {
        required: useEmail,
        email: useEmail,
        requiredMessage: 'Email requis',
        emailMessage: 'Email invalide',
      },
      telephone: {
        required: !useEmail,
        requiredMessage: 'Numéro de téléphone requis',
        // Format validé et normalisé dans onSubmit (strip espaces)
      },
      motDePasse: {
        required: true,
        minLength: 6,
        requiredMessage: 'Mot de passe requis',
        minLengthMessage: 'Le mot de passe doit contenir au moins 6 caractères',
      },
    },
    validateOnBlur: true,
    onSubmit: async (formValues) => {
      // Normaliser le téléphone (supprimer espaces/tirets) avant envoi
      const identifier = useEmail
        ? formValues.email
        : (formValues.telephone || '').replace(/[\s\-\(\)]/g, '');
      const result = await connexion({
        identifier,
        motDePasse: formValues.motDePasse,
      });

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Connexion réussie',
          text2: 'Bienvenue sur SamaJob !',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Erreur de connexion',
          text2: result.error || 'Vérifiez vos identifiants',
        });
      }
    },
  });

  const handleToggle = (isEmail) => {
    setUseEmail(isEmail);
    if (isEmail) {
      handleChange('telephone', '');
    } else {
      handleChange('email', '');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header vert avec logo */}
          <View style={[styles.header, { backgroundColor: colors.primary }]}>
            <FadeInView duration={600} delay={100}>
              <View style={styles.logoWrapper}>
                <View style={styles.logoCircle}>
                  <Image
                    source={require('../../assets/logo2.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.headerTagline}>
                  Trouvez les meilleures missions
                </Text>
              </View>
            </FadeInView>
          </View>

          {/* Formulaire carte blanche */}
          <View style={[styles.formWrapper, { backgroundColor: colors.background }]}>
            <SlideInUpView duration={500} delay={200} distance={20}>
              <View
                style={[
                  styles.formCard,
                  {
                    backgroundColor: colors.surface,
                    borderRadius: borderRadius.xl,
                    ...elevation.md,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.title,
                    { color: colors.secondary, ...typography.h3 },
                  ]}
                >
                  Bon retour !
                </Text>
                <Text
                  style={[
                    styles.subtitle,
                    { color: colors.text.secondary, ...typography.bodySmall },
                  ]}
                >
                  Connectez-vous pour accéder à votre espace
                </Text>

                {/* Toggle Email / Téléphone */}
                <View
                  style={[
                    styles.toggleContainer,
                    {
                      borderRadius: borderRadius.lg,
                      backgroundColor: colors.surfaceVariant || colors.background,
                      marginTop: spacing.lg,
                      marginBottom: spacing.lg,
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      {
                        borderRadius: borderRadius.md,
                        backgroundColor: useEmail ? colors.primary : 'transparent',
                      },
                    ]}
                    onPress={() => handleToggle(true)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons
                      name="email-outline"
                      size={16}
                      color={useEmail ? '#FFF' : colors.text.tertiary}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.toggleText,
                        {
                          color: useEmail ? '#FFF' : colors.text.tertiary,
                          fontWeight: useEmail ? '600' : '400',
                        },
                      ]}
                    >
                      Email
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      {
                        borderRadius: borderRadius.md,
                        backgroundColor: !useEmail ? colors.primary : 'transparent',
                      },
                    ]}
                    onPress={() => handleToggle(false)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons
                      name="phone-outline"
                      size={16}
                      color={!useEmail ? '#FFF' : colors.text.tertiary}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.toggleText,
                        {
                          color: !useEmail ? '#FFF' : colors.text.tertiary,
                          fontWeight: !useEmail ? '600' : '400',
                        },
                      ]}
                    >
                      Téléphone
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Champs */}
                {useEmail ? (
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
                ) : (
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
                )}

                <FormInput
                  label="Mot de passe"
                  placeholder="••••••••"
                  value={values.motDePasse}
                  onChangeText={(text) => handleChange('motDePasse', text)}
                  onBlur={() => handleBlur('motDePasse')}
                  error={touched.motDePasse ? errors.motDePasse : null}
                  secureTextEntry
                  showPasswordToggle
                  leftIcon="lock-outline"
                  required
                />

                <TouchableOpacity
                  onPress={() => {
                    Toast.show({
                      type: 'info',
                      text1: 'Bientôt disponible',
                      text2: 'Réinitialisation du mot de passe à venir',
                    });
                  }}
                  style={styles.forgotButton}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.forgotText, { color: colors.primary }]}>
                    Mot de passe oublié ?
                  </Text>
                </TouchableOpacity>

                {/* Bouton principal */}
                <Button
                  variant="primary"
                  size="lg"
                  onPress={handleSubmit}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  fullWidth
                  style={{ marginTop: spacing.md }}
                  icon="login-variant"
                  iconPosition="right"
                >
                  Se connecter
                </Button>
              </View>
            </SlideInUpView>

            {/* Lien inscription */}
            <View style={styles.signupRow}>
              <Text style={[styles.signupText, { color: colors.text.secondary }]}>
                Pas encore de compte ?
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Inscription')}
                activeOpacity={0.7}
              >
                <Text style={[styles.signupLink, { color: colors.primary }]}>
                  {' '}S'inscrire
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  // Header vert arrondi en bas
  header: {
    paddingTop: 60,
    paddingBottom: 50,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  logoWrapper: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  logoImage: {
    width: 80,
    height: 80,
  },
  headerTagline: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    fontWeight: '500',
    marginTop: 4,
  },
  // Formulaire
  formWrapper: {
    flex: 1,
    marginTop: -24,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  formCard: {
    padding: 24,
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    marginBottom: 0,
  },
  toggleContainer: {
    flexDirection: 'row',
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  toggleText: {
    fontSize: 13,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: -4,
    marginBottom: 8,
    paddingVertical: 4,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  signupText: {
    fontSize: 15,
  },
  signupLink: {
    fontSize: 15,
    fontWeight: '700',
  },
});

export default ConnexionScreen;
