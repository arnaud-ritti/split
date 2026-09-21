# syntax=docker/dockerfile:1

# Étage 1 : build du bundle navigateur et du serveur SSR
FROM node:24-alpine AS build
WORKDIR /app
# Les dépendances d'abord : la couche est réutilisée tant que les lockfiles ne bougent pas.
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY . .
RUN npm run build

# Étage 2 : l'image finale, sans Node modules ni outillage de build
#
# Le builder Angular embarque Express et ses dépendances dans server.mjs : il ne reste que
# des imports Node natifs, donc l'image d'exécution n'a besoin de rien d'autre que Node.
FROM node:24-alpine
WORKDIR /app

ENV NODE_ENV=production \
    PORT=4000

# Fichiers copiés en root et servis en lecture seule : l'application tourne sous un compte
# qui ne peut pas réécrire son propre code.
COPY --from=build /app/dist/split ./dist/split

# `node` (uid 1000) existe déjà dans l'image officielle.
USER node
EXPOSE 4000

# Sonde de vivacité : toute réponse HTTP prouve que le process écoute et sert. Le statut
# n'est volontairement pas vérifié — la requête porte l'en-tête Host 127.0.0.1, que
# NG_ALLOWED_HOSTS rejette à juste titre. Les sondes applicatives, qui connaissent le vrai
# nom d'hôte, relèvent de l'orchestrateur.
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD ["node", "-e", "fetch('http://127.0.0.1:' + process.env.PORT + '/').then(() => process.exit(0), () => process.exit(1))"]

CMD ["node", "dist/split/server/server.mjs"]
