/**
 *  This tests the serialization and deserialization
 *
 *  Copyright:
 *      Copyright (c) 2022 BOSAGORA Foundation All rights reserved.
 *
 *  License:
 *       MIT License. See LICENSE for details.
 */

import * as ethers from "ethers";

import { Block, Hash, hashFull, Transaction, Utils } from "rollup-pm-sdk";
import { Config } from "../../src/service/common/Config";
import { IBlockExternalizer, Node } from "../../src/service/scheduler/Node";
import { delay } from "../Utility";

import * as assert from "assert";
import path from "path";
import { RollupStorage } from "../../src/service/storage/RollupStorage";

class BlockExternalizer implements IBlockExternalizer {
    public block: Block | undefined;
    public cid: string | undefined;
    public externalize(block: Block, cid: string) {
        this.block = block;
        this.cid = cid;
    }
}

describe("Test of Node", function () {
    this.timeout(1000 * 60 * 5);

    let node: Node;
    let externalizer: BlockExternalizer;
    const config = new Config();
    let storage: RollupStorage;
    const signer = new ethers.Wallet("0xf6dda8e03f9dce37c081e5d178c1fda2ebdb90b5b099de1a555a658270d8c47d");

    before("Create Node", async () => {
        config.readFromFile(path.resolve(process.cwd(), "config/config_test.yaml"));
        storage = await (() => {
            return new Promise<RollupStorage>((resolve, reject) => {
                const res = new RollupStorage(config.database, (err) => {
                    if (err !== null) reject(err);
                    else resolve(res);
                });
            });
        })();
        node = new Node();
        node.setOption({ config, storage });
        externalizer = new BlockExternalizer();
        node.setExternalizer(externalizer);
    });

    it("Start Node", () => {
        node.start();
        assert.ok(node.isRunning());
    });

    it("Send transactions", async () => {
        const txs = [];
        for (let idx = 0; idx < 8; idx++) {
            txs.push(
                new Transaction(
                    (12345670 + idx).toString(),
                    "0x064c9Fc53d5936792845ca58778a52317fCf47F2",
                    "0",
                    BigInt(idx + 1),
                    Utils.getTimeStamp(),
                    "997DE626B2D417F0361D61C09EB907A57226DB5B",
                    "a5c19fed89739383"
                )
            );
        }
        for (const tx of txs) await tx.sign(signer);

        const prev_hash = Hash.Null;
        const prev_height = 0n;
        const block = Block.createBlock(prev_hash, prev_height, txs);
        for (const tx of txs) await node.receive(tx);

        await delay(6000);

        assert.ok(externalizer.block !== undefined);
        block.header.timestamp = externalizer.block.header.timestamp;
        assert.deepStrictEqual(block, externalizer.block);
        assert.ok(externalizer.cid !== undefined);
        console.log(externalizer.cid);
    });
});
