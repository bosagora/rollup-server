/**
 *  The class that defines the transaction pool
 *
 *  Copyright:
 *      Copyright (c) 2022 BOSAGORA Foundation All rights reserved.
 *
 *  License:
 *       MIT License. See LICENSE for details.
 */

import { Transaction } from "../data/Transaction";

export class TransactionPool {
    public txs: Transaction[];

    constructor() {
        this.txs = [];
    }

    public get length(): number {
        return this.txs.length;
    }

    public add(tx: Transaction) {
        this.txs.push(tx);
    }

    public extract(length: number): Transaction[] {
        let result: Transaction[];
        if (length <= 0) return [];

        result = [];
        for (let idx = 0; idx < length; idx++) {
            const item = this.txs.shift();
            if (item !== undefined) result.push(item);
            else break;
        }
        return result;
    }
}
