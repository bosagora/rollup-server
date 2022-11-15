// tslint:disable-next-line:no-var-requires
const IPFS = require("ipfs-mini");

import URI from "urijs";

export class IPFSManager {
    private ipfs: any;
    constructor(api_url: string) {
        const uri = URI(api_url);
        this.ipfs = new IPFS({ host: uri.host(), port: uri.port(), protocol: uri.protocol() });
    }

    public add(data: string | Buffer): Promise<string> {
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
