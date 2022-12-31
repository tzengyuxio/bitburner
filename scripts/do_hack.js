/** @param {NS} ns */
export async function main(ns) {
	var hostname = ns.args[0];	
	var moneyThreshold = ns.getServerMaxMoney(hostname) * 0.75;
	var securityThreshold = ns.getServerMinSecurityLevel(hostname) + 5;

	if (ns.fileExists("BruteSSH.exe", "home")) {
		ns.brutessh(hostname);
	}
	ns.nuke(hostname);

	while(true) {
		if (ns.getServerSecurityLevel(hostname) > securityThreshold) {
			await ns.weaken(hostname)
		} else if (ns.getServerMoneyAvailable(hostname) < moneyThreshold) {
			await ns.grow(hostname);
		} else {
			await ns.hack(hostname);
		}
	}
}