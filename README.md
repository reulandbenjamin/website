# Benjamin Reuland - Site Personnel

> Ingénierie & Web, au service du réel.

Site personnel multilingue de Benjamin Reuland, étudiant en électronique et systèmes embarqués à la HEPL, développeur web autoformé et engagé sociétalement.

## 🚀 Aperçu Technique

- **Frontend** : HTML5/CSS3/JavaScript vanilla (aucune étape de build)
- **Backend** : PHP 8.x pour les formulaires et API
- **Langues** : FR (défaut), EN, NL, DE, SV
- **Recherche** : Lunr.js côté client
- **Analytics** : Google Analytics 4 avec Consent Mode v2
- **Déploiement** : Compatible Plesk (fichiers statiques)

## 📁 Structure du Projet

```
/
├── index.html                    # Redirection vers /fr/
├── fr/                          # Version française (par défaut)
│   ├── index.html               # Accueil
│   ├── a-propos.html
│   ├── etudes.html
│   ├── projets/
│   │   ├── index.html           # Liste des projets
│   │   └── {slug}.html          # Fiches projet individuelles
│   ├── mes-engagements.html
│   ├── services.html
│   ├── contact.html
│   ├── cv.html
│   └── 404.html
├── en/                          # Version anglaise
├── nl/                          # Version néerlandaise
├── de/                          # Version allemande
├── sv/                          # Version suédoise
├── assets/
│   ├── css/
│   │   └── styles.css           # Design System TerracottaNavy
│   ├── js/
│   │   ├── main.js              # Navigation, langues, filtres
│   │   ├── ga4-events.js        # Analytics et Web Vitals
│   │   └── lunr.min.js          # Moteur de recherche
│   ├── fonts/                   # Roboto & Space Grotesk (WOFF2)
│   └── img/                     # Images optimisées (WebP/AVIF)
├── search/
│   ├── index.fr.json            # Index de recherche français
│   ├── index.en.json            # Index de recherche anglais
│   ├── index.nl.json            # Index de recherche néerlandais
│   ├── index.de.json            # Index de recherche allemand
│   └── index.sv.json            # Index de recherche suédois
├── api/
│   └── form.php                 # Traitement des formulaires
├── storage/
│   └── forms/                   # Backups JSON (protégé)
├── .htaccess                    # Configuration serveur
├── robots.txt                   # SEO
├── sitemap.xml                  # Plan du site
└── og-default.svg               # Image Open Graph par défaut
```

## 🛠️ Développement Local

### Prérequis

- PHP 8.0+
- Serveur web local (Apache/Nginx) ou `php -S`
- Node.js 18+ (pour les outils de qualité uniquement)

### Installation

```bash
# Cloner le dépôt
git clone https://github.com/reulandbenjamin/website.git
cd website

# Installer les dépendances de développement
npm install

# Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos clés API
```

### Serveur de développement

```bash
# Option 1 : Serveur PHP intégré
php -S localhost:8000

# Option 2 : Avec Apache/Nginx
# Pointer le DocumentRoot vers le dossier du projet
```

### Scripts disponibles

```bash
npm run lint        # ESLint + vérifications
npm run format      # Formatage Prettier
npm run test        # Tests unitaires (Vitest)
npm run test:e2e    # Tests end-to-end (Playwright)
```

## 🚀 Déploiement Plesk

### Méthode Git (Recommandée)

1. **Configurer le dépôt Git dans Plesk**
   - Aller dans "Git" → "Ajouter un dépôt"
   - URL : `https://github.com/reulandbenjamin/website.git`
   - Branche : `main`
   - Chemin de déploiement : `/httpdocs`

2. **Variables d'environnement**
   - Aller dans "PHP" → "Variables d'environnement"
   - Ajouter les variables depuis `.env.example`

3. **Permissions**
   ```bash
   chmod 755 storage/
   chmod 755 storage/forms/
   ```

4. **Premier déploiement**
   - Cliquer sur "Déployer" dans l'interface Git de Plesk
   - Vérifier que les fichiers sont bien dans `/httpdocs`

### Méthode ZIP (Alternative)

1. **Créer l'archive**
   ```bash
   # Exclure les fichiers de développement
   zip -r website.zip . -x "node_modules/*" ".git/*" "*.md" "package*.json"
   ```

2. **Téléverser**
   - Aller dans "Gestionnaire de fichiers" → `/httpdocs`
   - Téléverser et extraire `website.zip`

3. **Configuration manuelle**
   - Créer le fichier `.env` avec les bonnes valeurs
   - Ajuster les permissions comme ci-dessus

## 🔧 Configuration

### Variables d'environnement

Copier `.env.example` vers `.env` et configurer :

```env
# SMTP Configuration
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USERNAME=your-email@domain.com
MAIL_PASSWORD=your-password
MAIL_FROM=no-reply@benjamin-reuland.be
MAIL_TO=contact@benjamin-reuland.be

# Google reCAPTCHA v3
RECAPTCHA_SITE_KEY=your-site-key
RECAPTCHA_SECRET_KEY=your-secret-key

# Google Analytics 4
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Sécurité

Le fichier `.htaccess` inclut :
- Headers de sécurité (CSP, HSTS, etc.)
- Protection du dossier `storage/`
- Cache et compression
- Redirections HTTPS

## 📊 Performance

### Budgets Core Web Vitals

- **LCP** : ≤ 2.3s (mobile)
- **INP** : ≤ 200ms
- **CLS** : ≤ 0.06

### Optimisations

- Fonts locales WOFF2 avec `preload` et `font-display: swap`
- Images AVIF/WebP avec `srcset` responsive
- JavaScript initial < 80kB
- Progressive Enhancement pour les animations

## 🧪 Tests et Qualité

### Tests automatisés

```bash
# Tests unitaires
npm run test

# Tests E2E
npm run test:e2e

# Audit accessibilité
npm run audit:a11y

# Performance
npm run audit:perf
```

### Critères d'acceptation

- ✅ Accessibilité WCAG 2.2 AA
- ✅ Performance Lighthouse ≥ 90 (mobile)
- ✅ SEO avec hreflang et canonical
- ✅ RGPD : consentement par défaut refusé
- ✅ Sécurité : headers CSP et protection XSS

## 🌍 Internationalisation

Le site supporte 5 langues avec des URLs dédiées :

- `benjamin-reuland.be/fr/` (défaut)
- `benjamin-reuland.be/en/`
- `benjamin-reuland.be/nl/`
- `benjamin-reuland.be/de/`
- `benjamin-reuland.be/sv/`

### Balises SEO multilingues

- `canonical` : pointe vers la version FR par défaut
- `hreflang` : liens entre toutes les versions + `x-default`

## 📈 Analytics et Suivi

### Événements GA4

- `cta_click` : Clics sur boutons d'action
- `project_view` : Consultation de projets  
- `cv_download` : Téléchargement du CV
- `form_submit` : Soumissions de formulaire
- `search_query` : Recherches internes
- `web_vitals` : Métriques de performance

### Respect RGPD

- Consentement requis avant tracking
- Aucune donnée PII envoyée à GA4
- Bannière neutre de consentement

## 🔗 Intégrations

- **Email** : SMTP via PHPMailer
- **Captcha** : Google reCAPTCHA v3
- **Recherche** : Lunr.js côté client
- **Analytics** : GA4 avec Consent Mode v2

## 📞 Support

- **Développeur** : Benjamin Reuland
- **Email** : contact@benjamin-reuland.be
- **LinkedIn** : [breuland](https://linkedin.com/in/breuland)

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

**Dernière mise à jour** : Septembre 2025