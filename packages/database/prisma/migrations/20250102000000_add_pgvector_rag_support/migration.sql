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
-- This enables fast approximate nearest neighbor search
CREATE INDEX "ContentChunk_embedding_idx" ON "ContentChunk" USING ivfflat (embedding vector_cosine_ops);

-- Note: For production, you may want to tune the ivfflat index parameters:
-- CREATE INDEX "ContentChunk_embedding_idx" ON "ContentChunk"
-- USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
--
-- Recommended: Run this after inserting data:
-- CREATE INDEX CONCURRENTLY "ContentChunk_embedding_idx" ON "ContentChunk"
-- USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
