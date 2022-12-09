/**
 *  The class that defines the block.
 *
 *  Copyright:
 *      Copyright (c) 2022 BOSAGORA Foundation All rights reserved.
 *
 *  License:
 *       MIT License. See LICENSE for details.
 */

import { IPFSManager, Scheduler } from "../../modules";
import { Config } from "../common/Config";
import { logger } from "../common/Logger";
import { TransactionPool } from "./TransactionPool";

import { Block, Hash, hashFull, Transaction, Utils } from "rollup-pm-sdk";
import { DBTransaction, RollupStorage } from "../storage/RollupStorage";

export interface IBlockExternalizer {
    externalize(block: Block, cid: string): void;
}

export class Node extends Scheduler {
    public _config: Config | undefined;

    public externalizer: IBlockExternalizer | undefined;

    private _pool: TransactionPool | undefined;
    private prev_hash: Hash;
    private prev_height: bigint;

    private old_time_stamp: number;
    private new_time_stamp: number;

    private _ipfs: IPFSManager | undefined;

    private _storage: RollupStorage | undefined;

    constructor(interval: number = 1) {
        super(interval);
        this._pool = new TransactionPool();
        this.prev_hash = Hash.Null;
        this.prev_height = -1n;

        this.old_time_stamp = Utils.getTimeStamp();
        this.new_time_stamp = this.old_time_stamp;

        this.externalizer = undefined;
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

    private get ipfs(): IPFSManager {
        if (this._ipfs !== undefined) return this._ipfs;
        else {
            logger.error("IPFSManager is not ready yet.");
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

    private get pool(): TransactionPool {
        if (this._pool !== undefined) return this._pool;
        else {
            logger.error("TransactionPool is not ready yet.");
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
            if (options.pool && options.pool instanceof TransactionPool) {
                this._pool = options.pool;
            }
        }
        if (this._config !== undefined) {
            this._ipfs = new IPFSManager(this._config.node.ipfs_api_url);
            this._ipfs.setTest(this._config.node.ipfs_test);
        }
    }

    public setExternalizer(value: IBlockExternalizer) {
        this.externalizer = value;
    }

    public async receive(tx: Transaction) {
        await this.pool.add(DBTransaction.make(tx));
    }

    /**
     * 실제 작업
     * @protected
     */
    protected override async work() {
        this.new_time_stamp = Utils.getTimeStamp();
        try {
            const old_period = Math.floor(this.old_time_stamp / this.config.node.interval);
            const new_period = Math.floor(this.new_time_stamp / this.config.node.interval);
            if (old_period !== new_period) {
                this.old_time_stamp = this.new_time_stamp;
                const txs = await this.pool.get(this.config.node.max_txs);

                if (txs.length > 0) {
                    const txList = DBTransaction.converterTxArray(txs);

                    if (this.prev_height === -1n) {
                        const db_last_height = await this.storage.selectLastHeight();
                        if (db_last_height !== null) {
                            const db_block = await this.storage.selectBlockByHeight(db_last_height);
                            this.prev_height = BigInt(db_block.height);
                            this.prev_hash = new Hash(db_block.prev_hash);
                        }
                    }

                    const block = Block.createBlock(this.prev_hash, this.prev_height, txList);

                    let cid: string = "";
                    let success: boolean = true;

                    try {
                        // Save block to IPFS
                        cid = await this.ipfs.add(JSON.stringify(block));
                    } catch {
                        success = false;
                    }

                    if (success) {
                        try {
                            // Save block info to the database
                            await this.storage.insertBlock(block, cid);
                        } catch {
                            success = false;
                        }
                    }

                    if (success) {
                        this.prev_hash = hashFull(block.header);
                        this.prev_height = block.header.height;
                        await this.pool.remove(txs);
                        if (this.externalizer !== undefined) this.externalizer.externalize(block, cid);
                    }
                }
            }
        } catch (error) {
            logger.error(`Failed to execute the node scheduler: ${error}`);
        }
    }
}
