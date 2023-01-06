import * as libfmt from 'libfmt.js';
import * as libhwgw from 'libhwgw.js';

// https://stackoverflow.com/questions/31973278/iterate-an-array-as-a-pair-current-next-in-javascript
function pairwise(arr, func) {
    for (var i = 0; i < arr.length - 1; i++) {
        func(arr[i], arr[i + 1])
    }
}

/** @param {NS} ns */
export async function main(ns) {
    let host = ns.args[0];
    let target = ns.args[1];
    let stealRatio = 0.9; // 每次偷的比例, 0.1 = 10%
    let delay = 250; // ms
    let batchDelay = delay * 5; // ms, at least 4x of delay
    let memScript = 1.75; // 1.70GB
    let maxBatchCountInPipeline = 255;

    let compareJobs = function (a, b) {
        let saa = a["startAt"]; // StartAt of A
        let sab = b["startAt"]; // StartAt of B
        if (saa < sab) {
            return -1;
        }
        if (saa > sab) {
            return 1;
        }
        return 0;
    };

    let hackAmount = ns.getServerMaxMoney(target) * stealRatio;
    let numHackThreads = Math.ceil(ns.hackAnalyzeThreads(target, hackAmount));
    let hackIncreasedSecurity = ns.hackAnalyzeSecurity(numHackThreads, target);

    let growthAmount = 1 / (1 - stealRatio);
    let numGrowThreads = Math.ceil(ns.growthAnalyze(target, growthAmount));
    let growIncreasedSecurity = numGrowThreads * 0.004;

    let numWeakenThreadsAfterHack = Math.ceil(hackIncreasedSecurity / 0.05);
    let numWeakenThreadsAfterGrow = Math.ceil(growIncreasedSecurity / 0.05);
    let numTotalThreads = numHackThreads + numGrowThreads + numWeakenThreadsAfterHack + numWeakenThreadsAfterGrow;

    // ns.tprintf("Target host: %s (from %s)", target, host);
    // ns.tprintf("    Treads: %d (HACK: %d, WKN1: %d, GROW: %d, WKN2: %d)", numTotalThreads, numHackThreads, numWeakenThreadsAfterHack, numGrowThreads, numWeakenThreadsAfterGrow);

    let sleepTimes = libhwgw.sleepTimes(delay, ns.getGrowTime(target), ns.getHackTime(target), ns.getWeakenTime(target));
    let startTimes = libhwgw.startTimes(delay, ns.getGrowTime(target), ns.getHackTime(target), ns.getWeakenTime(target));
    let totalTime = sleepTimes.reduce((a, b) => a + b, 0);
    // ns.tprintf("    Total time: %s (%s -> %s -> %s -> %s)", libfmt.ms2str(totalTime),
    //     libfmt.ms2str(sleepTimes[0]), libfmt.ms2str(sleepTimes[1]), libfmt.ms2str(sleepTimes[2]), libfmt.ms2str(sleepTimes[3]));

    // const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

    // batch cycle
    let freeRam = libhwgw.getServerFreeRam(ns, host);
    let numBatch = Math.floor(freeRam / (numTotalThreads * memScript));
    if (numBatch < 1) { return; }

    let pipelineId = 0;
    while (true) {
        // Calculate threads
        numHackThreads = Math.ceil(ns.hackAnalyzeThreads(target, hackAmount));
        hackIncreasedSecurity = ns.hackAnalyzeSecurity(numHackThreads, target);
        numGrowThreads = Math.ceil(ns.growthAnalyze(target, growthAmount));
        growIncreasedSecurity = numGrowThreads * 0.004;
        numWeakenThreadsAfterHack = Math.ceil(hackIncreasedSecurity / 0.05);
        numWeakenThreadsAfterGrow = Math.ceil(growIncreasedSecurity / 0.05);
        numTotalThreads = numHackThreads + numGrowThreads + numWeakenThreadsAfterHack + numWeakenThreadsAfterGrow;

        // Calculate times
        sleepTimes = libhwgw.sleepTimes(delay, ns.getGrowTime(target), ns.getHackTime(target), ns.getWeakenTime(target));
        startTimes = libhwgw.startTimes(delay, ns.getGrowTime(target), ns.getHackTime(target), ns.getWeakenTime(target));
        totalTime = sleepTimes.reduce((a, b) => a + b, 0);

        // Calculate how many batches in a Batch-Cycle(pipeline)
        numBatch = Math.floor(freeRam / (numTotalThreads * memScript));
        let actualNumBatch = Math.min(numBatch, Math.floor(totalTime / batchDelay) - 1, maxBatchCountInPipeline);
        let batchSleepTime = totalTime - (actualNumBatch * batchDelay) + delay;

        ns.tprintf("Host[%8s] targeting on %18s: with %4d threads of %4d batches in %s per batch", host, target, numTotalThreads, actualNumBatch, libfmt.ms2str(totalTime));
        // ns.tprintf("Host[%8s] targeting on %18s: with %4d threads in %s ms", host, target, numTotalThreads, totalTime.toLocaleString());

        // Add all jobs with startTime and sleepTime
        let jobs = [];
        for (let i = 0; i < actualNumBatch; ++i) {
            let offset = batchDelay * i;
            let tagSuffix = sprintf("P%03dB%03d", pipelineId, i)
            jobs.push({
                "host": host, "target": target, "script": "doWeaken.js", "numThreads": numWeakenThreadsAfterHack, "tag": "WKN1: " + tagSuffix,
                "startAt": offset + startTimes[0], "thenSleep": sleepTimes[0]
            })
            jobs.push({
                "host": host, "target": target, "script": "doWeaken.js", "numThreads": numWeakenThreadsAfterGrow, "tag": "WKN2: " + tagSuffix,
                "startAt": offset + startTimes[1], "thenSleep": sleepTimes[1]
            })
            jobs.push({
                "host": host, "target": target, "script": "doGrow.js", "numThreads": numGrowThreads, "tag": "GROW: " + tagSuffix,
                "startAt": offset + startTimes[2], "thenSleep": sleepTimes[2]
            })
            jobs.push({
                "host": host, "target": target, "script": "doHack.js", "numThreads": numHackThreads, "tag": "HACK: " + tagSuffix,
                "startAt": offset + startTimes[3], "thenSleep": sleepTimes[3]
            })
        }

        // Sort jobs with startAt and re-arrange thenSleep
        jobs.sort(compareJobs);
        pairwise(jobs, function (current, next) {
            current["thenSleep"] = next["startAt"] - current["startAt"];
        });
        jobs[jobs.length - 1]["thenSleep"] = delay;

        // 依次執行排定的 batch
        for (let i = 0; i < jobs.length; ++i) {
            let job = jobs[i];
            let numThreads = Math.max(job["numThreads"], 1);
            ns.exec(job["script"], job["host"], numThreads, job["target"], job["tag"]);
            await ns.sleep(job["thenSleep"]);
        }

        // Sleep to next Batch-Cycle(pipeline)
        await ns.sleep(batchSleepTime);
        pipelineId++;

        // Prepare for next Batch-Cycle(pipeline)
        ns.exec("prepare-one.js", host, 1, target);
        sleepTimes = libhwgw.sleepTimes(delay, ns.getGrowTime(target), ns.getHackTime(target), ns.getWeakenTime(target));
        totalTime = sleepTimes.reduce((a, b) => a + b, 0);
        await ns.sleep(totalTime + delay);
    }
}