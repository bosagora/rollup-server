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
            "0",
            BigInt(123),
            1668044556,
            "997DE626B2D417F0361D61C09EB907A57226DB5B",
            "a5c19fed89739383"
        );

        assert.strictEqual(
            hashFull(tx).toString(),
            "0x133f17377fc8dd6727afc80ac5428bac832deef8939c4c994c4bbc2806ed6715"
        );
    });

    it("Test for Transaction.clone()", () => {
        const tx = new Transaction(
            "12345678",
            "0x064c9Fc53d5936792845ca58778a52317fCf47F2",
            "0",
            BigInt(123),
            1668044556,
            "997DE626B2D417F0361D61C09EB907A57226DB5B",
            "a5c19fed89739383"
        );

        const clone_tx = tx.clone();
        assert.deepStrictEqual(tx, clone_tx);
    });
});
