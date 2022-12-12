/**
 *  Main of Remote Wallet Server
 *
 *  Copyright:
 *      Copyright (c) 2022 BOSAGORA Foundation All rights reserved.
 *
 *  License:
 *       MIT License. See LICENSE for details.
 */

import { Wallet } from "ethers";
import { IScheduler } from "./modules/scheduler/Scheduler";
import { Config } from "./service/common/Config";
import { logger, Logger } from "./service/common/Logger";
import { RollupServer } from "./service/RollupServer";
import { LastBlockInfo } from "./service/scheduler/LastBlockInfo";
import { Node } from "./service/scheduler/Node";
import { SendBlock } from "./service/scheduler/SendBlock";
import { RollupStorage } from "./service/storage/RollupStorage";
import { HardhatUtils } from "./service/utils";

let server: RollupServer;

async function main() {
    // Create with the arguments and read from file
    const config = Config.createWithArgument();

    // Now configure the logger with the expected transports
    switch (process.env.NODE_ENV) {
        case "test":
            // Logger is silent, do nothing
            break;

        case "development":
            // Only use the console log
            logger.add(Logger.defaultConsoleTransport());
            break;

        case "production":
        default:
            // Read the config file and potentially use both
            logger.add(Logger.defaultFileTransport(config.logging.folder));
            if (config.logging.console) logger.add(Logger.defaultConsoleTransport());
    }
    logger.transports.forEach((tp) => {
        tp.level = config.logging.level;
    });

    logger.info(`address: ${config.server.address}`);
    logger.info(`port: ${config.server.port}`);

    let node: Node;
    const schedulers: IScheduler[] = [];
    if (config.scheduler.enable) {
        let scheduler = config.scheduler.getScheduler("node");
        if (scheduler && scheduler.enable) {
            node = new Node();
            schedulers.push(node);
        }
        scheduler = config.scheduler.getScheduler("send_block");
        if (scheduler && scheduler.enable) {
            schedulers.push(new SendBlock());
        }
    }

    RollupStorage.make(config.database)
        .then(async (storage: RollupStorage) => {
            if (process.env.NODE_ENV !== "production") {
                const manager = new Wallet(config.contracts.rollup_manager_key);
                await HardhatUtils.deployRollupContract(config, manager);
            }
            if (node !== undefined) {
                const lastInfo = await LastBlockInfo.getInfo(storage, config);
                if (lastInfo !== undefined) node.setLastBlockInfo(lastInfo);
            }
            server = new RollupServer(config, storage, schedulers);
            return server.start().catch((error: any) => {
                // handle specific listen errors with friendly messages
                switch (error.code) {
                    case "EACCES":
                        logger.error(`${config.server.port} requires elevated privileges`);
                        break;
                    case "EADDRINUSE":
                        logger.error(`Port ${config.server.port} is already in use`);
                        break;
                    default:
                        logger.error(`An error occurred while starting the server: ${error.stack}`);
                }
                process.exit(1);
            });
        })
        .catch(() => {
            process.exit(1);
        });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

process.on("SIGINT", () => {
    server.stop().then(() => {
        process.exit(0);
    });
});
