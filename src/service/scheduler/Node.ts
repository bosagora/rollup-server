/**
 *  The class that defines the block.
 *
 *  Copyright:
 *      Copyright (c) 2022 BOSAGORA Foundation All rights reserved.
 *
 *  License:
 *       MIT License. See LICENSE for details.
 */

import { Block, Hash, IPFSManager, Scheduler, Transaction, TransactionPool, Utils } from "../../modules/";
import { Config } from "../common/Config";
import { logger } from "../common/Logger";

export interface IBlockExternalizer {
    externalize(block: Block, cid: string): void;
}

export class Node extends Scheduler {
    public _config: Config | undefined;

    public externalizer: IBlockExternalizer | undefined;

    private pool: TransactionPool;
    private prev_hash: Hash;
    private prev_height: bigint;

    private old_time_stamp: number;
    private new_time_stamp: number;

    private _ipfs: IPFSManager | undefined;

    constructor() {
        super(1);
        this.pool = new TransactionPool();
        this.prev_hash = Hash.Null;
        this.prev_height = 0n;

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

    /**
     * 실행에 필요한 여러 객체를 설정한다
     * @param options 옵션
     */
    public setOption(options: any) {
        if (options) {
            if (options.config && options.config instanceof Config) this._config = options.config;
        }
        if (this._config !== undefined) {
            this._ipfs = new IPFSManager(this._config.node.ipfs_api_url);
            this._ipfs.setTest(this._config.node.ipfs_test);
        }
    }

    public setExternalizer(value: IBlockExternalizer) {
        this.externalizer = value;
    }

    public receive(tx: Transaction) {
        this.pool.add(tx);
    }

    public createBlock(): Block | undefined {
        const txs = this.pool.extract(this.config.node.max_txs);
        if (txs.length === 0) return undefined;

        const block = Block.createBlock(this.prev_hash, this.prev_height, txs);

        return block;
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
                const block = this.createBlock();
                if (block !== undefined) {
                    const cid = await this.ipfs.add(JSON.stringify(block));
                    if (this.externalizer !== undefined) this.externalizer.externalize(block, cid);
                }
            }
        } catch (error) {
            logger.error(`Failed to execute the bridge scheduler: ${error}`);
        }
    }
}
