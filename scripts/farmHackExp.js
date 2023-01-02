/** @param {NS} ns */
export async function main(ns) {
    let host = "home";
    let target = "joesguns";
    let freeRam = ns.getServerMaxRam(host) - ns.getServerUsedRam(host) - 256;
    freeRam = Math.max(freeRam, 0);
    let numThreads = Math.floor(freeRam / 1.75);
    ns.exec("loopGrow.js", host, numThreads, target);
}
