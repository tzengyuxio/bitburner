/** @param {NS} ns */
export async function main(ns) {
    let host = ns.args[0];
    let target = ns.args[1];
    let numHackThreads = ns.args[2];
    let numGrowThreads = ns.args[3];
    let numWeakenThreadsAfterHack = ns.args[4];
    let numWeakenThreadsAfterGrow = ns.args[5];
    let sleepTime1 = ns.args[6];
    let sleepTime2 = ns.args[7];
    let sleepTime3 = ns.args[8];
    let tag = ns.args[9];

    numHackThreads = Math.max(numHackThreads, 1);
    numGrowThreads = Math.max(numGrowThreads, 1);
    numWeakenThreadsAfterHack = Math.max(numWeakenThreadsAfterHack, 1);
    numWeakenThreadsAfterGrow = Math.max(numWeakenThreadsAfterGrow, 1);

    ns.exec( "doWeaken.js", host, numWeakenThreadsAfterHack, target, "W1-" + tag);
    await ns.sleep(sleepTime1);
    ns.exec( "doWeaken.js", host, numWeakenThreadsAfterGrow, target, "W2-" + tag);
    await ns.sleep(sleepTime2);
    ns.exec("doGrow.js", host, numGrowThreads, target, "G-" + tag);
    await ns.sleep(sleepTime3);
    ns.exec("doHack.js", host, numHackThreads, target, "H-" + tag);
}
