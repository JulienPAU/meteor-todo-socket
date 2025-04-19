#!/bin/bash

echo "===== VÉRIFICATION DES VARIABLES D'ENVIRONNEMENT ====="
echo "PORT: $PORT"
echo "ROOT_URL: $ROOT_URL"

if [ -z "$MONGO_URL" ]; then
  echo "ERREUR: MONGO_URL n'est pas défini!"
  exit 1
else
  echo "MONGO_URL est correctement défini"
  
  HOST=$(echo $MONGO_URL | grep -oP '(?<=@)[^:]+(?=:)' || echo $MONGO_URL | grep -oP '(?<=\/\/)[^:\/]+')
  echo "Nom d'hôte MongoDB extrait: $HOST"
  
  if [[ $HOST == *"railway.internal"* ]]; then
    echo "Hôte Railway interne détecté. Tentative de correction..."
    
    MONGO_IP=$(dig mongodb.railway.internal +short || echo "")
    
    if [ -n "$MONGO_IP" ]; then
      echo "IP de MongoDB trouvée: $MONGO_IP"
    else
      echo "Impossible de résoudre l'IP de MongoDB. Utilisons l'approche alternative..."
      
      NEW_MONGO_URL=$(echo $MONGO_URL | sed 's/mongodb\.railway\.internal/localhost/g')
      export MONGO_URL=$NEW_MONGO_URL
      echo "MONGO_URL modifiée pour utiliser localhost"
      
      echo "Test de connexion à MongoDB..."
      if nc -z -v -w5 localhost 27017 2>/dev/null; then
        echo "Connexion à MongoDB réussie sur localhost:27017"
      else
        echo "ATTENTION: Impossible de se connecter à MongoDB sur localhost:27017"
        echo "Essai avec l'adresse IP 127.0.0.1..."
        
        NEW_MONGO_URL=$(echo $MONGO_URL | sed 's/localhost/127.0.0.1/g')
        export MONGO_URL=$NEW_MONGO_URL
        echo "MONGO_URL modifiée pour utiliser 127.0.0.1 explicitement"
      fi
    fi
  fi
fi

echo "===== DÉMARRAGE DE L'APPLICATION ====="
exec node main.js