/** @param {NS} ns */
export async function main(ns) {
    let target = ns.args[0];
    let memDoScript = 1.7; // 1.7G
    let memHomeReserved = 512; // 32G
    let player = ns.getPlayer();

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

    let findCopyAndLaunch = function (allHosts, needThreads, script, target) {
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
            let tag = ns.sprintf("%s_%s_%d", host, target, i);
            let pid = ns.exec(script, host, numThreads, target, tag);
            if (pid == 0) {
                ns.tprintf(
                    "    [ERROR] exec '%s' at host[%s] in %d threads to weaken %s\n",
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
    ns.tprintf("Target host: %s", target);
    ns.tprintf(
        "Current security level: %d\n",
        ns.getServerSecurityLevel(target)
    );
    ns.tprintf(
        "Min security level: %d\n",
        ns.getServerMinSecurityLevel(target)
    );
    let needThreads = calcNeedThreadsForWeaken(target);
    ns.tprintf("Need threads: %d\n", needThreads);
    let leftThreads = findCopyAndLaunch(
        allHosts,
        needThreads,
        "doWeaken.js",
        target
    );
    ns.tprintf("Left threads: %d\n", leftThreads);
    // sleep until weaken is finished
    let server = ns.getServer(target);
    let weakenTime = ns.formulas.hacking.weakenTime(server, player);

    ns.tprintf("Time cost: %s\n", ms2str(weakenTime));
}
