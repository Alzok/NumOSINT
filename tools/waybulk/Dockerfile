# Étape 1: Builder les dépendances
FROM python:3.9-slim AS builder

WORKDIR /app
RUN python3 -m venv /py
ENV PATH="/py/bin:$PATH"
COPY requirements.txt .
RUN pip install -r requirements.txt

# Étape 2: Image finale
FROM python:3.9-slim
WORKDIR /app

# Créer un utilisateur non-privilégié
RUN addgroup --system app && adduser --system --ingroup app app

# Copier les dépendances et le code
COPY --from=builder /py /py
COPY server.py .
COPY waybulk.py .
COPY domains.txt .

# Définir les permissions et l'utilisateur
ENV PATH="/py/bin:$PATH"
RUN chown -R app:app /app
USER app

# Exposer le port et lancer le serveur
EXPOSE 5004
CMD ["python", "server.py"]