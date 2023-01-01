/** @param {NS} ns */
export async function main(ns) {
    let target = ns.args[0];
    let moneyThreshold = ns.getServerMaxMoney(target) * 0.9;
    let securityThreshold = ns.getServerMinSecurityLevel(target) + 0.1;
    let memDoScript = 1.7; // 1.7G
    let memHomeReserved = 32; // 32G
    let delay = 2000; // milliseconds
    let homeServer = ns.getServer("home");
    let numCore = homeServer.cpuCores;
    // let player = ns.getPlayer();

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
    let allHosts = bfs("home").push(...ns.getPurchasedServers());

    let calcNeedThreadsForWeaken = function (host) {
        return Math.floor(
            (ns.getServerSecurityLevel(host) -
                ns.getServerMinSecurityLevel(host)) /
                0.05
        );
    };

    let calcNeedThreadsForGrow = function (host) {
        // let server = ns.getServer(host);
        let ratio = moneyThreshold / ns.getServerMoneyAvailable(host);
        let numThreads = Math.floor(ns.growthAnalyze(host, ratio));
        // let increasedSecurity = ns.growthAnalyzeSecurity(numThreads, host);
        return numThreads;
    };

    let calcNeedThreadsForHack = function (host) {};

    let freeRam = function (host) {
        if (host == "home") {
            return ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
        }
        return Math.max(
            ns.getServerMaxRam(host) -
                ns.getServerUsedRam(host) -
                memHomeReserved,
            0
        );
    };

    let findCopyAndLaunch = function (allHosts, needThreads, script, target) {
        for (let i = 0; i < allHosts.length; ++i) {
            let host = allHosts[i];

            // find available ram for those threads
            let ram = freeRam(host);
            let numThreads = Math.floor(ram / memDoScript);
            if (numThreads < 1) {
                continue;
            }
            numThreads = Math.min(numThreads, needThreads);

            // copy the weaken script to the server(s) with RAM
            ns.scp(script, host);

            // launch the weaken script(s)
            let pid = ns.exec(script, host, numThreads, target);
            if (pid == 0) {
                // TODO(yuxioz): log error
            }

            needThreads -= numThreads;
            if (needThreads < 1) {
                break;
            }
        }
    };

    while (true) {
        if (ns.getServerSecurityLevel(target) > securityThreshold) {
            // determine how many threads we need to lower security to the minimum
            let needThreads = calcNeedThreadsForWeaken(target);
            findCopyAndLaunch(allHosts, needThreads, "doWeaken.js", target);
            // sleep until weaken is finished
        } else if (ns.getServerMoneyAvailable(target) < moneyThreshold) {
            if (!ns.fileExists("Formulas.exe")) {
                break;
            }
            let needThreads = calcNeedThreadsForGrow(target);
            findCopyAndLaunch(allHosts, needThreads, "doGrow.js", target);
        } else {
            if (!ns.fileExists("Formulas.exe")) {
                break;
            }
            let needThreads = calcNeedThreadsForHack(target);
            findCopyAndLaunch(allHosts, needThreads, "doHack.js", target);
        }
    }
}
