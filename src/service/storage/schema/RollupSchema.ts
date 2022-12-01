export const dropQuery = `
    DROP TABLE IF EXISTS tx
`;

export const createTableQuery = `
  CREATE TABLE IF NOT EXISTS tx(
    trade_id TEXT PRIMARY KEY,
    user_id TEXT,
    "state" TEXT,
    amount TEXT,
    "timestamp" INTEGER,
    exchange_user_id TEXT,
    exchange_id TEXT,
    signer TEXT,
    signature TEXT
  )
`;

export const insertQuery = `
  INSERT OR REPLACE INTO tx(
    trade_id,
    user_id,
    "state",
    amount,
    "timestamp",
    exchange_user_id,
    exchange_id,
    signer,
    signature
    ) VALUES (?,?,?,?,?,?,?,?,?)
`;

export const deleteQuery = `
    DELETE FROM tx WHERE trade_id = ?
`;

export const selectQuery = `
    SELECT * FROM tx WHERE trade_id = ?
`;
