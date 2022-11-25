/**
 *  The web server of Remote Wallet Server
 *
 *  Copyright:
 *      Copyright (c) 2022 BOSAGORA Foundation All rights reserved.
 *
 *  License:
 *       MIT License. See LICENSE for details.
 */

import bodyParser from "body-parser";
import cors from "cors";
import { IScheduler } from "../modules/scheduler/Scheduler";
import { WebService } from "../modules/service/WebService";
import { Config } from "./common/Config";
import { cors_options } from "./option/cors";
import { WalletRouter } from "./routers/WalletRouter";

export class WalletServer extends WebService {
    /**
     * The collection of schedulers
     * @protected
     */
    protected schedules: IScheduler[] = [];

    /**
     * The configuration of the database
     * @private
     */
    private readonly config: Config;

    public readonly wallet_router: WalletRouter;

    /**
     * Constructor
     * @param config Configuration
     * @param schedules Array of IScheduler
     */
    constructor(config: Config, schedules?: IScheduler[]) {
        super(config.server.port, config.server.address);

        this.config = config;
        this.wallet_router = new WalletRouter(this, this.config);

        if (schedules) {
            schedules.forEach((m) => this.schedules.push(m));
            this.schedules.forEach((m) =>
                m.setOption({
                    config: this.config,
                    router: this.wallet_router,
                })
            );
        }
    }

    /**
     * Setup and start the server
     */
    public async start(): Promise<void> {
        // parse application/x-www-form-urlencoded
        this.app.use(bodyParser.urlencoded({ extended: false, limit: "1mb" }));
        // parse application/json
        this.app.use(bodyParser.json({ limit: "1mb" }));
        this.app.use(cors(cors_options));

        this.wallet_router.registerRoutes();

        this.schedules.forEach((m) => m.start());

        return super.start();
    }

    public stop(): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            for (const m of this.schedules) m.stop();
            for (const m of this.schedules) await m.waitForStop();
            if (this.server != null) {
                this.server.close((err?) => {
                    if (err) reject(err);
                    else resolve();
                });
            } else resolve();
        });
    }
}
