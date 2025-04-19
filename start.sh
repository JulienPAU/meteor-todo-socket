#!/bin/bash

echo "===== VÉRIFICATION DES VARIABLES D'ENVIRONNEMENT ====="
echo "PORT: $PORT"
echo "ROOT_URL: $ROOT_URL"

# S'assurer que MONGO_URL est défini
if [ -z "$MONGO_URL" ]; then
  echo "ERREUR: MONGO_URL n'est pas défini!"
  exit 1
else
  echo "MONGO_URL est correctement défini"
fi

echo "===== DÉMARRAGE DE L'APPLICATION ====="
cd /build/bundle
exec node main.js