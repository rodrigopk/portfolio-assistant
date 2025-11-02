-- Enable pgvector extension for RAG implementation
-- Based on TECHNICAL_DOCUMENTATION.md Section 3.7

-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable: ContentChunk for RAG vector storage
CREATE TABLE "ContentChunk" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(1536),
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "category" TEXT,
    "metadata" JSONB,
    "chunkIndex" INTEGER NOT NULL,
    "tokenCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentChunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Optimize vector similarity search
CREATE INDEX "ContentChunk_sourceType_sourceId_idx" ON "ContentChunk"("sourceType", "sourceId");
CREATE INDEX "ContentChunk_sourceType_category_idx" ON "ContentChunk"("sourceType", "category");
CREATE INDEX "ContentChunk_sourceId_idx" ON "ContentChunk"("sourceId");

-- CreateIndex: Vector similarity search using cosine distance
-- This enables fast approximate nearest neighbor search using IVFFlat algorithm
--
-- IMPORTANT: The default configuration below is suitable for development and small datasets.
-- For production use with larger datasets, you should tune the 'lists' parameter:
--
-- TUNING GUIDELINES:
-- - lists parameter controls the number of inverted lists (clusters)
-- - Rule of thumb: lists = rows / 1000 for datasets < 1M rows
-- - For 10k chunks: lists = 10
-- - For 100k chunks: lists = 100 (as shown in commented example)
-- - For 1M+ chunks: lists = sqrt(rows) or higher
--
-- RECOMMENDED PRODUCTION SETUP:
-- 1. Create the table and insert your data first
-- 2. Drop this index: DROP INDEX "ContentChunk_embedding_idx";
-- 3. Create optimized index with CONCURRENTLY to avoid blocking:
--    CREATE INDEX CONCURRENTLY "ContentChunk_embedding_idx" ON "ContentChunk"
--    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
--
-- Note: Building the index CONCURRENTLY allows table access during index creation
-- but requires more disk space and takes longer to complete.

CREATE INDEX "ContentChunk_embedding_idx" ON "ContentChunk" USING ivfflat (embedding vector_cosine_ops);
