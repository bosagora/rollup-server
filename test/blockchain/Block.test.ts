/**
 *  This tests the serialization and deserialization
 *
 *  Copyright:
 *      Copyright (c) 2022 BOSAGORA Foundation All rights reserved.
 *
 *  License:
 *       MIT License. See LICENSE for details.
 */

import { Block, Hash, hashFull, Transaction } from "../../src/modules";

import * as assert from "assert";

describe("Test of Block", () => {
    it("Test buildMerkleTree", () => {
        const txs = [];
        const txs_hash = [];
        for (let idx = 0; idx < 7; idx++) {
            txs.push(
                new Transaction(
                    "12345678",
                    "0x064c9Fc53d5936792845ca58778a52317fCf47F2",
                    "0x67e4996358fEfa5c3A90b21fCf3B889C25759f3A",
                    BigInt(idx + 1),
                    1668044556
                )
            );
            txs_hash.push(hashFull(txs[idx]));
        }

        const merkel_tree = Block.buildMerkleTree(txs_hash);
        assert.strictEqual(merkel_tree.length, txs_hash.length + 7);
    });

    it("Test createBlock", () => {
        const txs = [
            new Transaction(
                "00000000",
                "0x0000000000000000000000000000000000000000",
                "0x67e4996358fEfa5c3A90b21fCf3B889C25759f3A",
                1000000000n,
                1668044556
            ),
            new Transaction(
                "00000000",
                "0x0000000000000000000000000000000000000000",
                "0x28e76f008F5c023122fB45ff389b4eDd9585f99b",
                1000000000n,
                1668044556
            ),
            new Transaction(
                "00000000",
                "0x0000000000000000000000000000000000000000",
                "0xD5c43B3b9c83f28DdC6Ab83b37281ea532743F2c",
                1000000000n,
                1668044556
            ),
            new Transaction(
                "00000000",
                "0x0000000000000000000000000000000000000000",
                "0x5Db97BBEad6979AeD57cB9Fb19c78eDB08187436",
                1000000000n,
                1668044556
            ),
            new Transaction(
                "00000000",
                "0x0000000000000000000000000000000000000000",
                "0xC08b6C6e6190660005e393E9e15130F1b8f8e17E",
                1000000000n,
                1668044556
            ),
        ];
        const prev_hash = Hash.Null;
        const prev_height = 0n;

        const block = Block.createBlock(prev_hash, prev_height, txs);
        const block_string = JSON.stringify(block);
        const block_json = JSON.parse(block_string);

        const block2 = Block.reviver("", block_json);

        assert.deepStrictEqual(block, block2);
    });
});
