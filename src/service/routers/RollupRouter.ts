/**
 *  The router of Rollup Server
 *
 *  Copyright:
 *      Copyright (c) 2022 BOSAGORA Foundation All rights reserved.
 *
 *  License:
 *       MIT License. See LICENSE for details.
 */

import express from "express";
import { body, validationResult } from "express-validator";

import { Transaction } from "rollup-pm-sdk";
import { WebService } from "../../modules/service/WebService";
import { Config } from "../common/Config";
import { logger } from "../common/Logger";
import { TransactionPool } from "../scheduler/TransactionPool";
import { DBTransaction } from "../storage/RollupStorage";
import { Validation } from "../validation";

export class RollupRouter {
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

    /**
     * The transaction pool
     * @private
     */
    private readonly pool: TransactionPool;

    /**
     * Authorization pass key
     * @private
     */
    private static api_access_token: string;

    /**
     *
     * @param service  WebService
     * @param config Configuration
     */
    constructor(service: WebService, config: Config, pool: TransactionPool) {
        this._web_service = service;
        this._config = config;
        this.pool = pool;
        RollupRouter.api_access_token = config.authorization.api_access_token;
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

    private isAuth(req: express.Request, res: express.Response, next: any) {
        const authHeader = req.get("Authorization");
        if (!authHeader && RollupRouter.api_access_token !== authHeader) {
            return res.status(401).json(
                RollupRouter.makeResponseData(401, undefined, {
                    msg: "Authentication Error",
                })
            );
        }
        next();
    }

    private isValidate(req: express.Request, res: express.Response, next: any) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const e = errors.array({ onlyFirstError: true });
            if (e.length) {
                return res.status(400).json(RollupRouter.makeResponseData(400, undefined, e[0]));
            } else {
                return res.status(400).json(
                    RollupRouter.makeResponseData(400, undefined, {
                        validation: errors.array(),
                        msg: "Failed to check the validity of parameters.",
                    })
                );
            }
        }
        next();
    }

    public registerRoutes() {
        this.app.get("/", [], RollupRouter.getHealthStatus.bind(this));
        this.app.post(
            "/tx/record",
            [
                this.isAuth,
                body("trade_id")
                    .exists()
                    .withMessage("trade_id is a required value")
                    .not()
                    .isEmpty()
                    .withMessage("trade_id is a required value")
                    .bail(),
                body("user_id")
                    .exists()
                    .withMessage("user_id is a required value")
                    .not()
                    .isEmpty()
                    .withMessage("user_id is a required value")
                    .bail(),
                body("state")
                    .exists()
                    .withMessage("state is a required value")
                    .not()
                    .isEmpty()
                    .withMessage("state is a required value")
                    .isIn(["0", "1"])
                    .withMessage(`state input type error ,Enter "0" for charge or "1" for discharge`)
                    .bail(),
                body("amount")
                    .exists()
                    .withMessage("amount is a required value")
                    .not()
                    .isEmpty()
                    .withMessage("amount is a required value")
                    .custom(Validation.isAmount)
                    .withMessage("amount can only be numbers type string")
                    .bail(),
                body("timestamp")
                    .exists()
                    .withMessage("timestamp is a required value")
                    .not()
                    .isEmpty()
                    .withMessage("timestamp is a required value")
                    .isNumeric()
                    .withMessage("timestamp can only be numbers")
                    .bail(),
                body("exchange_user_id")
                    .exists()
                    .withMessage("exchange_user_id is a required value")
                    .not()
                    .isEmpty()
                    .withMessage("exchange_user_id is a required value")
                    .bail(),
                body("exchange_id")
                    .exists()
                    .withMessage("exchange_id is a required value")
                    .not()
                    .isEmpty()
                    .withMessage("exchange_id is a required value")
                    .bail(),
                body("signer")
                    .exists()
                    .withMessage("signer is a required value")
                    .not()
                    .isEmpty()
                    .withMessage("signer is a required value")
                    .bail(),
                body("signature")
                    .exists()
                    .withMessage("signature is a required value")
                    .not()
                    .isEmpty()
                    .withMessage("signature is a required value")
                    .bail(),
                this.isValidate,
            ],
            this.postTransactionRecord.bind(this)
        );
    }

    private static async getHealthStatus(req: express.Request, res: express.Response) {
        return res.json("OK");
    }

    /**
     * POST /tx/record
     * @private
     */
    private async postTransactionRecord(req: express.Request, res: express.Response) {
        logger.http(`POST /tx/record`);

        try {
            const tx: Transaction = new Transaction(
                req.body.trade_id,
                req.body.user_id,
                req.body.state,
                BigInt(req.body.amount),
                req.body.timestamp,
                req.body.exchange_user_id,
                req.body.exchange_id,
                req.body.signer,
                req.body.signature
            );

            if (!tx.verify(tx.signer)) {
                return res.status(400).json(
                    RollupRouter.makeResponseData(400, undefined, {
                        param: "signature",
                        msg: "The signature value entered is not valid.",
                    })
                );
            }

            await this.pool.add(DBTransaction.make(tx));
            return res.json(RollupRouter.makeResponseData(200, "SUCCESS"));
        } catch (error) {
            logger.error("POST /tx/record , " + error);
            return res.status(500).json(
                RollupRouter.makeResponseData(500, undefined, {
                    msg: "Failed to transaction record.",
                })
            );
        }
    }
}
