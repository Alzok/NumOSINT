# Configuration des Ports - NumOSINT

## Nouveaux ports utilisés (pour éviter les conflits)

- **Frontend Next.js**: `3001` (était 3000)
- **Backend API**: `5001` (était 5000)
- **PostgreSQL**: `5435` (était 5433)
- **Redis**: `6380` (était 6379)
- **Nginx**: `8081` (était 80) et `8444` (était 443)

## Pour le développement local

1. **Frontend**: `npm run dev` utilise maintenant le port 3001
2. **Backend**: Définir `PORT=5001` dans votre `.env` ou utiliser la valeur par défaut
3. **PostgreSQL**: Connexion sur `localhost:5435`
4. **Redis**: Connexion sur `localhost:6380`

## Avec Docker

```bash
# Démarrage avec les nouveaux ports
docker-compose up -d

# Accès aux services
- Frontend: http://localhost:3001
- Backend API: http://localhost:5001
- Nginx: http://localhost:8081
- PostgreSQL: localhost:5435
- Redis: localhost:6380
```

## Variables d'environnement

### Backend (.env)
```env
PORT=5001
DATABASE_URL=postgresql://numosint:numosint_password@localhost:5435/numosint
REDIS_URL=redis://localhost:6380
NODE_ENV=development
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5001
``` 