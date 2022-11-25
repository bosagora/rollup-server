import { Config } from "../../src/service/common/Config";
import { GasPriceManager } from "../../src/service/contract/GasPriceManager";
import { TestClient, TestRollupServer } from "../Utility";

import chai from "chai";
import { solidity } from "ethereum-waffle";
import * as hre from "hardhat";

import { NonceManager } from "@ethersproject/experimental";

import * as path from "path";
import { URL } from "url";

import { TestERC20 } from "../../typechain";

import * as assert from "assert";
import { BigNumber, Wallet } from "ethers";

// tslint:disable-next-line:no-var-requires
const URI = require("urijs");

chai.use(solidity);

describe("Test of Server", function () {
    this.timeout(1000 * 60 * 5);
    const client = new TestClient();
    let wallet_server: TestRollupServer;
    let serverURL: URL;
    const config = new Config();
    const manager = new hre.ethers.Wallet(process.env.MANAGER_KEY || "");
    const user1 = Wallet.createRandom();
    const user2 = Wallet.createRandom();
    const provider = hre.ethers.provider;
    const manager_signer = new NonceManager(new GasPriceManager(provider.getSigner(manager.address)));
    let token: TestERC20;
    let token_address: string;
    const initial_balance = BigNumber.from(10000).mul(BigNumber.from(10).pow(18));

    before("Create TestServer", async () => {
        config.readFromFile(path.resolve(process.cwd(), "config", "config_test.yaml"));
        serverURL = new URL(`http://127.0.0.1:${config.server.port}`);
        wallet_server = new TestRollupServer(config);
    });

    before("Start TestServer", async () => {
        await wallet_server.start();
    });

    before("Deploy Test Token", async () => {
        const ContractFactory = await hre.ethers.getContractFactory("TestERC20");
        token = (await ContractFactory.connect(manager_signer).deploy("Sample Token", "STK")) as TestERC20;
        await token.deployed();
        token_address = token.address;
    });

    before("Transfer", async () => {
        await manager_signer.sendTransaction({
            to: user1.address,
            value: initial_balance,
        });
        await manager_signer.sendTransaction({
            to: user2.address,
            value: initial_balance,
        });
        await token.connect(manager_signer).transfer(user1.address, initial_balance);
        await token.connect(manager_signer).transfer(user2.address, initial_balance);
    });

    after("Stop TestServer", async () => {
        await wallet_server.stop();
    });

    context("Test the balance check", () => {
        it("Test of the path /wallet/boa/balance", async () => {
            const uri = URI(serverURL).directory("wallet/boa/balance").filename(user1.address);
            const url = uri.toString();
            const response = await client.get(url);
            assert.strictEqual(response.data.code, 200);
            assert.strictEqual(response.data.data.address, user1.address);
            assert.strictEqual(response.data.data.balance, initial_balance.toString());
        });

        it("Test of the path /wallet/token/balance", async () => {
            const uri = URI(serverURL)
                .directory("wallet/token/balance/" + token_address)
                .filename(user1.address);
            const url = uri.toString();
            const response = await client.get(url);
            assert.strictEqual(response.data.code, 200);
            assert.strictEqual(response.data.data.token, token_address);
            assert.strictEqual(response.data.data.address, user1.address);
            assert.strictEqual(response.data.data.balance, initial_balance.toString());
        });
    });

    context("Test the transfer of BOA", () => {
        const amount = BigNumber.from(100).mul(BigNumber.from(10).pow(18));
        it("Test of the path /wallet/boa/transfer - insufficient balance", async () => {
            const manager_balance = await hre.ethers.provider.getBalance(manager.address);

            const uri = URI(serverURL).directory("wallet/boa/transfer");
            const url = uri.toString();
            const response = await client.post(url, {
                access_secret: config.wallet.access_secret,
                address: user1.address,
                value: manager_balance.add(1).toString(),
            });
            assert.strictEqual(response.data.code, 500);
        });

        it("Test of the path /wallet/boa/transfer", async () => {
            const uri = URI(serverURL).directory("wallet/boa/transfer");
            const url = uri.toString();
            const response = await client.post(url, {
                access_secret: config.wallet.access_secret,
                address: user2.address,
                value: amount.toString(),
            });
            assert.strictEqual(response.data.code, 200);

            const user2_balance = await hre.ethers.provider.getBalance(user2.address);
            assert.strictEqual(user2_balance.toString(), initial_balance.add(amount).toString());
        });
    });

    context("Test the transfer of token", () => {
        const amount = BigNumber.from(100).mul(BigNumber.from(10).pow(18));
        it("Test of the path /wallet/token/transfer - insufficient balance", async () => {
            const manager_balance = await token.balanceOf(manager.address);
            const uri = URI(serverURL).directory("wallet/token/transfer");
            const url = uri.toString();
            const response = await client.post(url, {
                access_secret: config.wallet.access_secret,
                token: token_address,
                address: user1.address,
                value: manager_balance.add(1).toString(),
            });
            assert.strictEqual(response.data.code, 500);
        });

        it("Test of the path /wallet/token/transfer", async () => {
            const uri = URI(serverURL).directory("wallet/token/transfer");
            const url = uri.toString();
            const response = await client.post(url, {
                access_secret: config.wallet.access_secret,
                token: token_address,
                address: user2.address,
                value: amount.toString(),
            });
            assert.strictEqual(response.data.code, 200);

            const user2_balance = await token.balanceOf(user2.address);
            assert.strictEqual(user2_balance.toString(), initial_balance.add(amount).toString());
        });
    });

    context("Test the approve / allowance of token", () => {
        const amount = BigNumber.from(100).mul(BigNumber.from(10).pow(18));
        it("Test of the path /wallet/token/approve", async () => {
            const uri = URI(serverURL).directory("wallet/token/approve");
            const url = uri.toString();
            const response = await client.post(url, {
                access_secret: config.wallet.access_secret,
                token: token_address,
                spender: user2.address,
                value: amount.toString(),
            });

            assert.strictEqual(response.data.code, 200);
            assert.strictEqual(response.data.data.token, token_address);
            assert.strictEqual(response.data.data.owner, manager.address);
            assert.strictEqual(response.data.data.spender, user2.address);
            assert.strictEqual(response.data.data.value, amount.toString());

            const allowance = await token.allowance(manager.address, user2.address);
            assert.strictEqual(allowance.toString(), amount.toString());
        });

        it("Test of the path /wallet/token/allowance", async () => {
            const uri = URI(serverURL).directory("wallet/token/allowance");
            const url = uri.toString();
            const response = await client.post(url, {
                access_secret: config.wallet.access_secret,
                token: token_address,
                spender: user2.address,
            });

            assert.strictEqual(response.data.code, 200);
            assert.strictEqual(response.data.data.token, token_address);
            assert.strictEqual(response.data.data.owner, manager.address);
            assert.strictEqual(response.data.data.spender, user2.address);
            assert.strictEqual(response.data.data.allowance, amount.toString());
        });
    });
});
