import * as libfmt from 'libfmt.js';
import * as libhwgw from 'libhwgw.js';

/** @param {NS} ns */
export async function main(ns) {
    let target = ns.args[0];
    let delay = 250; // ms

    let allHosts = libhwgw.getAllHosts(ns);

    // determine how many threads we need to lower security to the minimum
    ns.tprintf("Target host: %s", target);
    ns.tprintf("    Money (current/max): (%s / %s)", ns.getServerMoneyAvailable(target).toLocaleString(), ns.getServerMaxMoney(target).toLocaleString());

    let needWeakenThreadsBefore = libhwgw.calcNeedThreadsForWeaken(ns, target);
    let needGrowThreads = libhwgw.calcNeedThreadsForGrow(ns, target);
    let needWeakenThreadsAfter = Math.ceil(needGrowThreads * 0.004 / 0.05);
    ns.tprintf("    Need threads: %d(weaken) -> %d(grow) -> %d(weaken)", needWeakenThreadsBefore, needGrowThreads, needWeakenThreadsAfter);

    let sleepTimes = libhwgw.sleepTimes(delay, ns.getGrowTime(target), 0, ns.getWeakenTime(target));
    let totalTime = sleepTimes.reduce((a, b) => a + b, 0);
    ns.tprintf("    Total time: %s (%s -> %s -> %s)", libfmt.ms2str(totalTime),
        libfmt.ms2str(sleepTimes[0]), libfmt.ms2str(sleepTimes[1]), libfmt.ms2str(sleepTimes[2] + sleepTimes[3]));

    let leftWeakenThreadsBefore = libhwgw.findCopyAndLaunch(ns, allHosts, needWeakenThreadsBefore, "doWeaken.js", target, "WKN1");
    await ns.sleep(sleepTimes[0]);
    let leftWeakenThreadsAfter = libhwgw.findCopyAndLaunch(ns, allHosts, needWeakenThreadsAfter, "doWeaken.js", target, "WKN2");
    await ns.sleep(sleepTimes[1]);
    let leftGrowThreads = libhwgw.findCopyAndLaunch(ns, allHosts, needGrowThreads, "doGrow.js", target, "GROW");
    await ns.sleep(sleepTimes[2] + sleepTimes[3]);
    ns.tprintf("Left threads: %d(weaken), %d(grow), %d(weaken) on target host[%s]", leftWeakenThreadsBefore, leftGrowThreads, leftWeakenThreadsAfter, target);
}