// library of string formatters

// Ready means the lowest security level and highest money available.
export function isReady(ns, host) {
	return ns.getServerMoneyAvailable(host) >= ns.getServerMaxMoney(host) &&
		ns.getServerSecurityLevel(host) <= ns.getServerMinSecurityLevel(host);
}

export function bfs(ns, startNode) {
	let visited = [startNode];
	let q = ns.scan(startNode);
	while (q.length > 0) {
		let visit = q.shift();
		if (visited.includes(visit) || visit.indexOf("pserv") == 0) {
			continue;
		}

		visited.push(visit);
		let neighbours = ns.scan(visit);

		for (let i = 0; i < neighbours.length; ++i) {
			q.push(neighbours[i]);
		}
	}
	return visited;
}

export function getAllHosts(ns) {
	let nodes = bfs(ns, "home");
	let pservs = ns.getPurchasedServers();
	return nodes.concat(pservs);
}

export function topMaxMoneyServers(ns) {
	let nodes = bfs(ns, "home");
    let compare = function (a, b) {
        let mma = ns.hasRootAccess(a) ? ns.getServerMaxMoney(a) : 0;
        let mmb = ns.hasRootAccess(b) ? ns.getServerMaxMoney(b) : 0;
        if (mma < mmb) {
            return -1;
        }
        if (mma > mmb) {
            return 1;
        }
        return 0;
    };

	return nodes.sort(compare).reverse();
}

export function sleepTimes(delay, growTime, hackTime, weakenTime) {
	return [
		delay * 2,                           // W1 -> W2
		weakenTime - growTime - delay,       // W2 -> Grow
		growTime - hackTime - delay - delay, // Grow -> Hack
		hackTime + delay * 3                 // Hack to Cycle End
	];
}

export function startTimes(delay, growTime, hackTime, weakenTime) {
	return [
		0,                             // W1
		delay * 2,                     // W2
		weakenTime - growTime + delay, // Grow
		weakenTime - hackTime - delay  // Hack
	];
}

export function calcNeedThreadsForGrow(ns, host) {
	let maxMoney = ns.getServerMaxMoney(host);
	let currentMoney = Math.max(ns.getServerMoneyAvailable(host), maxMoney * 0.0001);
	let ratio = maxMoney / currentMoney;
	return Math.ceil(ns.growthAnalyze(host, ratio));
}

export function calcNeedThreadsForHack(ns, host) {
}

export function calcNeedThreadsForWeaken(ns, host) {
	return Math.ceil((ns.getServerSecurityLevel(host) - ns.getServerMinSecurityLevel(host)) / 0.05);
}

export function getServerFreeRam(ns, host, memHomeReserved) {
	let freeRam = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
	if (host == "home") {
		return Math.max(freeRam - memHomeReserved, 0);
	}
	return freeRam;
}

export function findCopyAndLaunch(ns, hosts, needThreads, script, target, tagPrefix) {
	let leftThreads = needThreads;
	let scriptRam = ns.getScriptRam(script)
	for (let i = 0; i < hosts.length && leftThreads > 0; ++i) {
		let host = hosts[i];

		// find available ram for those threads
		let freeRam = getServerFreeRam(ns, host, 256);
		let numThreads = Math.min(Math.floor(freeRam / scriptRam), leftThreads);
		if (numThreads < 1) {
			continue;
		}

		// copy the weaken script to the server(s) with RAM
		ns.scp(script, host);

		// launch the weaken script(s)
		let tag = ns.sprintf("%s: run '%s' on [%s] to [%s]", tagPrefix, script, host, target);
		let pid = ns.exec(script, host, numThreads, target, tag);
		if (pid == 0) {
			ns.tprintf("    [ERROR] FAILED when %s in %d threads\n", tag, numThreads);
			continue;
		} else {
			ns.tprintf("    [INFO]  %s in %d threads\n", tag, numThreads);
		}

		leftThreads -= numThreads;
	}
	return leftThreads;
}