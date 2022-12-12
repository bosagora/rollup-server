import { Config } from "../../src/service/common/Config";

import * as assert from "assert";
import { Wallet } from "ethers";
import * as path from "path";
import { Transaction, Utils } from "rollup-pm-sdk";
import URI from "urijs";
import { URL } from "url";
import { Scheduler } from "../../src/modules";
import { RollupServer } from "../../src/service/RollupServer";
import { LastBlockInfo } from "../../src/service/scheduler/LastBlockInfo";
import { Node } from "../../src/service/scheduler/Node";
import { SendBlock } from "../../src/service/scheduler/SendBlock";
import { RollupStorage } from "../../src/service/storage/RollupStorage";
import { HardhatUtils } from "../../src/service/utils";
import { RollUp } from "../../typechain-types";
import { delay, TestClient } from "../Utility";

describe("Test of Rollup Server", function () {
    this.timeout(1000 * 60);

    const config = new Config();
    let rollupServer: RollupServer;
    let storage: RollupStorage;
    let serverURL: string;
    let manager: Wallet;
    let contract: RollUp;
    const schedulers: Scheduler[] = [];
    let token: string;

    const MAX_TX_IN_BLOCK = 8;
    const BLOCK_INTERVAL = 3;
    const SEND_INTERVAL = 1;

    let client: TestClient;
    let sendURL: string;

    before("Load Config", () => {
        config.readFromFile(path.resolve("config", "config_test.yaml"));
        config.server.port = 9595;
        serverURL = new URL(`http://127.0.0.1:${config.server.port}`).toString();
    });

    before("Create Manager's Wallet", () => {
        manager = new Wallet(config.contracts.rollup_manager_key);
    });

    before("Deploy Contract", async () => {
        contract = await HardhatUtils.deployRollupContract(config, manager);
    });

    before("Create Storage", async () => {
        storage = await (() => {
            return new Promise<RollupStorage>((resolve, reject) => {
                const res = new RollupStorage(config.database, (err) => {
                    if (err !== null) reject(err);
                    else resolve(res);
                });
            });
        })();
    });

    before("Init Scheduler's Config", () => {
        config.node.interval = BLOCK_INTERVAL;
        config.node.max_txs = MAX_TX_IN_BLOCK;
        config.node.ipfs_test = true;
        config.node.send_interval = SEND_INTERVAL;

        token = config.authorization.api_access_token;
    });

    before("Create Schedulers", () => {
        schedulers.push(new Node());
        schedulers.push(new SendBlock());
    });

    before("Create Test Server", () => {
        rollupServer = new RollupServer(config, storage, schedulers);
    });

    before("Start Test Server", async () => {
        await rollupServer.start();
    });

    after("Stop Test Server", async () => {
        await rollupServer.stop();
    });

    before("Create Client", async () => {
        sendURL = URI(serverURL).directory("tx/record").toString();
        client = new TestClient({ headers: { Authorization: token } });
    });

    let numTx: number = 0;
    const makeMultiTransactions = async (count: number): Promise<Transaction[]> => {
        const signer = new Wallet("0xf6dda8e03f9dce37c081e5d178c1fda2ebdb90b5b099de1a555a658270d8c47d");
        const exchange_user_id = "EXCHANGE_UID";
        const exchange_id = "EXCHANGE_ID";
        const txs: Transaction[] = [];

        for (let idx = 0; idx < count; idx++) {
            const tx = new Transaction(
                "TX" + numTx.toString().padStart(10, "0"),
                signer.address,
                "0",
                10000n,
                Utils.getTimeStamp(),
                exchange_user_id,
                exchange_id
            );
            await tx.sign(signer);
            txs.push(tx);
            numTx++;
        }

        return txs;
    };

    context("Step 1", () => {
        it("Send transactions", async () => {
            const txs = await makeMultiTransactions(MAX_TX_IN_BLOCK);
            for (const tx of txs.map((m) => m.toJSON())) {
                const res = await client.post(sendURL, tx);
                assert.strictEqual(res.data.code, 200);
            }
        });

        it("Delay", async () => {
            await delay(2 * BLOCK_INTERVAL * 1000);
        });

        it("Check the height of the last block", async () => {
            const last_height_storage = await storage.selectLastHeight();
            assert.strictEqual(last_height_storage, 0n);

            const last_height_contract = await contract.getLastHeight();
            assert.strictEqual(last_height_contract.toString(), "0");
        });
    });

    context("Step 2", () => {
        it("Send transactions", async () => {
            const txs = await makeMultiTransactions(MAX_TX_IN_BLOCK);
            for (const tx of txs.map((m) => m.toJSON())) {
                const res = await client.post(sendURL, tx);
                assert.strictEqual(res.data.code, 200);
            }
        });

        it("Delay", async () => {
            await delay(2 * BLOCK_INTERVAL * 1000);
        });

        it("Check the height of the last block", async () => {
            const last_height_storage = await storage.selectLastHeight();
            assert.strictEqual(last_height_storage, 1n);

            const last_height_contract = await contract.getLastHeight();
            assert.strictEqual(last_height_contract.toString(), "1");
        });
    });

    context("Restart Server", () => {
        it("Stop Test Server", async () => {
            await rollupServer.stop();
        });

        schedulers.length = 0;
        it("Create Schedulers", () => {
            schedulers.push(new Node());
            schedulers.push(new SendBlock());
        });

        it("Create Test Server", async () => {
            rollupServer = new RollupServer(config, storage, schedulers);
        });

        it("Start Test Server", async () => {
            await rollupServer.start();
        });

        it("Check the height of the last block", async () => {
            const res = await LastBlockInfo.getInfo(storage, contract);
            assert.ok(res !== undefined);
            assert.strictEqual(res.height, 1n);
        });
    });

    context("Step 3", () => {
        it("Send transactions", async () => {
            const txs = await makeMultiTransactions(MAX_TX_IN_BLOCK);
            for (const tx of txs.map((m) => m.toJSON())) {
                const res = await client.post(sendURL, tx);
                assert.strictEqual(res.data.code, 200);
            }
        });

        it("Delay", async () => {
            await delay(2 * BLOCK_INTERVAL * 1000);
        });

        it("Check the height of the last block", async () => {
            const last_height_storage = await storage.selectLastHeight();
            assert.strictEqual(last_height_storage, 2n);

            const last_height_contract = await contract.getLastHeight();
            assert.strictEqual(last_height_contract.toString(), "2");
        });
    });
});
