/**
 *  Includes various types
 *
 *  Copyright:
 *      Copyright (c) 2022 BOSAGORA Foundation All rights reserved.
 *
 *  License:
 *       MIT License. See LICENSE for details.
 */

export interface ITransaction {
    trade_id: string;
    user_id: string;
    state: string;
    amount: bigint;
    timestamp: number;
    exchange_user_id: string;
    exchange_id: string;
}
