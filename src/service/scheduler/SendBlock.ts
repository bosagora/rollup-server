/**
 *  A class that transmits block information to the blockchain.
 *
 *  Copyright:
 *      Copyright (c) 2022 BOSAGORA Foundation All rights reserved.
 *
 *  License:
 *       MIT License. See LICENSE for details.
 */

import { NonceManager } from "@ethersproject/experimental";
import { BigNumber, Wallet } from "ethers";
import express from "express";
import fs from "fs";
import { ethers } from "hardhat";
import { Scheduler } from "../../modules";
import { Config } from "../common/Config";
import { logger } from "../common/Logger";
import { RollUp } from "../../../typechain-types";
import { Block } from "rollup-pm-sdk";
import { GasPriceManager } from "../contract/GasPriceManager";
import { RollupStorage } from "../storage/RollupStorage";

export class SendBlock extends Scheduler {
    public _config: Config | undefined;

    private _storage: RollupStorage | undefined;

    private _rollup: RollUp | undefined;

    private _adminSigner: NonceManager | undefined;

    private _provider: any;

    uint64max = 18446744073709551615n;

    rollup_artifact = JSON.parse(fs.readFileSync("./artifacts/contracts/RollUp.sol/RollUp.json", "utf8"));

    constructor(interval: number = 14) {
        // interval second
        super(interval);
        this._provider = ethers.provider;
    }

    /**
     * 설정
     */
    private get config(): Config {
        if (this._config !== undefined) return this._config;
        else {
            logger.error("Config is not ready yet.");
            process.exit(1);
        }
    }

    private get adminSigner(): NonceManager {
        if (this._adminSigner !== undefined) return this._adminSigner;
        else {
            logger.error("AdminSigner is not ready yet.");
            process.exit(1);
        }
    }

    private get storage(): RollupStorage {
        if (this._storage !== undefined) return this._storage;
        else {
            logger.error("Storage is not ready yet.");
            process.exit(1);
        }
    }

    /**
     * 실행에 필요한 여러 객체를 설정한다
     * @param options 옵션
     */
    public setOption(options: any) {
        if (options) {
            if (options.config && options.config instanceof Config) this._config = options.config;
            if (options.storage && options.storage instanceof RollupStorage) {
                this._storage = options.storage;
            }
        }
    }

    /**
     * Look up the new block in the DB and add the block to the rollup contract.
     * @protected
     */
    protected override async work() {
        try {
            let success: boolean = false; // 0:Fail 1:Seccess
            if (this._rollup === undefined) {
                const manager = new Wallet(this.config.contracts.rollup_manager_key || "");
                this._adminSigner = new NonceManager(new GasPriceManager(this._provider.getSigner(manager.address)));
                this._rollup = new ethers.Contract(
                    this.config.contracts.rollup_address,
                    this.rollup_artifact.abi,
                    this._provider
                ) as RollUp;
            }

            const last_height: bigint = BigInt(
                BigNumber.from(await this._rollup.connect(this.adminSigner).getLastHeight()).toString()
            );
            const db_last_height = await this.storage.selectLastHeight();

            if (last_height === undefined) {
                logger.info(`The contract has not set the last block height.`);
                return;
            }

            if (db_last_height === Number.NaN) {
                logger.info(`No block data in DB.`);
                return;
            }

            if (last_height >= db_last_height) {
                logger.info(
                    `The last block height of the DB is equal to or lower than the last block height of the contract.`
                );
            }

            let data: any = null;
            // Genesis Block
            if (last_height === this.uint64max && db_last_height >= 0) {
                data = await this.storage.selectBlockByHeight(0);
            } else if (db_last_height > last_height) {
                data = await this.storage.selectBlockByHeight(Number(last_height + 1n));
            }

            if (data) {
                await this._rollup
                    .connect(this.adminSigner)
                    .add(data.height, data.cur_block, data.prev_block, data.merkle_root, data.timestamp, data.CID)
                    .then(() => {
                        logger.info(`Successful in adding blocks to the blockchain. Height: ${data.height}`);
                        success = true;
                    });
            } else {
                logger.info(`This block is not ready.`);
            }
        } catch (error) {
            logger.error(`Failed to execute the Send Block: ${error}`);
        }
    }
}
