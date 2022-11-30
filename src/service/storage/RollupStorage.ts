import { Storage } from "../../modules/storage/Storage";
import { IDatabaseConfig } from "../common/Config";
import { createTableQuery, deleteQuery, dropQuery, insertQuery, selectQuery } from "./schema/RollupSchema";

import { ITransaction } from "rollup-pm-sdk";

export class RollupStorage extends Storage {
    constructor(databaseConfig: IDatabaseConfig, callback: (err: Error | null) => void) {
        super(databaseConfig, callback);
    }

    public createTables(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.database.exec(createTableQuery, (err) => {
                if (err) reject(err);
                resolve();
            });
        });
    }

    public insert(params: ITransaction[]): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (params.length < 1) reject("The data is not available.");
            const statement = this.database.prepare(insertQuery);
            params.forEach((row) => {
                statement.run([
                    row.trade_id,
                    row.user_id,
                    row.state,
                    row.amount.toString(),
                    row.timestamp,
                    row.exchange_user_id,
                    row.exchange_id,
                    row.signature,
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

    public select(trade_id: string): Promise<ITransaction[]> {
        return new Promise<ITransaction[]>((resolve, reject) => {
            this.database.all(selectQuery, [trade_id], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });
    }

    public delete(trade_id: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.database.run(deleteQuery, [trade_id], (err) => {
                if (err) reject(err);
                resolve(true);
            });
        });
    }
}
