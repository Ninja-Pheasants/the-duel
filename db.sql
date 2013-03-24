DROP TABLE "the-duel";

CREATE TABLE "the-duel" (
  data text
)
WITH (
  OIDS=TRUE
);

-- init data with one row... I know it's stupid but that's life.
INSERT into "the-duel" (data) values ('');