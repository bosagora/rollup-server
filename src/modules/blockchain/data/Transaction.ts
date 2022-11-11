/**
 *  The class that defines the transaction of a block.
 *
 *  Copyright:
 *      Copyright (c) 2022 BOSAGORA Foundation All rights reserved.
 *
 *  License:
 *       MIT License. See LICENSE for details.
 */

import { JSONValidator } from "../../utils/JSONValidator";
import { hashPart } from "../common/Hash";

import { SmartBuffer } from "smart-buffer";

/**
 * The class that defines the transaction of a block.
 * Convert JSON object to TypeScript's instance.
 * An exception occurs if the required property is not present.
 */
export class Transaction {
    /**
     * ID of transaction
     */
    public id: string;

    /**
     * The address of the sender
     */
    public sender: string;

    /**
     * The address of the receiver
     */
    public receiver: string;

    /**
     * The amount of sending
     */
    public amount: bigint;

    /**
     * The time stamp
     */
    public timestamp: number;

    /**
     * Constructor
     */
    constructor(id: string, sender: string, receiver: string, amount: bigint, timestamp: number) {
        this.id = id;
        this.sender = sender;
        this.receiver = receiver;
        this.amount = amount;
        this.timestamp = timestamp;
    }

    /**
     * The reviver parameter to give to `JSON.parse`
     *
     * This function allows to perform any necessary conversion,
     * as well as validation of the final object.
     *
     * @param key   Name of the field being parsed
     * @param value The value associated with `key`
     * @returns A new instance of `Transaction` if `key == ""`, `value` otherwise.
     */
    public static reviver(key: string, value: any): any {
        if (key !== "") return value;

        JSONValidator.isValidOtherwiseThrow("Transaction", value);

        return new Transaction(value.id, value.sender, value.receiver, BigInt(value.amount), value.timestamp);
    }

    /**
     * Collects data to create a hash.
     * @param buffer The buffer where collected data is stored
     */
    public computeHash(buffer: SmartBuffer) {
        hashPart(this.id, buffer);
        hashPart(this.sender, buffer);
        hashPart(this.receiver, buffer);
        hashPart(this.amount, buffer);
        hashPart(this.timestamp, buffer);
    }

    /**
     * Converts this object to its JSON representation
     */
    public toJSON(): any {
        return {
            id: this.id,
            sender: this.sender,
            receiver: this.receiver,
            amount: this.amount.toString(),
            timestamp: this.timestamp,
        };
    }

    /**
     * Creates and returns a copy of this object.
     */
    public clone(): Transaction {
        return new Transaction(this.id, this.sender, this.receiver, this.amount, this.timestamp);
    }
}
