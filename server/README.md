# MG Sales Cloud — serveur intranet

Application interne : le Marketing dépose les documents, les vendeurs les présentent.
Tout tourne sur **une seule machine du réseau local** (WiFi showroom) ; les autres
appareils y accèdent par navigateur. Aucun accès Internet n'est nécessaire.

## Prérequis

- **Node.js 18 ou supérieur** installé sur la machine hôte.

## Installation et lancement

```bash
npm install      # une seule fois
npm start        # build le site + démarre le serveur (port 3000)
```

Pour un autre port : `PORT=8080 npm start`.

Les autres postes ouvrent alors : **http://<IP-de-cette-machine>:3000**
(ex. `http://192.168.1.50:3000`). Demandez à l'IT de **réserver une IP fixe**
pour cette machine et d'**ouvrir le port** sur le pare-feu du réseau local.

Pour un lancement automatique au démarrage, faites-en un service
(systemd sous Linux, ou « Tâche planifiée » / NSSM sous Windows).

## Compte initial

- Identifiant : **imane**
- Mot de passe : **ImaneMG**

Imane (superadmin) peut changer son mot de passe à tout moment (menu compte, en
haut à droite) et créer/gérer les comptes vendeurs depuis « Gestion des comptes ».
Les comptes vendeurs, eux, doivent définir leur mot de passe à leur première
connexion.

## Données et sauvegarde

Tout est stocké dans **`server/data/`** :

- `db.json` — comptes + métadonnées des documents
- `uploads/` — les fichiers déposés
- `secret` — clé de signature des sessions

👉 **Sauvegardez régulièrement le dossier `server/data/`.** Il n'est pas versionné
dans Git. Supprimer ce dossier réinitialise l'application (recrée le compte
`imane` et les documents de démonstration).

## Rôles

- **Superadmin** (Imane) : gère les documents **et** les comptes.
- **Vendeur** : consulte les documents et lance le Sales Mode. Pas d'accès à
  l'administration.

## Sécurité

- Les mots de passe sont **hachés (scrypt)** côté serveur — jamais stockés en clair.
- La session est un **cookie httpOnly signé (HMAC)**.
- Sur un réseau local fermé, l'app fonctionne en HTTP. Pour ajouter du HTTPS,
  placez le serveur derrière un reverse-proxy (Nginx/IIS) avec un certificat.
- Aperçu Office (Word/Excel/PowerPoint) : nécessite Internet (visionneuses
  Microsoft/Google). Sur un réseau fermé, ces fichiers se téléchargent ; tout le
  reste (PDF, images, vidéo, audio, CSV, texte…) s'affiche directement.
