# CLAUDE.md

> Dépôt en cours de réinitialisation. Les conventions spécifiques au projet
> seront (re)définies à réception du nouveau cahier des charges (PRD).

## Flux Git — envoi automatique sur `main` (règle permanente du propriétaire)

Toute modification terminée et vérifiée doit être **automatiquement publiée sur
`main`**, sans demander de confirmation à chaque fois. Procédure :

1. Committer avec l'identité **`Claude <noreply@anthropic.com>`** (sinon le
   commit s'affiche « Unverified » sur GitHub) :
   `git -c user.name=Claude -c user.email=noreply@anthropic.com commit …`.
2. `git push -u origin <branche>`.
3. Ouvrir la PR si absente, puis **merger la PR sur `main`** (méthode `merge`).
4. **Resynchroniser la branche avec `main` puis la pousser** :
   `git fetch origin main && git merge --ff-only origin/main && git push origin <branche>`
   (sinon le commit de merge créé par GitHub, committer `noreply@github.com`,
   reste en avance locale et le hook d'arrêt le signale comme « Unverified »).

Exceptions où l'on s'arrête pour demander : action destructrice/irréversible,
choix d'architecture significatif, ou ambiguïté réelle sur l'intention.
