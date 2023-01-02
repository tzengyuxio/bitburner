/** @param {NS} ns */
export async function main(ns) {
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

    let isNeedGrow = function (host) {
        return ns.getServerMoneyAvailable(host) < ns.getServerMaxMoney(host);
        // return (
        //     ns.getServerMoneyAvailable(host) / ns.getServerMaxMoney(host) < 0.98
        // );
    };

    let isNeedGrowAndWeaken = function (host) {
        return (
            ns.getServerMoneyAvailable(host) < ns.getServerMaxMoney(host) ||
            ns.getServerSecurityLevel(host) > ns.getServerMinSecurityLevel(host)
        );
    };

    for (let i = 0; i < nodes.length; ++i) {
        let target = nodes[i];
        if (!ns.hasRootAccess(target)) {
            continue;
        }
        if (!isNeedGrowAndWeaken(target)) {
            continue;
        }
        ns.exec("growMost.js", "home", 1, target);
    }
}
