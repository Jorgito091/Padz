# ROLLBACK STRATEGY

- DB first: restore DB snapshot before deploying older code if migration is irreversible.
- App: use previous container image tag and route traffic back (blue/green).
- Always run smoke tests after rollback.
