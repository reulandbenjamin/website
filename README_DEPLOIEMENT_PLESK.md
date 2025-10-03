# Guide de Déploiement Plesk — benjamin-reuland.be

## 🚀 Déploiement Rapide

### 1. Connexion Plesk
- URL dépôt : `https://github.com/reulandbenjamin/website.git`
- Branche : `main`
- Destination : `httpdocs`

### 2. Variables PHP (Plesk → PHP Settings)
```
SMTP_HOST=mail.benjamin-reuland.be
SMTP_PORT=587
SMTP_USER=no-reply@benjamin-reuland.be
SMTP_PASS=[secret]
RECAPTCHA_SECRET=[secret]
```

### 3. Configuration reCAPTCHA v3
- Obtenir clés : https://www.google.com/recaptcha/admin/create
- Remplacer `YOUR_RECAPTCHA_SITE_KEY` dans fr/contact.html (ligne ~60)

### 4. Tests
- [ ] Site accessible : https://benjamin-reuland.be
- [ ] Formulaire contact fonctionnel
- [ ] Polices chargées (F12 Network)
- [ ] Pas d'erreurs console

## 🔧 Configuration DNS (Optionnel)
```
TXT @ "v=spf1 include:_spf.benjamin-reuland.be ~all"
```

## 📊 Checklist Finale
- [ ] 5 langues accessibles (FR/EN/DE/NL/SV)
- [ ] SSL actif
- [ ] Formulaire testé
- [ ] storage/ protégé (403)

**Déploiement : 90 fichiers | 60 pages HTML | 5 langues**

Version 1.0.0 — 03/10/2025
