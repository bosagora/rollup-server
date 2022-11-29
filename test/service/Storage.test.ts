import * as assert from "assert";
import path from "path";
import { Transaction } from "../../src/modules";
import { Config } from "../../src/service/common/Config";
import { RollupStorage } from "../../src/service/storage/RollupStorage";

describe("Test of Storage", () => {
    let storage: RollupStorage;
    const tx = new Transaction(
        "123456789",
        "0x064c9Fc53d5936792845ca58778a52317fCf47F2",
        "0",
        BigInt(123),
        1668044556,
        "997DE626B2D417F0361D61C09EB907A57226DB5B",
        "a5c19fed89739383"
    );
    const tx2 = new Transaction(
        "987654321",
        "0x064c9Fc53d5936792845ca58778a52317fCf47F2",
        "0",
        BigInt(321),
        1313456756,
        "997DE626B2D417F0361D61C09EB907A57226DB5B",
        "a5c19fed89739383"
    );

    it("Create Storage", async () => {
        const config: Config = new Config();
        config.readFromFile(path.resolve("test", "service", "config.test.yaml"));

        storage = await (() => {
            return new Promise<RollupStorage>((resolve, reject) => {
                const res = new RollupStorage(config.database, (err) => {
                    if (err !== null) reject(err);
                    else resolve(res);
                });
            });
        })();
    });

    it("Insert Transaction Data", async () => {
        const res = await storage.insert([tx, tx2]);
        assert.strictEqual(res, true);
    });

    it("Select Transaction Data", async () => {
        const res = await storage.select(tx.trade_id);
        assert.strictEqual(res.length, 1);
        assert.strictEqual(res[0].trade_id, tx.trade_id);
        assert.strictEqual(res[0].user_id, tx.user_id);
        assert.strictEqual(res[0].state, tx.state);
        assert.strictEqual(res[0].amount, tx.amount.toString());
        assert.strictEqual(res[0].timestamp, tx.timestamp);
        assert.strictEqual(res[0].exchange_user_id, tx.exchange_user_id);
        assert.strictEqual(res[0].exchange_id, tx.exchange_id);
        const res2 = await storage.select(tx2.trade_id);
        assert.strictEqual(res2.length, 1);
        assert.strictEqual(res2[0].trade_id, tx2.trade_id);
        assert.strictEqual(res2[0].user_id, tx2.user_id);
        assert.strictEqual(res2[0].state, tx2.state);
        assert.strictEqual(res2[0].amount, tx2.amount.toString());
        assert.strictEqual(res2[0].timestamp, tx2.timestamp);
        assert.strictEqual(res2[0].exchange_user_id, tx2.exchange_user_id);
        assert.strictEqual(res2[0].exchange_id, tx2.exchange_id);
    });

    it("Delete Transaction Data", async () => {
        const res = await storage.delete(tx.trade_id);
        assert.strictEqual(res, true);

        const resS = await storage.select(tx.trade_id);
        assert.strictEqual(resS.length, 0);
    });
});
