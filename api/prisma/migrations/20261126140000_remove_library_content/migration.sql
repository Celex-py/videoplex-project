-- Remove the abandoned curated catalogue table without touching user uploads,
-- channels, live streams, or existing video records.
DROP TABLE IF EXISTS "LibraryContent";
