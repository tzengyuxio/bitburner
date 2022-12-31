/** @param {NS} ns */
export async function main(ns) {
	let target = 'nova-med';
	let hosts = ns.getPurchasedServers();
	let ramSize = 1048576;
	let numThreads = Math.floor(ramSize/2.6);
	for (var i = 0; i < hosts.length; ++i) {
		let host = hosts[i];
		ns.upgradePurchasedServer(host, ramSize);
		ns.killall(host);
		ns.exec("do_hack.js", host, numThreads, target);
	}
}