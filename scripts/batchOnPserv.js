/** @param {NS} ns */
export async function main(ns) {
    let pservs = ns.getPurchasedServers();
    let startNode = "home";

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

    let nodes = bfs(startNode);
    let targets = [];
    for (let i = 0; i < nodes.length; ++i) {
        let node = nodes[i];
        if (ns.hasRootAccess(node) && ns.getServerMaxMoney(node) > 0) {
            targets.push(node);
        }
    }
    targets.sort(compare);
    targets.reverse();

    for (let i = 0; i < pservs.length && i < nodes.length; ++i) {
        let host = pservs[i];
        let target = targets[i];
        ns.scp("batchCycle.js", host);
        ns.scp("hwgw.js", host);
        ns.scp("doWeaken.js", host);
        ns.scp("doGrow.js", host);
        ns.scp("doHack.js", host);
        ns.exec("batchCycle.js", host, 1, host, target);
    }
}
