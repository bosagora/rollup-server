import { Config } from "../../src/service/common/Config";

import * as assert from "assert";
import path from "path";

describe("Test of Config", () => {
    it("Test parsing the settings of a string", async () => {
        const config: Config = new Config();
        config.readFromFile(path.resolve("test", "service", "config.test.yaml"));
        assert.strictEqual(config.server.address, "127.0.0.1");
        assert.strictEqual(config.server.port.toString(), "3000");
        assert.strictEqual(config.logging.folder, path.resolve("logs"));
        assert.strictEqual(config.logging.level, "debug");
        assert.strictEqual(
            config.wallet.manager_key,
            "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
        );
        assert.strictEqual(
            config.wallet.access_secret,
            "9812176e565a007a84c5d2fc4cf842b12eb26dbc7568b4e40fc4f2418f2c8f54"
        );
        assert.strictEqual(config.key_store.items[0].name, "manager");
        assert.strictEqual(config.key_store.items[0].file, "test_manager.key");
        assert.strictEqual(config.key_store.items[0].key_store.valid, false);
    });
});
