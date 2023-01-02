/** @param {NS} ns */
export async function main(ns) {
    let target = ns.args[0];
    let player = ns.getPlayer();
    let server = ns.getServer(target);
    let stealRatio = 0.8; // 每次偷的比例, 0.1 = 10%
    let cpuCores = 1; // ns.getServer("home").cpuCores;
    let memScript = 1.7; // 1.70GB

    let hackTime = ns.getHackTime(target);
    let growTime = ns.getGrowTime(target);
    let weakenTime = ns.getWeakenTime(target);

    function ms2str(milliseconds) {
        var temp = Math.floor(milliseconds / 1000);
        var decimal_part = Math.round(milliseconds - temp * 1000);
        var levels = [
            [Math.floor(temp / 86400), "days"],
            [Math.floor((temp % 86400) / 3600), "hours"],
            [Math.floor((temp % 3600) / 60), "minutes"],
            [(temp % 60) + decimal_part / 1000, "seconds"],
        ];
        var returntext = "";

        for (var i = 0, max = levels.length; i < max; i++) {
            if (levels[i][0] === 0) continue;
            returntext +=
                " " +
                levels[i][0] +
                " " +
                (levels[i][0] === 1
                    ? levels[i][1].substr(0, levels[i][1].length - 1)
                    : levels[i][1]);
        }
        return returntext.trim();
    }

    let hackAmount = ns.getServerMaxMoney(target) * stealRatio;
    let numHackThreads = Math.ceil(ns.hackAnalyzeThreads(target, hackAmount));
    let hackIncreasedSecurity = ns.hackAnalyzeSecurity(numHackThreads, target);
    let numGrowThreads = Math.ceil( ns.growthAnalyze(target, 1 / (1 - stealRatio), cpuCores));
    let growIncreasedSecurity = numGrowThreads * 0.004;

    let numWeakenThreadsAfterHack = Math.ceil(hackIncreasedSecurity / 0.05);
    let numWeakenThreadsAfterGrow = Math.max(
        Math.ceil(growIncreasedSecurity / 0.05),
        1
    );

    ns.tprintf("[%s]:\n", target);
    ns.tprintf("Hack time: %s\n", ms2str(hackTime));
    ns.tprintf("Grow time: %s\n", ms2str(growTime));
    ns.tprintf("Weaken time: %s\n", ms2str(weakenTime));
    ns.tprintf("----------------------------------------");
    ns.tprintf("Steal ratio: %d%%", stealRatio * 100);
    ns.tprintf("Hack amount: %.2f\n", hackAmount);
    ns.tprintf("Hack numThreads: %d\n", numHackThreads);
    ns.tprintf("Hack increasedSecurity: %.2f\n", hackIncreasedSecurity);
    ns.tprintf("Grow numThreads: %d\n", numGrowThreads);
    ns.tprintf("Grow increasedSecurity: %.2f\n", growIncreasedSecurity);
    ns.tprintf(
        "Weaken numThreads (after hack): %d\n",
        numWeakenThreadsAfterHack
    );
    ns.tprintf(
        "Weaken numThreads (after grow): %d\n",
        numWeakenThreadsAfterGrow
    );

    // batch cycle
    let betweenRange = 3000; // ms
    let startTimeW1 = 0;
    let startTimeW2 = startTimeW1 + betweenRange * 2;
    let startTimeG = startTimeW1 + (weakenTime + betweenRange - growTime);
    let startTimeH = startTimeW1 + (weakenTime - betweenRange - hackTime);
    let sleepTime1 = startTimeW2 - startTimeW1;
    let sleepTime2 = startTimeG - startTimeW2;
    let sleepTime3 = startTimeH - startTimeG;
    let sleepTime4 = hackTime + betweenRange / 2;
    ns.tprintf("----------------------------------------");
    ns.tprintf(
        "| %s | %s | %s | %s |\n",
        ms2str(sleepTime1),
        ms2str(sleepTime2),
        ms2str(sleepTime3),
        ms2str(hackTime)
    );
    let filename = 'batch-cycle.txt'
    ns.write(filename, ns.sprintf("MAX SecurityLevel: %f\n", ns.getServerMinSecurityLevel(target)), "w");
    ns.write(filename, ns.sprintf("SecurityLevel: %f\n", ns.getServerSecurityLevel(target)), "a");
    // ns.weaken(target, { threads: numWeakenThreadsAfterHack });
    ns.exec("doWeaken.js", "home", numWeakenThreadsAfterHack, target, "W1");
    await ns.sleep(sleepTime1);
    // ns.weaken(target, { threads: numWeakenThreadsAfterGrow });
    ns.exec("doWeaken.js", "home", numWeakenThreadsAfterGrow, target, "W2");
    await ns.sleep(sleepTime2);
    // ns.grow(target, { threads: numGrowThreads });
    ns.exec("doGrow.js", "home", numGrowThreads, target);
    await ns.sleep(sleepTime3);
    // ns.hack(target, { threads: numHackThreads });
    ns.exec("doHack.js", "home", numHackThreads, target);
    await ns.sleep(sleepTime4);
    ns.write(filename, ns.sprintf("SecurityLevel: %f (H)\n", ns.getServerSecurityLevel(target)), "a");
    await ns.sleep(betweenRange);
    ns.write(filename, ns.sprintf("SecurityLevel: %f (W1)\n", ns.getServerSecurityLevel(target)), "a");
    await ns.sleep(betweenRange);
    ns.write(filename, ns.sprintf("SecurityLevel: %f (G)\n", ns.getServerSecurityLevel(target)), "a");
    await ns.sleep(betweenRange);
    ns.write(filename, ns.sprintf("SecurityLevel: %f (W2)\n", ns.getServerSecurityLevel(target)), "a");
    await ns.sleep(betweenRange*20);
}
