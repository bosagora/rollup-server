import { plainToClass } from "class-transformer";
import { hashFull, Transaction } from "rollup-pm-sdk";
import { Storage } from "../../modules/storage/Storage";
import { IDatabaseConfig } from "../common/Config";
import {
    createTxTableQuery,
    deleteByHashQuery,
    insertQuery,
    selectByHashQuery,
    selectByLengthQuery,
    selectLength,
} from "./schema/RollupSchema";

export class RollupStorage extends Storage {
    constructor(databaseConfig: IDatabaseConfig, callback: (err: Error | null) => void) {
        super(databaseConfig, callback);
    }

    public createTables(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.database.exec(createTxTableQuery, (err) => {
                if (err) reject(err);
                resolve();
            });
        });
    }

    public static make(databaseConfig: IDatabaseConfig): Promise<RollupStorage> {
        return new Promise<RollupStorage>((resolve, reject) => {
            const result: RollupStorage = new RollupStorage(databaseConfig, async (err: Error | null) => {
                if (err) reject(err);
                else {
                    return resolve(result);
                }
            });
        });
    }

    public insert(params: DBTransaction[]): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (params.length < 1) reject("The data is not available.");
            const statement = this.database.prepare(insertQuery);
            params.forEach((row) => {
                statement.run([
                    row.trade_id,
                    row.user_id,
                    row.state,
                    row.amount?.toString(),
                    row.timestamp,
                    row.exchange_user_id,
                    row.exchange_id,
                    row.signer,
                    row.signature,
                    row.hash,
                ]);
            });
            statement.finalize((err) => {
                if (err) {
                    reject(err);
                }
                resolve(true);
            });
        });
    }

    public selectByLength(length: number): Promise<DBTransaction[]> {
        return new Promise<DBTransaction[]>((resolve, reject) => {
            this.database.all(selectByLengthQuery, [length], (err: Error | null, row: DBTransaction[]) => {
                if (err) reject(err);
                const list = row.map((tx: DBTransaction) => tx as DBTransaction);
                resolve(list);
            });
        });
    }

    public selectByHash(hash: string): Promise<DBTransaction | null> {
        return new Promise<DBTransaction | null>((resolve, reject) => {
            this.database.all(selectByHashQuery, [hash], (err: Error | null, row: DBTransaction[]) => {
                if (err) reject(err);
                if (row.length > 0) {
                    resolve(row[0] as DBTransaction);
                } else {
                    resolve(null);
                }
            });
        });
    }

    public deleteByHash(hash: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.database.run(deleteByHashQuery, [hash], (err: Error | null) => {
                if (err) reject(err);
                resolve(true);
            });
        });
    }

    public length(): Promise<number> {
        return new Promise((resolve, reject) => {
            this.database.all(selectLength, [], (err: Error | null, row) => {
                if (err) reject(err);
                if (row?.length) {
                    resolve(row[0].count);
                } else {
                    reject(null);
                }
            });
        });
    }
}

export class DBTransaction {
    public tx_id: number | undefined;
    public hash: string;
    public trade_id: string;
    public user_id: string;
    public state: string;
    public amount: bigint;
    public timestamp: number;
    public exchange_user_id: string;
    public exchange_id: string;
    public signer: string;
    public signature: string;

    constructor(
        trade_id: string,
        user_id: string,
        state: string,
        amount: bigint,
        timestamp: number,
        exchange_user_id: string,
        exchange_id: string,
        signer?: string,
        signature?: string,
        hash?: string
    ) {
        this.trade_id = trade_id;
        this.user_id = user_id;
        this.state = state;
        this.amount = amount;
        this.timestamp = timestamp;
        this.exchange_user_id = exchange_user_id;
        this.exchange_id = exchange_id;
        if (signer !== undefined) this.signer = signer;
        else this.signer = "";
        if (signature !== undefined) this.signature = signature;
        else this.signature = "";
        if (hash !== undefined) this.hash = hash;
        else this.hash = "";
    }

    public static make(tx: Transaction): DBTransaction {
        const dtx: DBTransaction = plainToClass(DBTransaction, tx);
        dtx.hash = hashFull(tx).toString();
        return dtx;
    }

    public static converterTxArray(dbTx: DBTransaction[]): Transaction[] {
        return dbTx.map(
            (row) =>
                new Transaction(
                    row.trade_id,
                    row.user_id,
                    row.state,
                    BigInt(row.amount),
                    row.timestamp,
                    row.exchange_user_id,
                    row.exchange_id,
                    row.signer,
                    row.signature
                )
        );
    }
}
