export const dropTablesQuery = `
    DROP TABLE IF EXISTS blocks;    
    DROP TABLE IF EXISTS tx;    
`;

export const createTablesQuery = `
  CREATE TABLE IF NOT EXISTS blocks(
    height INTEGER PRIMARY KEY,
    cur_block TEXT,
    prev_block TEXT,
    merkle_root TEXT,
    "timestamp" INTEGER,
    CID TEXT
  );
  CREATE INDEX curBlockHashIndex on blocks (cur_block);

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

export const insertBlockQuery = `
  INSERT INTO blocks(
      height,
      cur_block,
      prev_block,
      merkle_root,
      "timestamp",
      CID
    ) VALUES (?,?,?,?,?,?)
`;

export const insertTxQuery = `
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

export const selectBlockByHeightQuery = `
    SELECT * FROM blocks WHERE height = ?
`;

export const selectBlockLastHeight = `
    SELECT MAX(height) as height FROM blocks
`;

export const selectBlockByHashQuery = `
    SELECT * FROM blocks WHERE cur_block = ?
`;

export const deleteTxByHashQuery = `
    DELETE FROM tx WHERE hash = ?
`;

export const selectTxByIDQuery = `
    SELECT * FROM tx WHERE tx_id = ?
`;

export const selectTxByHashQuery = `
    SELECT * FROM tx WHERE hash = ?
`;

export const selectTxByLengthQuery = `
    SELECT * FROM tx ORDER BY tx_id ASC LIMIT ?
`;

export const selectTxsLength = `
    SELECT COUNT(tx_id) as count FROM tx
`;
