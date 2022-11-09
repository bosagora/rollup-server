/**
 *  The router of Wallet
 *
 *  Copyright:
 *      Copyright (c) 2022 BOSAGORA Foundation All rights reserved.
 *
 *  License:
 *       MIT License. See LICENSE for details.
 */

import { ERC20 } from "../../../typechain";
import { WebService } from "../../modules/service/WebService";
import { Config } from "../common/Config";
import { logger } from "../common/Logger";
import { GasPriceManager } from "../contract/GasPriceManager";
import { Validation } from "../validation";

import { NonceManager } from "@ethersproject/experimental";
import { BigNumber, Signer, Wallet } from "ethers";
import * as hre from "hardhat";

import express from "express";
import fs from "fs";
import path from "path";

// tslint:disable-next-line:no-var-requires
const { body, param, query, validationResult } = require("express-validator");

export class WalletRouter {
    /**
     *
     * @private
     */
    private _web_service: WebService;

    /**
     * The configuration of the database
     * @private
     */
    private readonly _config: Config;

    private readonly ERC20_ABI: any;

    private manager_wallet: Wallet;

    private manager_signer: NonceManager;

    /**
     *
     * @param service  WebService
     * @param config Configuration
     */
    constructor(service: WebService, config: Config) {
        this._web_service = service;
        this._config = config;

        this.ERC20_ABI = JSON.parse(fs.readFileSync("src/service/contract/ERC20.ABI.json", "utf8"));
        this.ERC20_ABI = JSON.parse(
            fs.readFileSync(path.resolve("src", "service", "contract", "ERC20.ABI.json"), "utf8")
        );
        this.manager_wallet = new Wallet(this._config.wallet.manager_key);
        this.manager_signer = new NonceManager(
            new GasPriceManager(hre.ethers.provider.getSigner(this.manager_wallet.address))
        );
    }

    private get app(): express.Application {
        return this._web_service.app;
    }

    /**
     * Make the response data
     * @param code      The result code
     * @param data      The result data
     * @param error     The error
     * @private
     */
    private static makeResponseData(code: number, data: any, error?: any): any {
        return {
            code,
            data,
            error,
        };
    }

    public registerRoutes() {
        this.app.get("/", [], WalletRouter.getHealthStatus.bind(this));
        this.app.get(
            "/wallet/boa/balance/:address",
            [param("address").exists().isEthereumAddress()],
            this.getBOABalance.bind(this)
        );
        this.app.post(
            "/wallet/boa/transfer",
            [body("address").exists().isEthereumAddress(), body("value").exists().custom(Validation.isAmount)],
            this.postBOATransfer.bind(this)
        );
        this.app.get(
            "/wallet/token/balance/:token/:address",
            [param("token").exists().isEthereumAddress(), param("address").exists().isEthereumAddress()],
            this.getTokenBalance.bind(this)
        );
        this.app.post(
            "/wallet/token/transfer",
            [
                body("token").exists().isEthereumAddress(),
                body("address").exists().isEthereumAddress(),
                body("value").exists().custom(Validation.isAmount),
            ],
            this.postTokenTransfer.bind(this)
        );
        this.app.post(
            "/wallet/token/allowance",
            [body("token").exists().isEthereumAddress(), body("spender").exists().isEthereumAddress()],
            this.postTokenAllowance.bind(this)
        );
        this.app.post(
            "/wallet/token/approve",
            [
                body("token").exists().isEthereumAddress(),
                body("spender").exists().isEthereumAddress(),
                body("value").exists().custom(Validation.isAmount),
            ],
            this.postTokenApprove.bind(this)
        );
    }

    private static async getHealthStatus(req: express.Request, res: express.Response) {
        return res.json("OK");
    }

    /**
     * Reset the transaction nonce of manager address
     */
    private async resetTransactionCount() {
        this.manager_signer.setTransactionCount(await this.manager_signer.getTransactionCount());
    }

    /**
     * GET /wallet/boa/balance/:address
     * @private
     */
    private async getBOABalance(req: express.Request, res: express.Response) {
        logger.http(`GET /wallet/boa/balance/:address`);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.json(
                WalletRouter.makeResponseData(400, undefined, {
                    validation: errors.array(),
                    message: "Failed to check the validity of parameters.",
                })
            );
        }
        try {
            const address: string = String(req.params.address);
            const balance = await hre.ethers.provider.getBalance(address);

            return res.json(
                WalletRouter.makeResponseData(200, {
                    address,
                    balance: balance.toString(),
                })
            );
        } catch (e) {
            return res.json(
                WalletRouter.makeResponseData(500, undefined, {
                    message: "Failed to get balance.",
                })
            );
        }
    }

    /**
     * POST /wallet/boa/transfer
     * @private
     */
    private async postBOATransfer(req: express.Request, res: express.Response) {
        logger.http(`POST /wallet/boa/transfer`);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.json(
                WalletRouter.makeResponseData(400, undefined, {
                    validation: errors.array(),
                    message: "Failed to check the validity of parameters.",
                })
            );
        }

        const secret: string = String(req.body.access_secret);
        if (secret !== this._config.wallet.access_secret) {
            return res.json(
                WalletRouter.makeResponseData(400, undefined, {
                    message: "The secret entered is not valid.",
                })
            );
        }

        try {
            const address: string = String(req.body.address);
            const value: string = String(req.body.value);
            const result = await this.manager_signer.sendTransaction({
                to: address,
                value: BigNumber.from(value),
            });
            return res.json(WalletRouter.makeResponseData(200, { hash: result }));
        } catch (error) {
            await this.resetTransactionCount();
            return res.json(
                WalletRouter.makeResponseData(500, undefined, {
                    message: "Failed to transfer BOA.",
                })
            );
        }
    }

    /**
     * GET /wallet/token/balance/:token/:address
     *
     * @private
     */
    private async getTokenBalance(req: express.Request, res: express.Response) {
        logger.http(`GET /wallet/token/balance/:token/:address`);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.json(
                WalletRouter.makeResponseData(400, undefined, {
                    validation: errors.array(),
                    message: "Failed to check the validity of parameters.",
                })
            );
        }

        try {
            const token: string = String(req.params.token);
            const address: string = String(req.params.address);

            const contract = new hre.ethers.Contract(token, this.ERC20_ABI, hre.ethers.provider) as ERC20;
            const balance = await contract.balanceOf(address);

            return res.json(
                WalletRouter.makeResponseData(200, {
                    token,
                    address,
                    balance: balance.toString(),
                })
            );
        } catch (e) {
            return res.json(
                WalletRouter.makeResponseData(500, undefined, {
                    message: "Failed to get balance of token.",
                })
            );
        }
    }

    /**
     * POST /wallet/token/transfer
     *
     * @private
     */
    private async postTokenTransfer(req: express.Request, res: express.Response) {
        logger.http(`POST /wallet/token/transfer`);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.json(
                WalletRouter.makeResponseData(400, undefined, {
                    validation: errors.array(),
                    message: "Failed to check the validity of parameters.",
                })
            );
        }

        const secret: string = String(req.body.access_secret);
        if (secret !== this._config.wallet.access_secret) {
            return res.json(
                WalletRouter.makeResponseData(400, undefined, {
                    message: "The secret entered is not valid.",
                })
            );
        }

        try {
            const token: string = String(req.body.token);
            const address: string = String(req.body.address);
            const value: string = String(req.body.value);
            const contract = new hre.ethers.Contract(token, this.ERC20_ABI, hre.ethers.provider) as ERC20;
            const result = await contract.connect(this.manager_signer).transfer(address, BigNumber.from(value));
            return res.json(WalletRouter.makeResponseData(200, { hash: result }));
        } catch (e) {
            await this.resetTransactionCount();
            return res.json(
                WalletRouter.makeResponseData(500, undefined, {
                    message: "Failed to transfer token.",
                })
            );
        }
    }

    /**
     * POST /wallet/token/allowance/:token/:address
     * @private
     */
    private async postTokenAllowance(req: express.Request, res: express.Response) {
        logger.http(`GET /wallet/token/allowance`);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.json(
                WalletRouter.makeResponseData(400, undefined, {
                    validation: errors.array(),
                    message: "Failed to check the validity of parameters.",
                })
            );
        }

        const secret: string = String(req.body.access_secret);
        if (secret !== this._config.wallet.access_secret) {
            return res.json(
                WalletRouter.makeResponseData(400, undefined, {
                    message: "The secret entered is not valid.",
                })
            );
        }

        try {
            const token: string = String(req.body.token);
            const owner: string = this.manager_wallet.address;
            const spender: string = String(req.body.spender);

            const contract = new hre.ethers.Contract(token, this.ERC20_ABI, hre.ethers.provider) as ERC20;
            const allowance = await contract.allowance(owner, spender);

            return res.json(
                WalletRouter.makeResponseData(200, {
                    token,
                    owner,
                    spender,
                    allowance: allowance.toString(),
                })
            );
        } catch (e) {
            return res.json(
                WalletRouter.makeResponseData(500, undefined, {
                    message: "Failed to get balance of token.",
                })
            );
        }
    }

    /**
     * POST /wallet/token/approve/:token/:address
     * @private
     */
    private async postTokenApprove(req: express.Request, res: express.Response) {
        logger.http(`GET /wallet/token/approve`);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.json(
                WalletRouter.makeResponseData(400, undefined, {
                    validation: errors.array(),
                    message: "Failed to check the validity of parameters.",
                })
            );
        }

        const secret: string = String(req.body.access_secret);
        if (secret !== this._config.wallet.access_secret) {
            return res.json(
                WalletRouter.makeResponseData(400, undefined, {
                    message: "The secret entered is not valid.",
                })
            );
        }

        try {
            const token: string = String(req.body.token);
            const owner: string = this.manager_wallet.address;
            const spender: string = String(req.body.spender);
            const value: string = String(req.body.value);

            const contract = new hre.ethers.Contract(token, this.ERC20_ABI, hre.ethers.provider) as ERC20;
            const result = await contract.connect(this.manager_signer).approve(spender, BigNumber.from(value));

            return res.json(
                WalletRouter.makeResponseData(200, {
                    token,
                    owner,
                    spender,
                    value,
                    hash: result.hash,
                })
            );
        } catch (e) {
            return res.json(
                WalletRouter.makeResponseData(500, undefined, {
                    message: "Failed to get balance of token.",
                })
            );
        }
    }
}
