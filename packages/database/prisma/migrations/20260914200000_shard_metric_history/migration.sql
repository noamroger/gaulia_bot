-- CreateTable
CREATE TABLE "shard_metric_samples" (
    "shardId" INTEGER NOT NULL,
    "bucket" TIMESTAMP(3) NOT NULL,
    "guildCount" INTEGER NOT NULL,
    "memberCount" INTEGER NOT NULL,
    "pingTotal" INTEGER NOT NULL DEFAULT 0,
    "pingSamples" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shard_metric_samples_pkey" PRIMARY KEY ("shardId","bucket")
);

-- CreateIndex
CREATE INDEX "shard_metric_samples_bucket_idx" ON "shard_metric_samples"("bucket");

