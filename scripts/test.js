/** @param {NS} ns */
export async function main(ns) {
	let a = ns.getPurchasedServerMaxRam();
	//let b = ns.getPurchasedServerUpgradeCost();
	let b = ns.getPurchasedServerLimit();
	ns.tprint('maxRam: ', a, 'upgrade: ', b)
	for (var i = 5; i <= 20; ++i) {
		let ramSize = 2 ** i;
		let cost = ns.getPurchasedServerUpgradeCost('pserv-0', ramSize);
		ns.tprintf('upgrade to %d G, need $%d, total(x24): %d', ramSize, cost, cost*24);
	}
}