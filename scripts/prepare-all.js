import * as libhwgw from 'libhwgw.js';

/** @param {NS} ns */
export async function main(ns) {
    let startNode = "home";
    let nodes = libhwgw.bfs(ns, startNode);

    for (let i = 0; i < nodes.length; ++i) {
        let target = nodes[i];
        if (!ns.hasRootAccess(target)) {
            continue;
        }
        if (libhwgw.isReady(ns, target)) {
            continue;
        }
        ns.exec("prepare-one.js", startNode, 1, target);
    }
}