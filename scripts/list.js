/** @param {NS} ns */
export async function main(ns) {
	var hosts = ns.scan();

	var hostInfos = {};
	for (var i = 0; i < hosts.length; ++i) {
		var hostName = hosts[i];
		if (ns.getServerMaxRam(hostName) == 0 || ns.getServerMaxMoney(hostName) == 0) {
			continue;
		}
		var info = {};
		info['root'] = ns.hasRootAccess(hostName);
		info['maxMoney'] = ns.getServerMaxMoney(hostName);
		info['minSecurity'] = ns.getServerMinSecurityLevel(hostName);
		info['numPorts'] = ns.getServerNumPortsRequired(hostName);
		info['hackingLevel'] = ns.getServerRequiredHackingLevel(hostName);
		info['maxRam'] = ns.getServerMaxRam(hostName);
		hostInfos[hostName] = info;
	}

	for (const hostName in hostInfos) {
		let info = hostInfos[hostName];
		/*
		ns.tprint('## ', hostName, ' ========');
		ns.tprint('  root:', info['root']);
		ns.tprint('  maxMoney:', info['maxMoney']);
		ns.tprint('  minSecurity:', info['minSecurity']);
		ns.tprint('  numPorts:', info['numPorts']);
		ns.tprint('  hackingLevel:', info['hackingLevel']);
		ns.tprint('  maxRam:', info['maxRam']);
		ns.tprint('\n\n');
		*/
	}

	// find 0 port max money
	let maxMoney0Port = 0;
	let maxMoney0PortHost = '';
	for (const hostName in hostInfos) {
		let info = hostInfos[hostName];
		if (info['numPorts'] != 0) {
			continue;
		}
		if (info['maxMoney'] > maxMoney0Port) {
			maxMoney0Port = info['maxMoney'];
			maxMoney0PortHost = hostName;
		}
	}
	ns.tprint('## 0 Port MaxMoney ########');
	ns.tprintf('  %s: %d\n', maxMoney0PortHost, maxMoney0Port);
	ns.tprint('\n\n');

	// find 1 port max money
	let maxMoney1Port = 0;
	let maxMoney1PortHost = '';
	for (const hostName in hostInfos) {
		let info = hostInfos[hostName];
		if (info['numPorts'] != 1) {
			continue;
		}
		if (info['maxMoney'] > maxMoney1Port) {
			maxMoney1Port = info['maxMoney'];
			maxMoney1PortHost = hostName;
		}
	}
	ns.tprint('## 1 Port MaxMoney ########');
	ns.tprintf('  %s: %d\n', maxMoney1PortHost, maxMoney1Port);
	ns.tprint('\n\n');

	// find 2 port max money
	let maxMoney2Port = 0;
	let maxMoney2PortHost = '';
	for (const hostName in hostInfos) {
		let info = hostInfos[hostName];
		if (info['numPorts'] != 2) {
			continue;
		}
		if (info['maxMoney'] > maxMoney2Port) {
			maxMoney2Port = info['maxMoney'];
			maxMoney2PortHost = hostName;
		}
	}
	ns.tprint('## 2 Port MaxMoney ########');
	ns.tprintf('  %s: %d\n', maxMoney2PortHost, maxMoney2Port);
	ns.tprint('\n\n');

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
	}

	var bfs = function (startNode) {
		let visited = [startNode];
		let q = ns.scan(startNode);
		while (q.length > 0) {
			let visit = q.shift();
			if (visited.includes(visit) || visit.indexOf('pserv') == 0) {
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
	}
	let visited = bfs('home');
	let maxMoney = 0;
	let maxMoneyHost = '';
	let secondMoney = 0;
	let secondMoneyHost = '';
	for (let i = 0; i < visited.length; ++i) {
		let host = visited[i];
		if (!ns.hasRootAccess(host)) {
			continue;
		}
		let theMaxMoney = ns.getServerMaxMoney(host);
		if (theMaxMoney > maxMoney) {
			secondMoney = maxMoney;
			secondMoneyHost = maxMoneyHost;
			maxMoney = theMaxMoney;
			maxMoneyHost = host;
		}
	}
	ns.tprint('## Current MaxMoney ########');
	ns.tprintf('First:   %d @ %s\n', maxMoney, maxMoneyHost);
	ns.tprintf('Second:  %d @ %s\n', secondMoney, secondMoneyHost);
	ns.tprint('\n\n');

	let rootedVisited = [];
	for (let i = 0; i < visited.length; ++i) {
		let host = visited[i];
		if (!ns.hasRootAccess(host)) {
			continue;
		}
		rootedVisited.push(host);
	}
	rootedVisited.sort(compare);
	rootedVisited.reverse();
	for (let i = 0; i < rootedVisited.length; ++i) {
		let host = rootedVisited[i];
		let maxMoney = ns.getServerMaxMoney(host);
		let server = ns.getServer(host);
		let player = ns.getPlayer();
		//let timeToHack = ns.formulas.hacking.hackTime(server, player);
		//let timeToWeaken = ns.formulas.hacking.weakenTime(server, player);
		//let timeToGrow = ns.formulas.hacking.growTime(server, player);
		let timeToHack = 999;
		let timeToWeaken = 999;
		let timeToGrow = 999;
		let totalTime = timeToHack + timeToWeaken + timeToGrow;
		ns.tprintf("[%02d] %-20s: $%-15d %d(%d , %d, %d)\n", i, host, maxMoney, totalTime, timeToHack, timeToWeaken, timeToGrow);
	}

	// show upgrade money
	let pservHost = 'pserv-24';
	if (ns.serverExists(pservHost)) {
		let currMaxRam = ns.getServerMaxRam(pservHost);
		let currCount = ns.getPurchasedServers().length;
		ns.tprintf('\n## Upgrade purchased server ram ########\n\n');
		ns.tprintf('  current MaxRam: %d\n\n', currMaxRam);
		for (let i = 3; i <= 20; i++) {
			let maxRam = Math.pow(2, i);
			if (currMaxRam >= maxRam) {
				continue;
			}
			let cost = ns.getPurchasedServerUpgradeCost(pservHost, maxRam);
			ns.tprintf("RAM SIZE: %-10d, SINGLE: $%-d, TOTAL: $%-d\n", maxRam, cost, cost * currCount);
		}
	} else {
		ns.tprintf('pserv-0 not exist.');
	}
	let cost = ns.getPurchasedServerCost(8) * ns.getPurchasedServerLimit();
	ns.tprint('basic server cost:', cost);

	ns.tprint(ns.fileExists('BruteSSH.exe'));
	ns.tprint(ns.fileExists('../BruteSSH.exe'));
}