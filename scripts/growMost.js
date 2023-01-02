/** @param {NS} ns */
export async function main(ns) {
    let target = ns.args[0];
    let memDoScript = 1.75; // 1.70G(hack), 1.75G(weaken, grow)
    let memHomeReserved = 32; // 32G
    let player = ns.getPlayer();
    let cpuCores = 1;

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

    var bfs = function (startNode) {
        let visited = [startNode];
        let q = ns.scan(startNode);
        while (q.length > 0) {
            let visit = q.shift();
            if (visited.includes(visit) || visit.indexOf("pserv") == 0) {
                continue;
            }

            // ns.tprint("Visiting: ", visit);
            visited.push(visit);
            let neighbours = ns.scan(visit);

            for (var i = 0; i < neighbours.length; ++i) {
                q.push(neighbours[i]);
            }
        }
        return visited;
    };
    let nodes = bfs("home");
    let pservs = ns.getPurchasedServers();
    let allHosts = nodes.concat(pservs);

    let calcNeedThreadsForWeaken = function (host) {
        return Math.ceil(
            (ns.getServerSecurityLevel(host) -
                ns.getServerMinSecurityLevel(host)) /
                0.05
        );
    };

    let calcNeedThreadsForGrow = function (host) {
        // let server = ns.getServer(host);
        let maxMoney = ns.getServerMaxMoney(host);
        let currentMoney = ns.getServerMoneyAvailable(host);
        if (currentMoney == 0) {
            currentMoney = 25;
        }
        let moneyThreshold = maxMoney; // * 0.98;
        let ratio = moneyThreshold / currentMoney;
        if (ratio <= 1) {
            return 0;
        }
        let numThreads = Math.ceil(ns.growthAnalyze(host, ratio, cpuCores));
        return numThreads;
    };

    let freeRam = function (host) {
        if (host != "home") {
            return ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
        }
        return 0;
        // return Math.max(
        //     ns.getServerMaxRam(host) -
        //         ns.getServerUsedRam(host) -
        //         memHomeReserved,
        //     0
        // );
    };

    let findCopyAndLaunch = function (allHosts, needThreads, script, target, action) {
        let leftThreads = needThreads;
        for (let i = 0; i < allHosts.length && leftThreads > 0; ++i) {
            let host = allHosts[i];

            // find available ram for those threads
            let ram = freeRam(host);
            let numThreads = Math.floor(ram / memDoScript);
            numThreads = Math.min(numThreads, leftThreads);
            if (numThreads < 1) {
                continue;
            }

            // copy the weaken script to the server(s) with RAM
            ns.scp(script, host);

            // launch the weaken script(s)
            let tag = ns.sprintf("%s_%s_%s_%d", action, host, target, i);
            let pid = ns.exec(script, host, numThreads, target, tag);
            if (pid == 0) {
                ns.tprintf(
                    "    [ERROR] exec '%s' at host[%s] in %d threads to grow %s\n",
                    script,
                    host,
                    numThreads,
                    target
                );
                continue;
            } else {
                ns.tprintf(
                    "    [INFO]  spawn %d threads at host[%s]\n",
                    numThreads,
                    host
                );
            }

            leftThreads -= numThreads;
        }
        return leftThreads;
    };

    // determine how many threads we need to lower security to the minimum
    ns.tprintf("\n");
    ns.tprintf("Target host: %s", target);
    ns.tprintf(
        "Current money available: %d\n",
        ns.getServerMoneyAvailable(target)
    );
    ns.tprintf("Max money: %d\n", ns.getServerMaxMoney(target));

    let needWeakenThreadsBefore = calcNeedThreadsForWeaken(target);
    let needGrowThreads = calcNeedThreadsForGrow(target);
    let securityIncreased = needGrowThreads * 0.004;
    let needWeakenThreadsAfter = Math.ceil(securityIncreased / 0.05);
    ns.tprintf(
        "Need threads: %d(weaken) -> %d(grow) -> %d(weaken)\n",
        needWeakenThreadsBefore,
        needGrowThreads,
        needWeakenThreadsAfter
    );
    let betweenRange = 250; // ms
    let weakenTime = ns.getWeakenTime(target);
    let growTime = ns.getGrowTime(target);
    let sleepTime1 = betweenRange * 2;
    let sleepTime2 = weakenTime - betweenRange - growTime;
    let sleepTime3 = growTime + betweenRange;
    ns.tprintf("----------------------------------------");
    ns.tprintf(
        "| %s | %s | %s |\n",
        ms2str(sleepTime1),
        ms2str(sleepTime2),
        ms2str(sleepTime3)
    );
    ns.tprintf("Total time: %s\n", ms2str(weakenTime + betweenRange * 2));

    let leftWeakenThreadsBefore = findCopyAndLaunch(
        allHosts,
        needWeakenThreadsBefore,
        "doWeaken.js",
        target,
        'WB'
    );
    await ns.sleep(sleepTime1);
    let leftGrowThreads = findCopyAndLaunch(
        allHosts,
        needGrowThreads,
        "doGrow.js",
        target,
        'G'
    );
    await ns.sleep(sleepTime2);
    let leftWeakenThreadsAfter = findCopyAndLaunch(
        allHosts,
        needWeakenThreadsAfter,
        "doWeaken.js",
        target,
        'WA'
    );
    await ns.sleep(sleepTime3);
    ns.tprintf(
        "Left threads: %d(weaken), %d(grow), %d(weaken) on target host[%s]\n",
        leftWeakenThreadsBefore,
        leftGrowThreads,
        leftWeakenThreadsAfter,
        target
    );
}
