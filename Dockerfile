# Multi-stage build per ottimizzare l'immagine finale
FROM node:18-alpine AS builder

# Installa le dipendenze di sistema necessarie per la build
RUN apk add --no-cache git python3 make g++

# Imposta la directory di lavoro
WORKDIR /app

# Copia tutti i file di configurazione necessari
COPY . .

# Imposta NODE_ENV a development per includere le devDependencies
ENV NODE_ENV=development

# Installa TUTTE le dipendenze (dev + production) per la build
RUN npm install

# Esegue la build del progetto TypeScript
RUN npm run build

# Stage finale con immagine ottimizzata
FROM node:18-alpine AS runtime

# Installa solo le dipendenze runtime necessarie
RUN apk add --no-cache dumb-init

# Crea un utente non-root per sicurezza
RUN addgroup -g 1001 -S nodejs && \
    adduser -S outline -u 1001 -G nodejs

# Imposta la directory di lavoro
WORKDIR /app

# Copia i file necessari dal builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/build/ ./build/
COPY --from=builder /app/bin/ ./bin/


RUN chown -R outline:nodejs /app

# Cambia all'utente non-root
USER outline

# Espone la porta (configurabile tramite variabile d'ambiente)
EXPOSE 6060

# Usa dumb-init per gestire correttamente i segnali
ENTRYPOINT ["dumb-init", "--"]

# Comando predefinito per lanciare il server
CMD ["node", "bin/cli.js"]
