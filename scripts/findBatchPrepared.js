/** @param {NS} ns */
export async function main(ns) {
    var startNode = "home";
    let yesno = ns.args[0];
    if (yesno == "1" || yesno == "true" || yesno == "t") {
        yesno = true;
    } else {
        yesno = false;
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

    var allHosts = bfs(startNode);

    let isHostPrepared = function (host) {
        return (
            ns.getServerMoneyAvailable(host) >=
                ns.getServerMaxMoney(host) * 1 && // 0.98 &&
            ns.getServerSecurityLevel(host) <=
                ns.getServerMinSecurityLevel(host) + 0 // + 0.1
        );
    };

    var findBatchPrepared = function (yesno) {
        for (let i = 0; i < allHosts.length; ++i) {
            var host = allHosts[i];
            if (host == startNode || !ns.hasRootAccess(host)) {
                continue;
            }
            let isPrepared = isHostPrepared(host);
            if (isPrepared == yesno) {
                if (isPrepared) {
                    ns.tprintf("    host[%s]\n", host);
                } else {
                    ns.tprintf(
                        "    host[%20s] money: %12d/%12d (%6.2f%%), security: %02.3f(%02.3f)\n",
                        host,
                        ns.getServerMoneyAvailable(host),
                        ns.getServerMaxMoney(host),
                        (ns.getServerMoneyAvailable(host) /
                            ns.getServerMaxMoney(host)) *
                            100,
                        ns.getServerSecurityLevel(host),
                        ns.getServerMinSecurityLevel(host)
                    );
                }
            }
        }
    };

    if (yesno) {
        ns.tprintf("find prepared hosts:");
    } else {
        ns.tprintf("find not prepared hosts:");
    }

    findBatchPrepared(yesno); // prepared = true
}
