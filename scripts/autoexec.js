/** @param {NS} ns */
export async function main(ns) {
    var hackScript = "self-contained-hack.js"; // mem 2.4G
    var startNode = "home";
    var initRam = 8;
    var currentTarget = "";

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

    // Check if we have enough money to purchase a server
    var ableToPurchaseServer = function () {
        let cost =
            ns.getPurchasedServerCost(initRam) * ns.getPurchasedServerLimit();
        return ns.getServerMoneyAvailable("home") > cost;
    };

    var purchaseServer = function () {
        // Iterator we'll use for our loop
        let i = 0;
        while (i < ns.getPurchasedServerLimit()) {
            // If we have enough money, then purchase the server
            var hostname = ns.purchaseServer("pserv-" + i, initRam);
            ++i;
        }
    };

    var countNumTools = function () {
        let num = 0;
        var tools = [
            "BruteSSH.exe",
            "FTPCrack.exe",
            "HTTPWorm.exe",
            "SQLInject.exe",
            "relaySMTP.exe",
        ];
        for (let i = 0; i < tools.length; ++i) {
            if (ns.fileExists(tools[i])) {
                num += 1;
            }
        }
        return num;
    };

    var allHosts = bfs("home");
    var nukedHosts = [];
    for (let i = 0; i < allHosts.length; ++i) {
        let host = allHosts[i];
        if (ns.hasRootAccess(host)) {
            nukedHosts.push(host);
        }
    }

    var hackLevel = ns.getHackingLevel();
    var findAndNuke = function () {
        var numTools = countNumTools();
        var newNukes = [];
        for (let i = 0; i < allHosts.length; ++i) {
            var host = allHosts[i];
            if (host == startNode) {
                continue;
            }
            if (hackLevel < ns.getServerRequiredHackingLevel(host)) {
                continue;
            }
            let numPorts = ns.getServerNumPortsRequired(host);
            if (numPorts > numTools) {
                continue;
            }
            if (!ns.hasRootAccess(host)) {
                ns.tprintf("Nuking host: %s\n", host);
                if (ns.fileExists("BruteSSH.exe")) {
                    ns.brutessh(host);
                    ns.tprint("    Open port with BruteSSH.exe");
                }
                if (ns.fileExists("FTPCrack.exe")) {
                    ns.ftpcrack(host);
                    ns.tprint("    Open port with FTPCrack.exe");
                }
                if (ns.fileExists("HTTPWorm.exe")) {
                    ns.httpworm(host);
                    ns.tprint("    Open port with HTTPWorm.exe");
                }
                if (ns.fileExists("SQLInject.exe")) {
                    ns.sqlinject(host);
                    ns.tprint("    Open port with SQLInject.exe");
                }
                if (ns.fileExists("relaySMTP.exe")) {
                    ns.relaysmtp(host);
                    ns.tprint("    Open port with relaySMTP.exe");
                }
                ns.nuke(host);
                ns.tprint("    Nuked to has root!");
                nukedHosts.push(host);
                newNukes.push(host);
            }
        }
        return newNukes;
    };

    var compare = function (a, b) {
        let mma = ns.getServerMaxMoney(a);
        let mmb = ns.getServerMaxMoney(b);
        if (mma < mmb) {
            return -1;
        }
        if (mma > mmb) {
            return 1;
        }
        return 0;
    };

    var findTarget = function () {
        nukedHosts.sort(compare);
        nukedHosts.reverse();
        return nukedHosts.slice(0, 7);
    };

    // main loop
    while (true) {
        let to_scp = [];
        let to_exec = [];

        // find new server to nuke
        let newNukes = findAndNuke();
        if (newNukes.length > 0) {
            to_scp.push(...newNukes);
            to_exec.push(...newNukes);
        }

        // purchase or upgrade server to hack
        if (!ns.serverExists("pserv-0")) {
            if (ableToPurchaseServer()) {
                purchaseServer();
                ns.tprint("purchased servers.");
                to_scp.push(...ns.getPurchasedServers());
                to_exec.push(...ns.getPurchasedServers());
            }
        } else {
            // upgrade server
            // ns.tprint("upgraded servers.");
            // to_exec.push(...ns.getPurchasedServers());
        }

        // update target
        let isTargetChanged = false;
        let newTargets = findTarget();
        let newTarget = newTargets[0];
        if (newTarget != currentTarget) {
            ns.tprintf(
                "Target change from [%s] to [%s]\n",
                currentTarget,
                newTarget
            );
            currentTarget = newTarget;
            isTargetChanged = true;
        }

        // deploy and hack
        for (let i = 0; i < to_scp.length; i++) {
            let host = to_scp[i];
            ns.scp(hackScript, host);
        }
        for (let i = 0; i < to_exec.length; i++) {
            let host = to_exec[i];
            ns.exec(hackScript, host, numThread, currentTarget);
        }

        await ns.sleep(15 * 60 * 1000);
    }
}
