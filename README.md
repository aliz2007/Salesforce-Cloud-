# MG Maroc · Sales Cloud

Plateforme interne pour **MG Maroc** : le service **Marketing & Communication**
dépose les supports (notes de prix, fiches techniques, vidéos, photos
extérieur/intérieur, comparatifs, challenges, offres spéciales) ; le **vendeur**
sélectionne ceux qui l'intéressent et bascule en **Sales Mode** — une
présentation plein écran, animée et soignée, à dérouler devant le client.

> Source unique de documents pour tout le réseau, et un outil de vente immersif.

---

## ✨ Fonctionnalités

- **Espace Marketing** — dépôt par glisser-déposer (multi-fichiers) ou par lien
  (YouTube, Drive…), organisation par **8 catégories**, édition / suppression,
  recherche et filtres.
- **Espace Vendeur** — navigation par catégorie, **sélection multiple**, bac de
  sélection persistant, puis lancement du Sales Mode.
- **Sales Mode** — intro cinématique, **menu groupé par catégorie**, scène de
  présentation plein écran (image / vidéo / PDF), navigation clavier
  (← →, `Échap`/`G` = menu), flèches, filmstrip, et chrome auto-masqué.
- **Aucun login** — sélecteur de rôle sur l'accueil (à faire évoluer plus tard).
- **100 % hors-ligne au démarrage** — contenu de démo généré, stockage local.

## 🧱 Stack

Vite · React · TypeScript · Tailwind CSS · Framer Motion · lucide-react · idb.

## 🚀 Démarrer

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # build de production dans dist/
npm run preview  # prévisualise le build
```

## 🗂️ Stockage : une seule couche à remplacer

Toute l'app passe par l'interface **`DocumentStore`**
(`src/storage/DocumentStore.ts`). C'est le **seul** point qui décide « où vivent
les documents ».

| Backend | Fichier | État |
| --- | --- | --- |
| **IndexedDB** (local, par navigateur) | `src/storage/IndexedDbStore.ts` | ✅ actif par défaut |
| **Google Drive** (lecture seule) | `src/storage/GoogleDriveStore.ts` | 🧩 scaffold documenté |

Le backend se choisit dans **`src/storage/index.ts`** (une seule ligne). L'UI ne
change jamais.

> ⚠️ En local (IndexedDB), les documents vivent dans **le navigateur de chaque
> personne** — parfait pour démos et usage mono-poste. Pour qu'Imane dépose et
> que tous les vendeurs voient les mêmes documents, il faut un **stockage
> partagé** : c'est le rôle de Google Drive ci-dessous.

### Brancher Google Drive (recommandé pour la prod)

Modèle le plus simple, sans OAuth :

1. Imane crée **un dossier Drive partagé** « MG Maroc — Sales Cloud ».
2. À l'intérieur, **un sous-dossier par catégorie** (Notes de prix, Fiches
   techniques, Vidéos, Photos extérieur, Photos intérieur, Comparatifs,
   Challenges, Offres spéciales). Elle y dépose ses fichiers — c'est tout.
3. Partage du dossier : **« Tous les utilisateurs disposant du lien → Lecteur »**.
4. Crée une **clé API** Google Cloud restreinte à *Google Drive API*.
5. Renseigne `.env` (voir `.env.example`) puis, dans `src/storage/index.ts` :

   ```ts
   import { GoogleDriveStore } from './GoogleDriveStore'
   export const store = new GoogleDriveStore({
     apiKey: import.meta.env.VITE_GDRIVE_API_KEY,
     rootFolderId: import.meta.env.VITE_GDRIVE_ROOT_FOLDER_ID,
   })
   ```

Dans ce mode, « déposer un document » = déposer un fichier dans Drive (l'UX cloud
voulue). Les uploads in-app vers Drive nécessiteraient un flux OAuth (évolution
possible : passer `canWrite = true`).

## 🌐 Héberger gratuitement

Le bundle est minuscule (~100 Ko gzip) et les médias lourds vivent sur Drive :
n'importe quel hébergeur statique gratuit convient.

- **Cloudflare Pages** ou **Vercel** ou **Netlify** : build `npm run build`,
  dossier de sortie `dist/`. Branche le dépôt GitHub → déploiement auto à chaque
  push.
- Variables d'env (si Drive) : `VITE_GDRIVE_API_KEY`, `VITE_GDRIVE_ROOT_FOLDER_ID`.

## 📁 Structure

```
src/
  data/         catégories + jeu de démo
  storage/      DocumentStore (interface) + IndexedDb / GoogleDrive + médias/posters
  context/      état global (documents, CRUD, sélection)
  components/   Landing · MarketingDashboard · SalesBrowser · SalesMode · …
```

## 🗺️ Pistes d'évolution

- Authentification (admin Marketing / vendeurs).
- Upload in-app vers Drive (OAuth) → `canWrite = true`.
- Statistiques de consultation, favoris vendeur, partage d'une présentation par lien.
- Mode hors-ligne complet (PWA) pour le showroom sans réseau.
