import * as assert from "assert";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { BigNumber } from "ethers";
import { ethers, waffle } from "hardhat";
import { Utils } from "rollup-pm-sdk";
import { RollUp } from "../../typechain";

chai.use(solidity);

describe("Test of RollUp Contract", () => {
    let contract: RollUp;

    const provider = waffle.provider;
    const [admin] = provider.getWallets();
    // const admin = new Wallet(process.env.ADMIN_KEY || "");
    const admin_signer = provider.getSigner(admin.address);

    before(async () => {
        const RollUpFactory = await ethers.getContractFactory("RollUp");

        contract = await RollUpFactory.connect(admin_signer).deploy();
        await contract.deployed();
    });

    it("Test of Add BlockHeader to RollUp", async () => {
        const admin_contract = contract.connect(admin_signer);
        await expect(
            await admin_contract.add(
                BigNumber.from(0),
                Utils.readFromString("0x0000000000000000000000000000000000000000000000000000000000000000"),
                Utils.readFromString("0x0000000000000000000000000000000000000000000000000000000000000000"),
                Utils.readFromString("0x37de7c4108513ded722a14d9b59a1cbb0aafb7746bb7e110140419f8fa2f6c39"),
                BigNumber.from(1669702553),
                "QmW3CT4SHmso5dRJdsjR8GL1qmt79HkdAebCn2uNaWXFYh"
            )
        ).to.emit(admin_contract, "AddedBlock");

        const res = await admin_contract.getByHeight(BigNumber.from(0));
        assert.deepStrictEqual(res[0], BigNumber.from(0));
        assert.deepStrictEqual(res[1], "0x0000000000000000000000000000000000000000000000000000000000000000");
        assert.deepStrictEqual(res[2], "0x0000000000000000000000000000000000000000000000000000000000000000");
        assert.deepStrictEqual(res[3], "0x37de7c4108513ded722a14d9b59a1cbb0aafb7746bb7e110140419f8fa2f6c39");
        assert.deepStrictEqual(res[4], BigNumber.from(1669702553));
        assert.deepStrictEqual(res[5], "QmW3CT4SHmso5dRJdsjR8GL1qmt79HkdAebCn2uNaWXFYh");

        assert.deepStrictEqual(await admin_contract.size(), BigNumber.from(1));
    });

    it("Test of Add BlockHeader height 1", async () => {
        const admin_contract = contract.connect(admin_signer);
        await (
            await admin_contract.add(
                BigNumber.from(1),
                Utils.readFromString("0xc37e8a7e16f89b16fb6c653991b1a9ad2bb317dcee2021621e9ded79df054b2d"),
                Utils.readFromString("0x0000000000000000000000000000000000000000000000000000000000000000"),
                Utils.readFromString("0xb10edf5e825d5be4dca9a2d432ed2a997e391f70f109c4410ee0b966a83de995"),
                BigNumber.from(1669703553),
                "QmW3CT4SHmso5dRJdsjR8GL1qmt79HkdAebCn2uNaWXF1h"
            )
        ).wait();

        const res = await admin_contract.getByHeight(BigNumber.from(1));
        assert.deepStrictEqual(res[0], BigNumber.from(1));
        assert.deepStrictEqual(res[1], "0xc37e8a7e16f89b16fb6c653991b1a9ad2bb317dcee2021621e9ded79df054b2d");
        assert.deepStrictEqual(res[2], "0x0000000000000000000000000000000000000000000000000000000000000000");
        assert.deepStrictEqual(res[3], "0xb10edf5e825d5be4dca9a2d432ed2a997e391f70f109c4410ee0b966a83de995");
        assert.deepStrictEqual(res[4], BigNumber.from(1669703553));
        assert.deepStrictEqual(res[5], "QmW3CT4SHmso5dRJdsjR8GL1qmt79HkdAebCn2uNaWXF1h");

        assert.deepStrictEqual(await admin_contract.size(), BigNumber.from(2));

        await expect(
            admin_contract.add(
                BigNumber.from(2),
                Utils.readFromString("0xfb70b52757351317940d8e8380142a2d9b737df3a651aa7b388a3a4186ace6d0"),
                Utils.readFromString("0x0000000000000000000000000000000000000000000000000000000000000000"),
                Utils.readFromString("0xb10edf5e825d5be4dca9a2d432ed2a997e391f70f109c4410ee0b966a83de995"),
                BigNumber.from(1669704553),
                "QmW3CT4SHmso5dRJdsjR8GL1qmt79HkdAebCn2uNaWXF1h"
            )
        ).to.be.revertedWith("E002: The previous block hash is not valid.");

        assert.deepStrictEqual(await admin_contract.size(), BigNumber.from(2));
    });

    it("Test of Get by BlockHashs", async () => {
        const admin_contract = contract.connect(admin_signer);
        let res_hash = await admin_contract.getByHash(
            Utils.readFromString("0x0000000000000000000000000000000000000000000000000000000000000000")
        );
        assert.deepStrictEqual(res_hash[0], BigNumber.from(0));

        let res_height = await admin_contract.getByHeight(BigNumber.from(0));
        assert.deepStrictEqual(res_hash, res_height);

        res_hash = await admin_contract.getByHash(
            Utils.readFromString("0xc37e8a7e16f89b16fb6c653991b1a9ad2bb317dcee2021621e9ded79df054b2d")
        );
        assert.deepStrictEqual(res_hash[0], BigNumber.from(1));

        res_height = await admin_contract.getByHeight(BigNumber.from(1));
        assert.deepStrictEqual(res_hash, res_height);

        await expect(
            admin_contract.getByHash(
                Utils.readFromString("0x1111111111111111111111111111111111111111111111111111111111111111")
            )
        ).to.be.revertedWith("E005: No corresponding block hash key value.");
    });
});
