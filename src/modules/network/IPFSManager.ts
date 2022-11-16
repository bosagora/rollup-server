// tslint:disable-next-line:no-var-requires
const IPFS = require("ipfs-mini");

import crypto from "crypto";
import URI from "urijs";

// tslint:disable-next-line:no-var-requires
const bs58 = require("bs58");

export class IPFSManager {
    private ipfs: any;
    private test: boolean;

    constructor(api_url: string) {
        const uri = URI(api_url);
        this.ipfs = new IPFS({ host: uri.host(), port: uri.port(), protocol: uri.protocol() });
        this.test = false;
    }

    public setTest(value: boolean) {
        this.test = value;
    }

    public add(data: string | Buffer): Promise<string> {
        if (this.test) {
            return new Promise<string>((resolve, reject) => {
                crypto.randomBytes(32, (err, buf) => {
                    if (err === null) {
                        return resolve(bs58.encode(buf));
                    } else {
                        return reject(err);
                    }
                });
            });
        }
        return new Promise<string>((resolve, reject) => {
            this.ipfs.add(data, (err: any, result: string) => {
                if (err === null) {
                    return resolve(result);
                } else {
                    return reject(new Error(err));
                }
            });
        });
    }
}
