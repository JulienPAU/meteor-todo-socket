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
  
  # Extraire le nom d'hôte de MONGO_URL pour diagnostic
  HOST=$(echo $MONGO_URL | grep -oP '(?<=@)[^:]+(?=:)' || echo $MONGO_URL | grep -oP '(?<=\/\/)[^:\/]+')
  echo "Nom d'hôte MongoDB extrait: $HOST"
  
  # Vérifier si l'hôte est railway.internal
  if [[ $HOST == *"railway.internal"* ]]; then
    echo "Hôte Railway interne détecté. Tentative de correction..."
    
    # Essayer de trouver l'adresse IP de l'instance MongoDB Railway
    MONGO_IP=$(dig mongodb.railway.internal +short || echo "")
    
    if [ -n "$MONGO_IP" ]; then
      echo "IP de MongoDB trouvée: $MONGO_IP"
    else
      echo "Impossible de résoudre l'IP de MongoDB. Utilisons l'approche alternative..."
      
      # Essayer de remplacer l'URL interne par un hôte localhost
      # Cette approche fonctionne car Railway connecte les services internes
      export MONGO_URL=$(echo $MONGO_URL | sed 's/mongodb\.railway\.internal/localhost/g')
      echo "MONGO_URL modifiée pour utiliser localhost"
    fi
  fi
fi

echo "===== DÉMARRAGE DE L'APPLICATION ====="
exec node main.js