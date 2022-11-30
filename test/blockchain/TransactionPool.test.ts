/**
 *  Test of TransactionPool
 *
 *  Copyright:
 *      Copyright (c) 2022 BOSAGORA Foundation All rights reserved.
 *
 *  License:
 *       MIT License. See LICENSE for details.
 */

import { Transaction } from "rollup-pm-sdk";

import { TransactionPool } from "../../src/service/scheduler/TransactionPool";

import * as assert from "assert";

describe("TransactionPool", () => {
    const addresses = [
        "0xbe71a56bAB18a4acf15a21A77cd16497da1c8e67",
        "0xC4d5e97a0335d416012F9a58EcBB3BF14D632902",
        "0x2A59068bd8579E2A703Bd5cF497844EC5ace1fae",
        "0xaaA86429BF3C0efF1e2F6Fa6094497597454C796",
        "0x73d662322EF0F002f76fa69b2B304d189719b577",
        "0x2918DBe8abcCCEe4965c199442B9192369A1d07d",
        "0x667b99c632e50284aCAD52F3Ca5118819A416A17",
        "0xa8039777CaD29b2ac26D6fF5A03015bFC1631D9F",
        "0xAdbB19207AB3f420603CcB827630010758daafE8",
        "0x586547F4FddeDBFB03878CC4EA3dB017f7803Fb6",
        "0xe1D0808481063fa4aC5117De36052Bfd7c58B8ab",
        "0x97C63C4aede30A528C18DA20367a8A47Be0e86E6",
        "0x30D60c530a34bF2B777617ADE079883e71793619",
        "0xe13677C10fc2c8064587120B724F77C027F699cb",
        "0xA34Bb90375B695D603d53a6d8789C6F55Ac9170C",
        "0xcd3C83ea93368cd2b4b7361d4061Bb91eB23b636",
        "0x08C1EF2c2a3C87Fa87A40EE77D89f3526de278ad",
        "0xb13c4B6036fA65495e396d3C524D6EfC45991816",
        "0xc73d3266c8FF50197582aB7c83246D492F978c2A",
        "0x705ddF3da7143635143604Ef93d7624cA91905A5",
    ];

    // The test codes below compare with the values calculated in Agora.
    it("Test for transactionPool", () => {
        const txs = addresses.map(
            (m) =>
                new Transaction("12345678", "0x064c9Fc53d5936792845ca58778a52317fCf47F2", m, 10000n, 1668000000, "", "")
        );

        const tx_pool = new TransactionPool();
        txs.forEach((m) => tx_pool.add(m));

        assert.strictEqual(tx_pool.length, txs.length);

        for (let idx = 0; idx < tx_pool.length; idx++) {
            const tx = tx_pool.get(1);
            assert.deepStrictEqual(tx, [txs[idx]]);
            tx_pool.remove(tx);
        }
    });
});
