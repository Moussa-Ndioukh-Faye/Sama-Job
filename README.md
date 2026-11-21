# SamaJob — application mobile et API

![React Native](https://img.shields.io/badge/React_Native-20232a?style=flat-square&logo=react&logoColor=61dafb) ![Expo](https://img.shields.io/badge/Expo_51-000020?style=flat-square&logo=expo&logoColor=white) ![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white) ![MySQL](https://img.shields.io/badge/MySQL-4479a1?style=flat-square&logo=mysql&logoColor=white)

**SamaJob** est une plateforme de **micro-missions** qui met en relation des étudiants (prestataires) et des clients, particuliers ou entreprises, pour de petites missions rémunérées au Sénégal.

Projet d'équipe réalisé dans le module **Entrepreneuriat et innovation** (L2 GLSI, ESP Dakar). Ce dépôt contient la version **mobile** et son API ; la version web est dans [SamaJobsite](https://github.com/Moussa-Ndioukh-Faye/SamaJobsite). Le projet n'a pas été mis en production.

## Fonctionnalités

- Inscription et connexion (JWT, mots de passe hachés avec bcrypt)
- **Clients** : publier une mission, suivre les candidatures
- **Prestataires** : parcourir et filtrer les missions, postuler
- Messagerie et notifications
- **Administration** : gestion des utilisateurs et des missions
- Protection de l'API : validation des entrées, limitation du nombre de requêtes

## Structure

```
backend/   API Express + MySQL (controllers, routes, middleware, models)
mobile/    application Expo / React Native (screens, navigation, context, services)
```

## Lancer

```bash
# API
cd backend && cp .env.example .env   # renseigner la connexion MySQL
npm install && node src/database/migrate.js && npm start

# Application mobile
cd mobile && cp .env.example .env    # renseigner l'URL de l'API
npm install && npx expo start
```

---

<p align="center">Réalisé par <a href="https://github.com/Moussa-Ndioukh-Faye"><b>Moussa Ndioukh Faye</b></a> · École Supérieure Polytechnique de Dakar (ESP/UCAD)</p>
