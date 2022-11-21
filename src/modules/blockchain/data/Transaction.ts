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
     * ID of the trade
     */
    public trade_id: string;

    /**
     * The ID of User
     */
    public user_id: string;

    /**
     * The type of transaction
     */
    public state: string;

    /**
     * The amount of sending
     */
    public amount: bigint;

    /**
     * The time stamp
     */
    public timestamp: number;

    /**
     * The exchange user id
     */
    public exchange_user_id: string;

    /**
     * The exchange id
     */
    public exchange_id: string;

    /**
     * Constructor
     */
    constructor(
        trade_id: string,
        user_id: string,
        state: string,
        amount: bigint,
        timestamp: number,
        exchange_user_id: string,
        exchange_id: string
    ) {
        this.trade_id = trade_id;
        this.user_id = user_id;
        this.state = state;
        this.amount = amount;
        this.timestamp = timestamp;
        this.exchange_user_id = exchange_user_id;
        this.exchange_id = exchange_id;
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

        return new Transaction(
            value.trade_id,
            value.user_id,
            value.state,
            BigInt(value.amount),
            value.timestamp,
            value.exchange_user_id,
            value.exchange_id
        );
    }

    /**
     * Collects data to create a hash.
     * @param buffer The buffer where collected data is stored
     */
    public computeHash(buffer: SmartBuffer) {
        hashPart(this.trade_id, buffer);
        hashPart(this.user_id, buffer);
        hashPart(this.state, buffer);
        hashPart(this.amount, buffer);
        hashPart(this.timestamp, buffer);
        hashPart(this.exchange_user_id, buffer);
        hashPart(this.exchange_id, buffer);
    }

    /**
     * Converts this object to its JSON representation
     */
    public toJSON(): any {
        return {
            trade_id: this.trade_id,
            user_id: this.user_id,
            state: this.state,
            amount: this.amount.toString(),
            timestamp: this.timestamp,
            exchange_user_id: this.exchange_user_id,
            exchange_id: this.exchange_id,
        };
    }

    /**
     * Creates and returns a copy of this object.
     */
    public clone(): Transaction {
        return new Transaction(
            this.trade_id,
            this.user_id,
            this.state,
            this.amount,
            this.timestamp,
            this.exchange_user_id,
            this.exchange_id
        );
    }
}
