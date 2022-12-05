/**
 *  The class that defines the transaction pool
 *
 *  Copyright:
 *      Copyright (c) 2022 BOSAGORA Foundation All rights reserved.
 *
 *  License:
 *       MIT License. See LICENSE for details.
 */

import { logger } from "../common/Logger";
import { DBTransaction, RollupStorage } from "../storage/RollupStorage";

export class TransactionPool {
    private _storage: RollupStorage | undefined;

    get storage(): RollupStorage {
        if (this._storage !== undefined) return this._storage;
        else {
            logger.error("Storage is not ready yet.");
            process.exit(1);
        }
    }

    set storage(storage) {
        this._storage = storage;
    }

    /**
     * Insert transactions in the storage.
     * @param tx transaction to be added
     */
    public async add(tx: DBTransaction | DBTransaction[]) {
        try {
            if (Array.isArray(tx)) {
                await this.storage.insert(tx);
            } else {
                await this.storage.insert([tx]);
            }
        } catch (e) {
            throw new Error("TransactionPool::added error:" + e);
        }
    }

    /**
     * Query the transactions in the storage in the order in which they are entered.
     * @param length Number of transactions desired
     */
    public async get(length: number): Promise<DBTransaction[]> {
        if (length <= 0) return [];
        return this.storage.selectByLength(length);
    }

    /**
     * Delete transactions in the storage.
     * @param tx transaction to be deleted
     */
    public async remove(tx: DBTransaction | DBTransaction[]) {
        try {
            if (Array.isArray(tx)) {
                for (const t of tx) {
                    await this.storage.deleteByHash(t.hash);
                }
            } else {
                await this.storage.deleteByHash(tx.hash);
            }
        } catch (e) {
            throw new Error("TransactionPool::remove error:" + e);
        }
    }

    /**
     * Total number of transactions in storage
     */
    public async length(): Promise<number> {
        return this.storage.length();
    }
}
