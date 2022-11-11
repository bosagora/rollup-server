/**
 *  Test of Transaction
 *
 *  Copyright:
 *      Copyright (c) 2022 BOSAGORA Foundation All rights reserved.
 *
 *  License:
 *       MIT License. See LICENSE for details.
 */

import { hashFull, Transaction } from "../../src/modules";

import * as assert from "assert";

describe("Transaction", () => {
    // The test codes below compare with the values calculated in Agora.
    it("Test for hash value of transaction data", () => {
        const tx = new Transaction(
            "12345678",
            "0x064c9Fc53d5936792845ca58778a52317fCf47F2",
            "0x67e4996358fEfa5c3A90b21fCf3B889C25759f3A",
            BigInt(123),
            1668044556
        );

        assert.strictEqual(
            hashFull(tx).toString(),
            "0x5f5595cc8156772204f62e1450d0256ca4b23639b9f1f3ac0e1b5daec52400e6"
        );
    });

    it("Test for Transaction.clone()", () => {
        const tx = new Transaction(
            "12345678",
            "0x064c9Fc53d5936792845ca58778a52317fCf47F2",
            "0x67e4996358fEfa5c3A90b21fCf3B889C25759f3A",
            BigInt(123),
            1668044556
        );

        const clone_tx = tx.clone();
        assert.deepStrictEqual(tx, clone_tx);
    });
});
