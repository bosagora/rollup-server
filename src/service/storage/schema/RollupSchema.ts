export const dropQuery = `
    DROP TABLE IF EXISTS tx
`;

export const createTxTableQuery = `
  CREATE TABLE IF NOT EXISTS tx(
    tx_id INTEGER PRIMARY KEY AUTOINCREMENT,
    trade_id TEXT,
    user_id TEXT,
    "state" TEXT,
    amount TEXT,
    "timestamp" INTEGER,
    exchange_user_id TEXT,
    exchange_id TEXT,
    signer TEXT,
    signature TEXT,
    hash TEXT
  );
  CREATE INDEX txHashIndex on tx (hash);
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
    signature,
    hash
    ) VALUES (?,?,?,?,?,?,?,?,?,?)
`;

export const deleteByHashQuery = `
    DELETE FROM tx WHERE hash = ?
`;

export const selectQueryByID = `
    SELECT * FROM tx WHERE tx_id = ?
`;

export const selectByHashQuery = `
    SELECT * FROM tx WHERE hash = ?
`;

export const selectByLengthQuery = `
    SELECT * FROM tx ORDER BY tx_id ASC LIMIT ?
`;

export const selectLength = `
    SELECT COUNT(tx_id) as count FROM tx
`;
