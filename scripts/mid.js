/** @param {NS} ns */
export async function main(ns) {
	var scriptFile = 'do_hack.js';
	var hackTarget = ns.args[1];
	var numTools = ns.args[0];

	var startNode = 'home';
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

	let hackLevel = ns.getHackingLevel();
	let hosts = bfs(startNode);
	for (var i = 0; i < hosts.length; ++i) {
		var host = hosts[i];
		if (host == startNode) {
			continue;
		}
		if (hackLevel < ns.getServerRequiredHackingLevel(host)) {
			continue;
		}
		let numPorts = ns.getServerNumPortsRequired(host);
		if (numTools < numPorts) {
			continue;
		}
		if (!ns.hasRootAccess(host)) {
			ns.tprintf('Nuking host: %s\n', host);
			if (numTools > 0) {
				ns.brutessh(host);
			}
			if (numTools > 1) {
				ns.ftpcrack(host);
			}
			if (numTools > 2) {
				ns.httpworm(host);
			}
			if (numTools > 3) {
				ns.relaysmtp(host);
			}
			if (numTools > 4) {
				ns.sqlinject(host);
			}
			ns.nuke(host);
			//ns.installBackdoor();
		}
		let freeRam = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
		let numThreads = Math.floor(freeRam / 2.6);
		if (numThreads <= 0) {
			continue;
		}
		ns.scp(scriptFile, host);
		ns.exec(scriptFile, host, numThreads, hackTarget);
		ns.tprintf('Run %s on %s\n', scriptFile, host);
	}
}