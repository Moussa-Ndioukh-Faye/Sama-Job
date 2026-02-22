/**
 * Navigation principale de l'application
 * Gère la navigation conditionnelle selon l'authentification
 */

import React from 'react';
import { View, ActivityIndicator, Image, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Contexte
import { useAuth } from '../context/AuthContext';

// Écrans d'authentification
import ConnexionScreen from '../screens/ConnexionScreen';
import InscriptionScreen from '../screens/InscriptionScreen';

// Écrans (Prestataire, Client et Communs)
import AccueilPrestataireScreen from '../screens/prestataire/AccueilPrestataireScreen';
import MissionsScreen from '../screens/prestataire/MissionsScreen';
import {
  DetailMissionScreen,
  HistoriquePrestataireScreen,
  ProfilPrestataireScreen,
  AccueilClientScreen,
  CreerMissionScreen,
  MesMissionsScreen,
  CandidaturesScreen,
  ProfilClientScreen,
  ConversationsScreen,
  ChatScreen,
  ProfilScreen
} from '../screens/CommonScreens';

// Écrans manquants (Dossier, Notifications, Évaluation)
import {
  DeposerDossierScreen,
  NotificationsScreen,
  EvaluationScreen
} from '../screens/MissingScreens';

// Écrans Admin
import {
  AdminDashboardScreen,
  DossiersScreen,
  GestionUtilisateursScreen,
  GestionMissionsScreen,
  StatistiquesScreen
} from '../screens/AdminScreens';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/**
 * Navigateur Stack pour l'authentification
 */
const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'default'
      }}
    >
      <Stack.Screen
        name="Connexion"
        component={ConnexionScreen}
      />
      <Stack.Screen
        name="Inscription"
        component={InscriptionScreen}
        options={{
          animation: 'default',
          title: 'Créer un compte'
        }}
      />
    </Stack.Navigator>
  );
};

/**
 * Navigateur Tabs pour Prestataire
 */
const PrestataireTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'AccueilPrestataire') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Missions') {
            iconName = focused ? 'briefcase' : 'briefcase-outline';
          } else if (route.name === 'Conversations') {
            iconName = focused ? 'chat' : 'chat-outline';
          } else if (route.name === 'Historique') {
            iconName = focused ? 'history' : 'history';
          } else if (route.name === 'ProfilPrestataire') {
            iconName = focused ? 'account' : 'account-outline';
          }

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2E7D32',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: {
          height: 64,
          paddingBottom: 10,
          paddingTop: 4,
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          borderTopWidth: 1,
        }
      })}
    >
      <Tab.Screen 
        name="AccueilPrestataire" 
        component={AccueilPrestataireScreen}
        options={{ title: 'Accueil' }}
      />
      <Tab.Screen 
        name="Missions" 
        component={PrestataireStackNavigator}
        options={{ headerShown: false, title: 'Missions' }}
      />
      <Tab.Screen 
        name="Conversations" 
        component={ConversationsScreen}
        options={{ title: 'Messages' }}
      />
      <Tab.Screen 
        name="Historique" 
        component={HistoriquePrestataireScreen}
        options={{ title: 'Historique' }}
      />
      <Tab.Screen 
        name="ProfilPrestataire" 
        component={ProfilPrestataireScreen}
        options={{ title: 'Profil' }}
      />
    </Tab.Navigator>
  );
};

/**
 * Navigateur Stack pour les Missions (Prestataire)
 */
const PrestataireStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerBackButtonDisplayMode: 'minimal'
      }}
    >
      <Stack.Screen 
        name="ListeMissions" 
        component={MissionsScreen}
        options={{ title: 'Missions disponibles' }}
      />
      <Stack.Screen 
        name="DetailMission" 
        component={DetailMissionScreen}
        options={{ title: 'Détails de la mission' }}
      />
    </Stack.Navigator>
  );
};

/**
 * Navigateur Tabs pour Client
 */
const ClientTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'AccueilClient') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'CreerMission') {
            iconName = focused ? 'plus-circle' : 'plus-circle-outline';
          } else if (route.name === 'MesMissions') {
            iconName = focused ? 'briefcase' : 'briefcase-outline';
          } else if (route.name === 'Conversations') {
            iconName = focused ? 'chat' : 'chat-outline';
          } else if (route.name === 'ProfilClient') {
            iconName = focused ? 'account' : 'account-outline';
          }

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1A3C6E',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: {
          height: 64,
          paddingBottom: 10,
          paddingTop: 4,
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          borderTopWidth: 1,
        }
      })}
    >
      <Tab.Screen 
        name="AccueilClient" 
        component={AccueilClientScreen}
        options={{ title: 'Accueil' }}
      />
      <Tab.Screen 
        name="CreerMission" 
        component={CreerMissionScreen}
        options={{ title: 'Créer' }}
      />
      <Tab.Screen 
        name="MesMissions" 
        component={ClientStackNavigator}
        options={{ headerShown: false, title: 'Missions' }}
      />
      <Tab.Screen 
        name="Conversations" 
        component={ConversationsScreen}
        options={{ title: 'Messages' }}
      />
      <Tab.Screen 
        name="ProfilClient" 
        component={ProfilClientScreen}
        options={{ title: 'Profil' }}
      />
    </Tab.Navigator>
  );
};

/**
 * Navigateur Stack pour Client (Missions + Candidatures)
 */
const ClientStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerBackButtonDisplayMode: 'minimal'
      }}
    >
      <Stack.Screen 
        name="ListeMesMissions" 
        component={MesMissionsScreen}
        options={{ title: 'Mes missions' }}
      />
      <Stack.Screen 
        name="Candidatures" 
        component={CandidaturesScreen}
        options={{ title: 'Candidatures' }}
      />
    </Stack.Navigator>
  );
};

/**
 * Navigateur Tabs pour Admin
 */
const AdminTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: route.name !== 'AdminDashboard',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'AdminDashboard') {
            iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
          } else if (route.name === 'Dossiers') {
            iconName = focused ? 'file-document-check' : 'file-document-check-outline';
          } else if (route.name === 'GestionUtilisateurs') {
            iconName = focused ? 'account-group' : 'account-group-outline';
          } else if (route.name === 'GestionMissions') {
            iconName = focused ? 'briefcase' : 'briefcase-outline';
          } else if (route.name === 'Statistiques') {
            iconName = focused ? 'chart-bar' : 'chart-bar';
          }

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1A3C6E',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarStyle: {
          height: 64,
          paddingBottom: 10,
          paddingTop: 4,
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          borderTopWidth: 1,
        }
      })}
    >
      <Tab.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="Dossiers"
        component={DossiersScreen}
        options={{ title: 'Dossiers' }}
      />
      <Tab.Screen
        name="GestionUtilisateurs"
        component={GestionUtilisateursScreen}
        options={{ title: 'Utilisateurs' }}
      />
      <Tab.Screen
        name="GestionMissions"
        component={GestionMissionsScreen}
        options={{ title: 'Missions' }}
      />
      <Tab.Screen
        name="Statistiques"
        component={StatistiquesScreen}
        options={{ title: 'Stats' }}
      />
    </Tab.Navigator>
  );
};

/**
 * Écran de repli affiché brièvement pendant la déconnexion forcée
 * (utilisateur authentifié avec un rôle non reconnu)
 */
const FallbackScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFBFC' }}>
    <ActivityIndicator size="large" color="#2E7D32" />
    <Text style={{ marginTop: 12, fontSize: 14, color: '#94A3B8', fontWeight: '500' }}>Chargement...</Text>
  </View>
);

/**
 * Navigateur principal
 */
const AppNavigator = () => {
  const { isAuthenticated, loading, isClient, isPrestataire, isAdmin, deconnexion } = useAuth();

  // Si authentifié mais rôle inconnu → déconnecter pour éviter une boucle
  React.useEffect(() => {
    if (isAuthenticated && !isAdmin && !isPrestataire && !isClient) {
      deconnexion();
    }
  }, [isAuthenticated, isAdmin, isPrestataire, isClient]);

  if (loading) {
    return (
      <View style={loadingStyles.container}>
        <Image
          source={require('../../assets/logo2.png')}
          style={loadingStyles.logo}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color="#2E7D32" style={loadingStyles.spinner} />
        <Text style={loadingStyles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Group screenOptions={{ animation: 'none' }}>
          <Stack.Screen name="AuthStack" component={AuthStack} />
        </Stack.Group>
      ) : isAdmin ? (
        <Stack.Group screenOptions={{ animation: 'none' }}>
          <Stack.Screen name="AdminApp" component={AdminTabNavigator} />
        </Stack.Group>
      ) : isPrestataire ? (
        <Stack.Group screenOptions={{ animation: 'none' }}>
          <Stack.Screen name="PrestataireApp" component={PrestataireTabNavigator} />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{ animation: 'default', presentation: 'modal' }}
          />
          <Stack.Screen
            name="Profil"
            component={ProfilScreen}
            options={{ animation: 'default', presentation: 'modal' }}
          />
          <Stack.Screen
            name="DeposerDossier"
            component={DeposerDossierScreen}
            options={{ animation: 'default', headerShown: true, title: 'Mon dossier' }}
          />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{ animation: 'default', headerShown: true, title: 'Notifications' }}
          />
        </Stack.Group>
      ) : isClient ? (
        <Stack.Group screenOptions={{ animation: 'none' }}>
          <Stack.Screen name="ClientApp" component={ClientTabNavigator} />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{ animation: 'default', presentation: 'modal' }}
          />
          <Stack.Screen
            name="Profil"
            component={ProfilScreen}
            options={{ animation: 'default', presentation: 'modal' }}
          />
          <Stack.Screen
            name="Evaluation"
            component={EvaluationScreen}
            options={{ animation: 'default', headerShown: true, title: 'Évaluation' }}
          />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{ animation: 'default', headerShown: true, title: 'Notifications' }}
          />
        </Stack.Group>
      ) : (
        <Stack.Group screenOptions={{ animation: 'none' }}>
          <Stack.Screen name="Fallback" component={FallbackScreen} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
};

const loadingStyles = {
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFBFC',
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 16,
  },
  spinner: {
    marginTop: 12,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
};

export default AppNavigator;
