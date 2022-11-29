// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract RollUp is Ownable {
    struct BlockHeader {
        uint64 height;
        bytes32 prevBlock;
        bytes32 merkleRoot;
        uint32 timestamp;
        string CID;
    }

    uint64 lastHeight;
    uint64[] internal heightArray;
    mapping(uint64 => BlockHeader) internal blockMap;

    event addBlock(uint64 _height);

    constructor() {
        lastHeight = type(uint64).max;
    }

    function add(
        uint64 _height,
        bytes32 _prevBlock,
        bytes32 _merkleRoot,
        uint32 _timestamp,
        string memory _cid
    ) public onlyOwner {
        require((lastHeight == type(uint64).max && _height == 0) || lastHeight + 1 == _height, "E001");

        BlockHeader memory blockHeader = BlockHeader({
            height: _height,
            prevBlock: _prevBlock,
            merkleRoot: _merkleRoot,
            timestamp: _timestamp,
            CID: _cid
        });
        blockMap[_height] = blockHeader;
        heightArray.push(_height);
        lastHeight = _height;
        emit addBlock(_height);
    }

    function getByHeight(uint64 _height)
        public
        view
        returns (
            uint64,
            bytes32,
            bytes32,
            uint32,
            string memory
        )
    {
        require(_height <= lastHeight, "E002");
        BlockHeader memory blockHeader = blockMap[_height];
        return (
            blockHeader.height,
            blockHeader.prevBlock,
            blockHeader.merkleRoot,
            blockHeader.timestamp,
            blockHeader.CID
        );
    }

    function size() public view returns (uint64) {
        return uint64(heightArray.length);
    }
}
