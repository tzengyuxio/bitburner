/** @param {NS} ns */
export async function main(ns) {
	let target = 'alpha-ent';
	let hosts = ns.getPurchasedServers();
	//let ramSize = 4096;
	for (var i = 0; i < hosts.length; ++i) {
		let host = hosts[i];
		let ramSize = ns.getServerMaxRam(host);
		let numThreads = Math.floor((ramSize)/2.6);
		ns.killall(host);
		ns.exec("do_hack.js", host, numThreads, target);
	}
}