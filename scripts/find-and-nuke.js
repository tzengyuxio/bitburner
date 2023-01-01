/** @param {NS} ns */
export async function main(ns) {
    var startNode = "home";

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

    var allHosts = bfs(startNode);
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
                ns.tprintf("Nuking host: [%s]\n", host);
                if (ns.fileExists("BruteSSH.exe")) {
                    ns.brutessh(host);
                    ns.tprintf("    Open port with BruteSSH.exe");
                }
                if (ns.fileExists("FTPCrack.exe")) {
                    ns.ftpcrack(host);
                    ns.tprintf("    Open port with FTPCrack.exe");
                }
                if (ns.fileExists("HTTPWorm.exe")) {
                    ns.httpworm(host);
                    ns.tprintf("    Open port with HTTPWorm.exe");
                }
                if (ns.fileExists("SQLInject.exe")) {
                    ns.sqlinject(host);
                    ns.tprintf("    Open port with SQLInject.exe");
                }
                if (ns.fileExists("relaySMTP.exe")) {
                    ns.relaysmtp(host);
                    ns.tprintf("    Open port with relaySMTP.exe");
                }
                ns.nuke(host);
                ns.tprintf("    Nuked to has root!");
                nukedHosts.push(host);
                newNukes.push(host);
            }
        }
        return newNukes;
    };

    findAndNuke();
}