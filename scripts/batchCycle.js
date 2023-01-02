/** @param {NS} ns */
export async function main(ns) {
    let host = ns.args[0];
    let target = ns.args[1];
    let mock = ns.args[2];
    let player = ns.getPlayer();
    let server = ns.getServer(target);
    let stealRatio = 0.8; // 每次偷的比例, 0.1 = 10%
    let cpuCores = 1; // ns.getServer("home").cpuCores;
    let memScript = 1.75; // 1.70GB

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
    let numGrowThreads = Math.ceil(
        ns.growthAnalyze(target, 1 / (1 - stealRatio), cpuCores)
    );
    let growIncreasedSecurity = numGrowThreads * 0.004;

    let numWeakenThreadsAfterHack = Math.ceil(hackIncreasedSecurity / 0.05);
    let numWeakenThreadsAfterGrow = Math.max(
        Math.ceil(growIncreasedSecurity / 0.05),
        1
    );
    let numTotalThreads =
        numHackThreads +
        numGrowThreads +
        numWeakenThreadsAfterHack +
        numWeakenThreadsAfterGrow;

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
    ns.tprintf("Total numThreads: %d\n", numTotalThreads);

    // batch cycle
    let betweenRange = 250; // ms
    let betweenBatch = betweenRange * 6; // ms, at least 4x of betweenRange
    let startTimeW1 = 0;
    let startTimeW2 = startTimeW1 + betweenRange * 2;
    let startTimeG = startTimeW1 + (weakenTime + betweenRange - growTime);
    let startTimeH = startTimeW1 + (weakenTime - betweenRange - hackTime);
    let sleepTime1 = startTimeW2 - startTimeW1;
    let sleepTime2 = startTimeG - startTimeW2;
    let sleepTime3 = startTimeH - startTimeG;
    ns.tprintf("----------------------------------------");
    ns.tprintf(
        "| %s | %s | %s | %s |\n",
        ms2str(sleepTime1),
        ms2str(sleepTime2),
        ms2str(sleepTime3),
        ms2str(hackTime)
    );

    let freeRam = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
    let numBatch = Math.floor(freeRam / (numTotalThreads * memScript));
    let batchTime = weakenTime + betweenRange * 2;

    let numBatchUpperLimit = Math.floor(batchTime / betweenBatch);
    ns.tprintf(
        "Batch count: %d (upperlimit: %d)\n",
        numBatch,
        numBatchUpperLimit
    );
    ns.tprintf("Batch time: %s\n", ms2str(batchTime));
    if (mock == "T") {
        return;
    }
    let j = 0;
    ns.scp("hwgw.js", host);
    ns.scp("doWeaken.js", host);
    ns.scp("doGrow.js", host);
    ns.scp("doHack.js", host);
    while (true) {
        numBatch = Math.min(numBatch, numBatchUpperLimit - 1);
        for (let i = 0; i < numBatch; ++i) {
            let tag = j * 100 + i;
            // ns.tprintf("run a batch\n");
            ns.exec(
                "hwgw.js",
                host,
                1,
                host,
                target,
                numHackThreads,
                numGrowThreads,
                numWeakenThreadsAfterHack,
                numWeakenThreadsAfterGrow,
                sleepTime1,
                sleepTime2,
                sleepTime3,
                tag
            );
            await ns.sleep(betweenBatch);
        }
        ++j;
        let sleepTimeBetweenBatchGroup =
            batchTime - (numBatch - 1) * betweenBatch + betweenBatch;
        sleepTimeBetweenBatchGroup = Math.max(
            sleepTimeBetweenBatchGroup,
            betweenBatch * 2
        );
        await ns.sleep();

        // recalculate
        hackTime = ns.getHackTime(target);
        growTime = ns.getGrowTime(target);
        weakenTime = ns.getWeakenTime(target);

        hackAmount = ns.getServerMaxMoney(target) * stealRatio;
        numHackThreads = Math.ceil(ns.hackAnalyzeThreads(target, hackAmount)); // [x]
        hackIncreasedSecurity = ns.hackAnalyzeSecurity(numHackThreads, target);
        numGrowThreads = Math.ceil(
            ns.growthAnalyze(target, 1 / (1 - stealRatio), cpuCores)
        ); // [x]
        growIncreasedSecurity = numGrowThreads * 0.004;

        let securityLoss =
            ns.getServerSecurityLevel(target) -
            ns.getServerMinSecurityLevel(target);
        numWeakenThreadsAfterHack = Math.ceil(
            securityLoss + hackIncreasedSecurity / 0.05
        ); // [x]
        numWeakenThreadsAfterGrow = Math.ceil(
            securityLoss + growIncreasedSecurity / 0.05
        ); // [x]
        sleepTime1 = betweenRange * 2; // [x]
        sleepTime2 = weakenTime - betweenRange - growTime; // [x]
        sleepTime3 = growTime - hackTime - betweenRange * 2; // [x]

        numTotalThreads =
            numHackThreads +
            numGrowThreads +
            numWeakenThreadsAfterHack +
            numWeakenThreadsAfterGrow;
        numBatch = Math.floor(freeRam / (numTotalThreads * memScript));
        batchTime = weakenTime + betweenRange * 2;
        numBatchUpperLimit = Math.floor(batchTime / betweenBatch);
    }
}
