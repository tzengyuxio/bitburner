/** @param {NS} ns */
export async function main(ns) {
	var hostname = 'zer0';
	ns.printf('max money: %s', ns.getServerMaxMoney(hostname));
	ns.printf('min secu : %s', ns.getServerMinSecurityLevel(hostname));
	var dfs = function (visit, result) {
		if (result.includes(visit) || visit.indexOf('pserv') == 0) {
			return result;
		}

		ns.tprint("Visiting: ", visit);
		result.push(visit);
		let neighbours = ns.scan(visit);

		for (var i = 0; i < neighbours.length; ++i) {
			result = dfs(neighbours[i], result);
		}
		return result;

	}

	var bfs = function(startNode) {
		let visited = [startNode];
		let q = ns.scan(startNode);
		while(q.length > 0 ){
			let visit = q.shift();
			if (visited.includes(visit) || visit.indexOf('pserv') == 0) {
				continue;
			}

			ns.tprint("Visiting: ", visit);
			visited.push(visit);
			let neighbours = ns.scan(visit);

			for (var i = 0; i < neighbours.length; ++i) {
				q.push(neighbours[i]);
			}
		}
		return visited;
	}

	let result = dfs('home', []);
	ns.tprint('DFS numHosts: ', result.length);

	let result2 = bfs('home');
	ns.tprint('BFS numHosts: ', result2.length);

	ns.tprint('server ram: ', ns.getServerUsedRam('home'));
}