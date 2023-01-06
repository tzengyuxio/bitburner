import * as libhwgw from 'libhwgw.js';

/** @param {NS} ns */
export async function main(ns) {
    let pservs = ns.getPurchasedServers();
    let targets = libhwgw.topMaxMoneyServers(ns);

    for (let i = 0; i < pservs.length && i < targets.length; ++i) {
        let pserv = pservs[i];
        let target = targets[i];
        ns.scp("libfmt.js", pserv);
        ns.scp("libhwgw.js", pserv);
        ns.scp("doWeaken.js", pserv);
        ns.scp("doGrow.js", pserv);
        ns.scp("doHack.js", pserv);
        ns.scp("batch-one.js", pserv);
        ns.scp("prepare-one.js", pserv);
        ns.exec("batch-one.js", pserv, 1, pserv, target);
    }
}