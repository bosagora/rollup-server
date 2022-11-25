/**
 *  The router of Wallet
 *
 *  Copyright:
 *      Copyright (c) 2022 BOSAGORA Foundation All rights reserved.
 *
 *  License:
 *       MIT License. See LICENSE for details.
 */

import { WebService } from "../../modules/service/WebService";
import { Config } from "../common/Config";

import express from "express";

// tslint:disable-next-line:no-var-requires
const { body, param, query, validationResult } = require("express-validator");

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
     *
     * @param service  WebService
     * @param config Configuration
     */
    constructor(service: WebService, config: Config) {
        this._web_service = service;
        this._config = config;
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
        this.app.get("/", [], RollupRouter.getHealthStatus.bind(this));
    }

    private static async getHealthStatus(req: express.Request, res: express.Response) {
        return res.json("OK");
    }
}
