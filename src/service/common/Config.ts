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
import { readYamlEnvSync } from "yaml-env-defaults";
import { Utils } from "../../modules/utils/Utils";
import { KeyStore } from "../keystore/KeyStore";

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

    public wallet: WalletConfig;

    public key_store: KeyStoreConfig;

    public node: NodeConfig;

    /**
     * Constructor
     */
    constructor() {
        this.server = new ServerConfig();
        this.logging = new LoggingConfig();
        this.key_store = new KeyStoreConfig();
        this.wallet = new WalletConfig();
        this.node = new NodeConfig();
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
        this.wallet.readFromObject(cfg.wallet);
        this.key_store.readFromObject(cfg.key_store);
        this.node.readFromObject(cfg.node);
    }

    public async decrypt() {
        await this.key_store.decrypt();
        this.wallet.manager_key = await this.key_store.getPrivateKey(this.wallet.manager_key);
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
 * Logging config
 */
export class WalletConfig implements IWalletConfig {
    /**
     * 계정의 비밀키 또는 키파일
     */
    public manager_key: string;

    public access_secret: string;

    /**
     * Constructor
     */
    constructor() {
        const defaults = WalletConfig.defaultValue();

        this.manager_key = defaults.manager_key;
        this.access_secret = defaults.access_secret;
    }

    /**
     * Returns default value
     */
    public static defaultValue(): IWalletConfig {
        return {
            manager_key: process.env.MANAGER_KEY || "",
            access_secret: process.env.ACCESS_SECRET || "",
        };
    }

    /**
     * Reads from Object
     * @param config The object of ILoggingConfig
     */
    public readFromObject(config: IWalletConfig) {
        if (config.manager_key !== undefined) this.manager_key = config.manager_key;
        if (config.access_secret !== undefined) this.access_secret = config.access_secret;
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

export class KeyStoreConfig implements IKeyStoreConfig {
    public items: IKeyStoreItemConfig[];
    /**
     * Constructor
     */
    constructor() {
        const defaults = KeyStoreConfig.defaultValue();
        this.items = defaults.items;
    }

    /**
     * Returns default value
     */
    public static defaultValue(): IKeyStoreConfig {
        return {
            items: [],
        } as unknown as IKeyStoreConfig;
    }

    /**
     * Reads from Object
     * @param config The object of ILoggingConfig
     */
    public readFromObject(config: IKeyStoreConfig) {
        this.items = [];
        if (config === undefined) return;
        if (config.items !== undefined) {
            for (const elem of config.items) {
                this.items.push({
                    name: elem.name,
                    file: elem.file,
                    key_store: new KeyStore(elem.name, path.resolve("keystore" + elem.file)),
                });
            }
        }
    }

    public getItemByID(name: string): IKeyStoreItemConfig | undefined {
        const find = name.toLowerCase();
        return this.items.find((m) => m.name.toLowerCase() === find);
    }

    public async decrypt() {
        for (const elem of this.items) {
            await elem.key_store.getPrivateKey();
        }
    }

    public async getPrivateKey(value: string) {
        const values = value.split(":");
        if (values.length >= 2 && values[0] === "key_store") {
            const item = this.getItemByID(values[1]);
            if (item !== undefined) {
                return item.key_store.getPrivateKey();
            } else {
                return "";
            }
        } else {
            return value;
        }
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

    /**
     * Constructor
     */
    constructor() {
        const defaults = NodeConfig.defaultValue();

        this.interval = defaults.interval;
        this.max_txs = defaults.max_txs;
        this.ipfs_api_url = defaults.ipfs_api_url;
        this.ipfs_gateway_url = defaults.ipfs_gateway_url;
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

export interface IWalletConfig {
    manager_key: string;
    access_secret: string;
}

export interface IKeyStoreItemConfig {
    name: string;
    file: string;
    key_store: KeyStore;
}

/**
 *  The keystore
 */
export interface IKeyStoreConfig {
    items: IKeyStoreItemConfig[];
    getItemByID(name: string): IKeyStoreItemConfig | undefined;
}

export interface INodeConfig {
    interval: number;
    max_txs: number;
    ipfs_api_url: string;
    ipfs_gateway_url: string;
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

    wallet: IWalletConfig;

    key_store: IKeyStoreConfig;

    node: INodeConfig;
}
