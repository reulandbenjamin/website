# Guide de Contribution

Merci de votre intérêt pour contribuer au site benjamin-reuland.be ! 

## 🎁 Comment contribuer

### Signaler un problème

1. Vérifiez que le problème n'a pas déjà été signalé
2. Ouvrez une [issue GitHub](https://github.com/reulandbenjamin/website/issues)
3. Décrivez le problème de manière détaillée :
   - Navigateur et version
   - Étapes pour reproduire
   - Comportement attendu vs réel
   - Captures d'écran si pertinentes

### Proposer une amélioration

1. Ouvrez une issue avec le label "enhancement"
2. Décrivez clairement l'amélioration proposée
3. Expliquez la valeur ajoutée pour les utilisateurs

### Soumettre du code

1. **Fork** le dépôt
2. **Clonez** votre fork localement
3. **Créez une branche** pour votre fonctionnalité :
   ```bash
   git checkout -b feature/nom-de-la-fonctionnalite
   ```
4. **Respectez les conventions** de code (voir ci-dessous)
5. **Testez** vos modifications
6. **Committez** avec un message clair :
   ```bash
   git commit -m "feat: ajouter la fonctionnalité X"
   ```
7. **Poussez** votre branche :
   ```bash
   git push origin feature/nom-de-la-fonctionnalite
   ```
8. **Ouvrez une Pull Request** avec une description détaillée

## 📈 Standards de qualité

### Code Style

- **HTML** : Utilisez la sémantique HTML5
- **CSS** : Suivez la méthodologie BEM pour le nommage
- **JavaScript** : Standard ES6+ avec ESLint
- **PHP** : PSR-12 coding standard

### Formatage

```bash
# Avant de committer, exécutez :
npm run lint        # Vérifier le code
npm run format      # Formater avec Prettier
npm run test        # Exécuter les tests
```

### Convention des commits

Utilisez [Conventional Commits](https://conventionalcommits.org/) :

- `feat:` nouvelle fonctionnalité
- `fix:` correction de bug
- `docs:` documentation
- `style:` formatage, CSS
- `refactor:` refactoring sans changement fonctionnel
- `test:` ajout ou modification de tests
- `chore:` maintenance, outils

**Exemples :**
```
feat: ajouter la recherche multilingue
fix: corriger l'affichage mobile du formulaire contact
docs: mettre à jour le README avec les instructions de déploiement
style: améliorer l'espacement des boutons CTA
```

## 🎯 Zones de contribution

### Accessibilité 🧿
- Améliorer la conformité WCAG 2.2 AA
- Tester avec les lecteurs d'écran
- Optimiser la navigation au clavier

### Performance ⚡
- Optimiser les images et fonts
- Réduire la taille des bundles JavaScript
- Améliorer les Core Web Vitals

### SEO 📈
- Améliorer les balises meta
- Optimiser le balisage sémantique
- Enrichir les données structurées

### Traductions 🌍
- Corriger/améliorer les traductions NL/DE/SV
- Ajouter du contexte pour les traducteurs
- Vérifier la cohérence terminologique

### Tests 🧪
- Ajouter des tests unitaires
- Étendre la couverture E2E
- Tests d'accessibilité automatisés

## 🚀 Configuration locale

### Prérequis
- PHP 8.0+
- Node.js 18+
- Git

### Installation
```bash
git clone https://github.com/reulandbenjamin/website.git
cd website
npm install
cp .env.example .env
# Configurer .env avec vos clés de test
```

### Serveur de développement
```bash
# Serveur PHP simple
php -S localhost:8000

# Ou avec un serveur local (XAMPP, WAMP, etc.)
```

### Tests
```bash
# Tests complets
npm run test:all

# Tests spécifiques
npm run test:unit
npm run test:e2e
npm run test:a11y
```

## 🎨 Design System

### Palette de couleurs TerracottaNavy
- `#F0EFE9` - Background principal
- `#EDE8E0` - Background secondaire
- `#2E3B55` - Texte principal (Navy)
- `#4A5A78` - Texte secondaire
- `#C58D76` - Accent (Terracotta)
- `#F2DED6` - Sélection

### Typographie
- **Titres** : Space Grotesk
- **Texte** : Roboto
- Tailles : 14px, 16px, 18px, 24px, 32px, 48px

### Espacements
- Base : 8px
- Échelle : 8px, 16px, 24px, 32px, 48px, 64px

## 🔍 Review Process

### Checklist avant PR
- [ ] Code linter sans erreur
- [ ] Tests passent
- [ ] Documentation mise à jour
- [ ] Accessibilité vérifiée
- [ ] Performance testée
- [ ] Mobile responsive

### Review criteria
- Qualité du code et lisibilité
- Conformité aux standards du projet
- Impact sur les performances
- Accessibilité et UX
- Tests et documentation

## 🚑 Support

- **Questions** : Ouvrir une [discussion GitHub](https://github.com/reulandbenjamin/website/discussions)
- **Bugs** : Créer une [issue](https://github.com/reulandbenjamin/website/issues)
- **Contact** : contact@benjamin-reuland.be

## 🙏 Reconnaissance

Toutes les contributions sont les bienvenues et seront créditées dans la documentation du projet.

Merci de nous aider à améliorer benjamin-reuland.be ! 🎆