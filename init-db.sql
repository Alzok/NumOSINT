-- Script d'initialisation de la base de données PostgreSQL pour NumOSINT
-- Création des tables pour la nouvelle architecture multi-outils

-- Extension pour les UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des investigations (dossiers d'enquête)
CREATE TABLE IF NOT EXISTS investigations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    status VARCHAR(20) NOT NULL DEFAULT 'INITIALIZING',
    progress INTEGER NOT NULL DEFAULT 0,
    current_step VARCHAR(50),
    input_data JSONB,
    final_report JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des indicateurs (données d'entrée et découvertes)
CREATE TABLE IF NOT EXISTS indicators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investigation_id UUID NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- NAME, EMAIL, USERNAME, PHONE, IP, DOMAIN, URL
    value TEXT NOT NULL,
    source VARCHAR(50), -- buster, mosint, maigret, phoneinfoga, spiderfoot
    confidence FLOAT DEFAULT 0.5,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(investigation_id, type, value)
);

-- Table des résultats (données brutes des outils)
CREATE TABLE IF NOT EXISTS results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investigation_id UUID NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
    indicator_id UUID REFERENCES indicators(id) ON DELETE CASCADE,
    tool_source VARCHAR(50) NOT NULL, -- buster, mosint, maigret, phoneinfoga, spiderfoot
    data JSONB NOT NULL,
    score FLOAT DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des logs d'investigation
CREATE TABLE IF NOT EXISTS investigation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investigation_id UUID NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
    step VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    level VARCHAR(10) DEFAULT 'INFO', -- INFO, WARNING, ERROR, DEBUG
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_investigations_status ON investigations(status);
CREATE INDEX IF NOT EXISTS idx_investigations_created_at ON investigations(created_at);
CREATE INDEX IF NOT EXISTS idx_indicators_investigation_id ON indicators(investigation_id);
CREATE INDEX IF NOT EXISTS idx_indicators_type ON indicators(type);
CREATE INDEX IF NOT EXISTS idx_indicators_source ON indicators(source);
CREATE INDEX IF NOT EXISTS idx_results_investigation_id ON results(investigation_id);
CREATE INDEX IF NOT EXISTS idx_results_tool_source ON results(tool_source);
CREATE INDEX IF NOT EXISTS idx_logs_investigation_id ON investigation_logs(investigation_id);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON investigation_logs(timestamp);

-- Index pour la recherche full-text
CREATE INDEX IF NOT EXISTS idx_indicators_value_gin ON indicators USING gin(to_tsvector('english', value));
CREATE INDEX IF NOT EXISTS idx_results_data_gin ON results USING gin(data);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_investigations_updated_at 
    BEFORE UPDATE ON investigations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Vues pour faciliter les requêtes
CREATE OR REPLACE VIEW investigation_summary AS
SELECT 
    i.id,
    i.status,
    i.progress,
    i.current_step,
    i.created_at,
    i.updated_at,
    COUNT(DISTINCT ind.id) as indicator_count,
    COUNT(DISTINCT r.id) as result_count
FROM investigations i
LEFT JOIN indicators ind ON i.id = ind.investigation_id
LEFT JOIN results r ON i.id = r.investigation_id
GROUP BY i.id, i.status, i.progress, i.current_step, i.created_at, i.updated_at;

-- Fonction pour nettoyer les anciennes données
CREATE OR REPLACE FUNCTION cleanup_old_investigations(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM investigations 
    WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep
    AND status IN ('COMPLETED', 'FAILED');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Insertion de données de test (optionnel)
INSERT INTO investigations (id, status, progress, input_data) VALUES 
    (uuid_generate_v4(), 'COMPLETED', 100, '{"names": ["John Doe"], "emails": ["john.doe@example.com"]}'),
    (uuid_generate_v4(), 'ENRICHING', 45, '{"names": ["Jane Smith"], "phones": ["+1234567890"]}')
ON CONFLICT DO NOTHING;

-- Création d'un utilisateur avec permissions limitées pour l'application
-- (à utiliser dans la configuration de l'application)
-- CREATE USER numosint_app WITH PASSWORD 'app_password';
-- GRANT CONNECT ON DATABASE numosint TO numosint_app;
-- GRANT USAGE ON SCHEMA public TO numosint_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO numosint_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO numosint_app;