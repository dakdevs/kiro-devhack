-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set up proper permissions
GRANT ALL PRIVILEGES ON DATABASE myapp TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;