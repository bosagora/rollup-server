import * as assert from "assert";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { BigNumber } from "ethers";
import { ethers, waffle } from "hardhat";
import { Utils } from "../../src/modules/utils/Utils";
import { RollUp } from "../../typechain";

chai.use(solidity);

describe("Test of RollUp Contract", () => {
    let contract: RollUp;

    const provider = waffle.provider;
    const [admin] = provider.getWallets();
    // const admin = new Wallet(process.env.MANAGER_KEY || "");
    const admin_signer = provider.getSigner(admin.address);

    before(async () => {
        const RollUpFactory = await ethers.getContractFactory("RollUp");

        contract = await RollUpFactory.connect(admin_signer).deploy();
        await contract.deployed();
    });

    it("Test of Add BlockHeader to RollUp", async () => {
        const admin_contract = contract.connect(admin_signer);
        await (
            await admin_contract.add(
                BigNumber.from(0),
                Utils.readFromString("0x0000000000000000000000000000000000000000000000000000000000000000"),
                Utils.readFromString("0x37de7c4108513ded722a14d9b59a1cbb0aafb7746bb7e110140419f8fa2f6c39"),
                BigNumber.from(1669702553),
                "QmW3CT4SHmso5dRJdsjR8GL1qmt79HkdAebCn2uNaWXFYh"
            )
        ).wait();

        const res = await admin_contract.getByHeight(BigNumber.from(0));
        assert.deepStrictEqual(res[0], BigNumber.from(0));
        assert.deepStrictEqual(res[1], "0x0000000000000000000000000000000000000000000000000000000000000000");
        assert.deepStrictEqual(res[2], "0x37de7c4108513ded722a14d9b59a1cbb0aafb7746bb7e110140419f8fa2f6c39");
        assert.deepStrictEqual(res[3], 1669702553);
        assert.deepStrictEqual(res[4], "QmW3CT4SHmso5dRJdsjR8GL1qmt79HkdAebCn2uNaWXFYh");

        assert.deepStrictEqual(await admin_contract.size(), BigNumber.from(1));
    });
});
