/**
 *  The class that defines the transaction pool
 *
 *  Copyright:
 *      Copyright (c) 2022 BOSAGORA Foundation All rights reserved.
 *
 *  License:
 *       MIT License. See LICENSE for details.
 */

import { hashFull } from "../common/Hash";
import { Transaction } from "../data/Transaction";

export class TransactionPool {
    private tx_map: Map<string, Transaction>;
    private readonly hash_array: string[];

    constructor() {
        this.tx_map = new Map<string, Transaction>();
        this.hash_array = [];
    }

    public add(tx: Transaction) {
        const hash = hashFull(tx).toString();
        if (!this.tx_map.has(hash)) {
            this.hash_array.push(hash);
            this.tx_map.set(hash, tx);
        }
    }

    public get(length: number): Transaction[] {
        let result: Transaction[];
        if (length <= 0) return [];

        result = [];
        for (let idx = 0; idx < length && idx < this.hash_array.length; idx++) {
            const hash = this.hash_array[idx];
            const tx = this.tx_map.get(hash);
            if (tx !== undefined) result.push(tx.clone());
        }
        return result;
    }

    public remove(txs: Transaction[]) {
        for (const tx of txs) {
            const hash = hashFull(tx).toString();
            if (this.tx_map.has(hash)) {
                this.tx_map.delete(hash);
                const found_idx = this.hash_array.findIndex((m) => m === hash);
                if (found_idx >= 0) this.hash_array.splice(found_idx, 1);
            }
        }
    }

    public get length(): number {
        return this.hash_array.length;
    }
}
