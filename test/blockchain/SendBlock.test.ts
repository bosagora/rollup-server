/**
 *  Test to transfer block information to the blockchain
 *
 *  Copyright:
 *      Copyright (c) 2022 BOSAGORA Foundation All rights reserved.
 *
 *  License:
 *       MIT License. See LICENSE for details.
 */

import { BigNumber, Wallet } from "ethers";
import { ethers, waffle } from "hardhat";

import { Block, Hash, hashFull } from "rollup-pm-sdk";
import { Config } from "../../src/service/common/Config";
import { SendBlock } from "../../src/service/scheduler/SendBlock";
import { HardhatUtils } from "../../src/service/utils";
import { RollUp } from "../../typechain-types";
import { delay } from "../Utility";

import * as assert from "assert";
import path from "path";
import { RollupStorage } from "../../src/service/storage/RollupStorage";

describe("Test of SendBlock", () => {
    let sendBlock: SendBlock;
    let rollUp: RollUp;
    const config = new Config();
    let storage: RollupStorage;

    const provider = waffle.provider;
    config.readFromFile(path.resolve(process.cwd(), "config/config_test.yaml"));
    const admin = new Wallet(config.contracts.rollup_manager_key || "");
    const admin_signer = provider.getSigner(admin.address);

    before("Deploy Rollup Contract", async () => {
        rollUp = await HardhatUtils.deployRollupContract(config, admin);
    });

    after(() => {
        sendBlock.stop();
    });

    before("Create SendBlock", async () => {
        storage = await (() => {
            return new Promise<RollupStorage>((resolve, reject) => {
                const res = new RollupStorage(config.database, (err) => {
                    if (err !== null) reject(err);
                    else resolve(res);
                });
            });
        })();
        const send_block_scheduler = config.scheduler.getScheduler("send_block");
        if (send_block_scheduler && send_block_scheduler.enable) {
            sendBlock = new SendBlock(send_block_scheduler.interval);
        }
        sendBlock.setOption({ config, storage });
    });

    it("Start SendBlock", () => {
        sendBlock.start();
        assert.ok(sendBlock.isRunning());
    });

    it("Test of Insert Blocks & Send Block", async () => {
        const prev_hash = Hash.Null;
        const cid = "CID";
        const block_0 = Block.createBlock(prev_hash, 0n, []);
        block_0.header.height = 0n;
        const block_1 = Block.createBlock(hashFull(block_0), 0n, []);

        // Test Block height 0
        await storage.insertBlock(block_0, cid);
        await delay(2000);
        assert.deepStrictEqual(await rollUp.connect(admin_signer).getLastHeight(), BigNumber.from(0));
        assert.deepStrictEqual(await rollUp.size(), BigNumber.from(1));
        const sc_block_0 = await rollUp.connect(admin_signer).getByHeight(BigNumber.from(0));
        const db_block_0 = await storage.selectBlockByHeight(0);
        assert.deepStrictEqual(sc_block_0[0], BigNumber.from(db_block_0.height));
        assert.deepStrictEqual(sc_block_0[1], db_block_0.cur_block);
        assert.deepStrictEqual(sc_block_0[2], db_block_0.prev_block);
        assert.deepStrictEqual(sc_block_0[3], db_block_0.merkle_root);
        assert.deepStrictEqual(sc_block_0[4], BigNumber.from(db_block_0.timestamp));
        assert.deepStrictEqual(sc_block_0[5], db_block_0.CID);
        // Test Block height 1
        await storage.insertBlock(block_1, cid);
        await delay(2000);
        assert.deepStrictEqual(await rollUp.connect(admin_signer).getLastHeight(), BigNumber.from(1));
        assert.deepStrictEqual(await rollUp.size(), BigNumber.from(2));
        const sc_block_1 = await rollUp.connect(admin_signer).getByHeight(BigNumber.from(1));
        const db_block_1 = await storage.selectBlockByHeight(1);
        assert.deepStrictEqual(sc_block_1[0], BigNumber.from(db_block_1.height));
        assert.deepStrictEqual(sc_block_1[1], db_block_1.cur_block);
        assert.deepStrictEqual(sc_block_1[2], db_block_1.prev_block);
        assert.deepStrictEqual(sc_block_1[3], db_block_1.merkle_root);
        assert.deepStrictEqual(sc_block_1[4], BigNumber.from(db_block_1.timestamp));
        assert.deepStrictEqual(sc_block_1[5], db_block_1.CID);
    });
});
