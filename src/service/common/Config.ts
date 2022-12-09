/**
 *  Define the configuration objects that are used through the application
 *
 *  Copyright:
 *      Copyright (c) 2022 BOSAGORA Foundation All rights reserved.
 *
 *  License:
 *       MIT License. See LICENSE for details.
 */

import { ArgumentParser } from "argparse";
import extend from "extend";
import fs from "fs";
import ip from "ip";
import path from "path";
import { Utils } from "rollup-pm-sdk";
import { readYamlEnvSync } from "yaml-env-defaults";

/**
 * Main config
 */
export class Config implements IConfig {
    /**
     * Server config
     */
    public server: ServerConfig;

    /**
     * Logging config
     */
    public logging: LoggingConfig;

    /**
     * Scheduler
     */
    public scheduler: SchedulerConfig;

    public node: NodeConfig;

    /**
     * Database
     */
    public database: DatabaseConfig;

    /**
     * Contracts
     */
    public contracts: ContractConfig;

    /**
     * Authorization
     */
    public authorization: AuthorizationConfig;

    /**
     * Constructor
     */
    constructor() {
        this.server = new ServerConfig();
        this.logging = new LoggingConfig();
        this.node = new NodeConfig();
        this.scheduler = new SchedulerConfig();
        this.database = new DatabaseConfig();
        this.contracts = new ContractConfig();
        this.authorization = new AuthorizationConfig();
    }

    /**
     * Parses the command line arguments, Reads from the configuration file
     */
    public static createWithArgument(): Config {
        // Parse the arguments
        const parser = new ArgumentParser();
        parser.add_argument("-c", "--config", {
            default: "config.yaml",
            help: "Path to the config file to use",
        });
        const args = parser.parse_args();

        let configPath = path.resolve(Utils.getInitCWD(), args.config);
        if (!fs.existsSync(configPath)) configPath = path.resolve(Utils.getInitCWD(), "config", "config.yaml");
        if (!fs.existsSync(configPath)) {
            console.error(`Config file '${configPath}' does not exists`);
            process.exit(1);
        }

        const cfg = new Config();
        try {
            cfg.readFromFile(configPath);
        } catch (error: any) {
            // Logging setup has not been completed and is output to the console.
            console.error(error.message);

            // If the process fails to read the configuration file, the process exits.
            process.exit(1);
        }
        return cfg;
    }

    /**
     * Reads from file
     * @param config_file The file name of configuration
     */
    public readFromFile(config_file: string) {
        const cfg = readYamlEnvSync([path.resolve(Utils.getInitCWD(), config_file)], (key) => {
            return (process.env || {})[key];
        }) as IConfig;
        this.server.readFromObject(cfg.server);
        this.logging.readFromObject(cfg.logging);
        this.node.readFromObject(cfg.node);
        this.scheduler.readFromObject(cfg.scheduler);
        this.database.readFromObject(cfg.database);
        this.contracts.readFromObject(cfg.contracts);
        this.authorization.readFromObject(cfg.authorization);
    }
}

/**
 * Server config
 */
export class ServerConfig implements IServerConfig {
    /**
     * THe address to which we bind
     */
    public address: string;

    /**
     * The port on which we bind
     */
    public port: number;

    /**
     * Constructor
     * @param address The address to which we bind
     * @param port The port on which we bind
     */
    constructor(address?: string, port?: number) {
        const conf = extend(true, {}, ServerConfig.defaultValue());
        extend(true, conf, { address, port });

        if (!ip.isV4Format(conf.address) && !ip.isV6Format(conf.address)) {
            console.error(`${conf.address}' is not appropriate to use as an IP address.`);
            process.exit(1);
        }

        this.address = conf.address;
        this.port = conf.port;
    }

    /**
     * Returns default value
     */
    public static defaultValue(): IServerConfig {
        return {
            address: "127.0.0.1",
            port: 3000,
        };
    }

    /**
     * Reads from Object
     * @param config The object of IServerConfig
     */
    public readFromObject(config: IServerConfig) {
        const conf = extend(true, {}, ServerConfig.defaultValue());
        extend(true, conf, config);

        if (!ip.isV4Format(conf.address) && !ip.isV6Format(conf.address)) {
            console.error(`${conf.address}' is not appropriate to use as an IP address.`);
            process.exit(1);
        }
        this.address = conf.address;
        this.port = conf.port;
    }
}

/**
 * Information on the scheduler.
 */
export class SchedulerConfig implements ISchedulerConfig {
    /**
     * Whether the scheduler is used or not
     */
    public enable: boolean;

    /**
     * Container for scheduler items
     */
    public items: ISchedulerItemConfig[];

    /**
     * Constructor
     */
    constructor() {
        const defaults = SchedulerConfig.defaultValue();
        this.enable = defaults.enable;
        this.items = defaults.items;
    }

    /**
     * Returns default value
     */
    public static defaultValue(): ISchedulerConfig {
        return {
            enable: false,
            items: [
                {
                    name: "node",
                    enable: false,
                    interval: 1,
                },
            ],
        } as unknown as ISchedulerConfig;
    }

    /**
     * Reads from Object
     * @param config The object of ILoggingConfig
     */
    public readFromObject(config: ISchedulerConfig) {
        this.enable = false;
        this.items = [];
        if (config === undefined) return;
        if (config.enable !== undefined) this.enable = config.enable;
        if (config.items !== undefined) this.items = config.items;
    }

    public getScheduler(name: string): ISchedulerItemConfig | undefined {
        return this.items.find((m) => m.name === name);
    }
}

/**
 * Logging config
 */
export class LoggingConfig implements ILoggingConfig {
    /**
     * The path of logging files
     */
    public folder: string;

    /**
     * The level of logging
     */
    public level: string;

    /**
     * Whether the console is enabled as well
     */
    public console: boolean;

    /**
     * Constructor
     */
    constructor() {
        const defaults = LoggingConfig.defaultValue();
        this.folder = path.resolve(Utils.getInitCWD(), defaults.folder);
        this.level = defaults.level;
        this.console = defaults.console;
    }

    /**
     * Returns default value
     */
    public static defaultValue(): ILoggingConfig {
        return {
            folder: path.resolve(Utils.getInitCWD(), "logs"),
            level: "info",
            console: false,
        };
    }

    /**
     * Reads from Object
     * @param config The object of ILoggingConfig
     */
    public readFromObject(config: ILoggingConfig) {
        if (config.folder) this.folder = path.resolve(Utils.getInitCWD(), config.folder);
        if (config.level) this.level = config.level;
        if (config.console !== undefined) this.console = config.console;
    }
}

/**
 * Logging config
 */
export class NodeConfig implements INodeConfig {
    public interval: number;
    public max_txs: number;
    public ipfs_api_url: string;
    public ipfs_gateway_url: string;
    public ipfs_test: boolean;

    /**
     * Constructor
     */
    constructor() {
        const defaults = NodeConfig.defaultValue();

        this.interval = defaults.interval;
        this.max_txs = defaults.max_txs;
        this.ipfs_api_url = defaults.ipfs_api_url;
        this.ipfs_gateway_url = defaults.ipfs_gateway_url;
        this.ipfs_test = defaults.ipfs_test;
    }

    /**
     * Returns default value
     */
    public static defaultValue(): INodeConfig {
        return {
            interval: 600,
            max_txs: 128,
            ipfs_api_url: "https://api-ipfs.bosagora.info",
            ipfs_gateway_url: "https://ipfs.bosagora.info",
            ipfs_test: true,
        };
    }

    /**
     * Reads from Object
     * @param config The object of ILoggingConfig
     */
    public readFromObject(config: INodeConfig) {
        if (config.interval !== undefined) this.interval = config.interval;
        if (config.max_txs !== undefined) this.max_txs = config.max_txs;
        if (config.ipfs_api_url !== undefined) this.ipfs_api_url = config.ipfs_api_url;
        if (config.ipfs_gateway_url !== undefined) this.ipfs_gateway_url = config.ipfs_gateway_url;
        if (config.ipfs_test !== undefined) this.ipfs_test = config.ipfs_test;
    }
}

/**
 * The interface of server config
 */
export interface IServerConfig {
    /**
     * The address to which we bind
     */
    address: string;

    /**
     * The port on which we bind
     */
    port: number;
}

/**
 * The interface of logging config
 */
export interface ILoggingConfig {
    /**
     * The path of logging files
     */
    folder: string;

    /**
     * The level of logging
     */
    level: string;

    /**
     * Whether the console is enabled as well
     */
    console: boolean;
}

export interface INodeConfig {
    interval: number;
    max_txs: number;
    ipfs_api_url: string;
    ipfs_gateway_url: string;
    ipfs_test: boolean;
}

/**
 * The interface of Scheduler Item Config
 */
export interface ISchedulerItemConfig {
    /**
     * Name
     */
    name: string;

    /**
     * Whether it's used or not
     */
    enable: boolean;

    /**
     * Execution cycle (seconds)
     */
    interval: number;
}

/**
 * The interface of Scheduler Config
 */
export interface ISchedulerConfig {
    /**
     * Whether the scheduler is used or not
     */
    enable: boolean;

    /**
     * Container for scheduler items
     */
    items: ISchedulerItemConfig[];

    /**
     * Find the scheduler item with your name
     * @param name The name of the scheduler item
     */
    getScheduler(name: string): ISchedulerItemConfig | undefined;
}

/**
 * The interface of main config
 */
export interface IConfig {
    /**
     * Server config
     */
    server: IServerConfig;

    /**
     * Logging config
     */
    logging: ILoggingConfig;

    node: INodeConfig;

    /**
     * Scheduler
     */
    scheduler: ISchedulerConfig;

    /**
     * Database
     */
    database: IDatabaseConfig;

    /**
     * Contracts
     */
    contracts: IContractsConfig;

    /**
     * Database
     */
    authorization: IAuthorizationConfig;
}

export interface IDatabaseConfig {
    path: string;
}
export class DatabaseConfig implements IDatabaseConfig {
    public path: string;

    /**
     * Constructor
     */
    constructor() {
        const defaults = DatabaseConfig.defaultValue();
        this.path = defaults.path;
    }
    public readFromObject(config: IDatabaseConfig) {
        if (config.path !== undefined) this.path = config.path;
    }
    /**
     * Returns default value
     */
    public static defaultValue(): IDatabaseConfig {
        return {
            path: "./db/rollup.db",
        } as unknown as IDatabaseConfig;
    }
}

export interface IContractsConfig {
    rollup_manager_key: string;
    rollup_address: string;
}

export class ContractConfig implements IContractsConfig {
    public rollup_manager_key: string;
    public rollup_address: string;

    /**
     * Constructor
     */
    constructor() {
        const defaults = ContractConfig.defaultValue();
        this.rollup_manager_key = defaults.rollup_manager_key;
        this.rollup_address = defaults.rollup_address;
    }
    public readFromObject(config: IContractsConfig) {
        if (config.rollup_manager_key !== undefined) this.rollup_manager_key = config.rollup_manager_key;
        if (config.rollup_address !== undefined) this.rollup_address = config.rollup_address;
    }
    /**
     * Returns default value
     */
    public static defaultValue(): IContractsConfig {
        return {
            rollup_manager_key: "0x94bf5604b9eb7990985dfabbfd1298a16a3c94cb79a5fa39638279ba9ca48a80",
            rollup_address: "0x0000000000000000000000000000000000000000",
        };
    }
}

export interface IAuthorizationConfig {
    api_access_token: string;
}
export class AuthorizationConfig implements IAuthorizationConfig {
    public api_access_token: string;

    /**
     * Constructor
     */
    constructor() {
        const defaults = AuthorizationConfig.defaultValue();
        this.api_access_token = defaults.api_access_token;
    }
    public readFromObject(config: IAuthorizationConfig) {
        if (config.api_access_token !== undefined) this.api_access_token = config.api_access_token;
    }
    /**
     * Returns default value
     */
    public static defaultValue(): IAuthorizationConfig {
        return {
            api_access_token: "9812176e565a007a84c5d2fc4cf842b12eb26dbc7568b4e40fc4f2418f2c8f54",
        } as unknown as IAuthorizationConfig;
    }
}
