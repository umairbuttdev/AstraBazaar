-- CreateTable
CREATE TABLE "addresses" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "label" TEXT,
    "fullName" TEXT NOT NULL,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'US',
    "phone" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "addresses_profileId_idx" ON "addresses"("profileId");

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill distinct delivery snapshots already stored on orders.
-- The newest snapshot for each customer becomes the default address.
INSERT INTO "addresses" (
    "id",
    "profileId",
    "fullName",
    "line1",
    "line2",
    "city",
    "state",
    "postalCode",
    "country",
    "phone",
    "isDefault",
    "createdAt",
    "updatedAt"
)
SELECT
    gen_random_uuid()::text,
    ranked."profileId",
    ranked."fullName",
    ranked."line1",
    ranked."line2",
    ranked."city",
    ranked."state",
    ranked."postalCode",
    ranked."country",
    ranked."phone",
    ranked.rn = 1,
    ranked."createdAt",
    ranked."createdAt"
FROM (
    SELECT
        deduped.*,
        ROW_NUMBER() OVER (
            PARTITION BY deduped."profileId"
            ORDER BY deduped."createdAt" DESC
        ) AS rn
    FROM (
        SELECT DISTINCT ON (
            "profileId",
            lower("fullName"),
            lower("line1"),
            lower(COALESCE("line2", '')),
            lower("city"),
            lower(COALESCE("state", '')),
            lower("postalCode"),
            lower("country"),
            lower(COALESCE("phone", ''))
        )
            "profileId",
            "fullName",
            "line1",
            "line2",
            "city",
            "state",
            "postalCode",
            "country",
            "phone",
            "createdAt"
        FROM "orders"
        ORDER BY
            "profileId",
            lower("fullName"),
            lower("line1"),
            lower(COALESCE("line2", '')),
            lower("city"),
            lower(COALESCE("state", '')),
            lower("postalCode"),
            lower("country"),
            lower(COALESCE("phone", '')),
            "createdAt" DESC
    ) AS deduped
) AS ranked;
