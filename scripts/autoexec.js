/** @param {NS} ns */
export async function main(ns) {
	var scriptFile = 'do_hack.js';
	var hackTarget = 'harakiri-sushi';

	// Array of all servers that don't need any ports opened
	// to gain root access. These have 16 GB of RAM
	var hosts0Port = [
		"sigma-cosmetics",
		"joesguns",
		"nectar-net",
		"hong-fang-tea",
		"harakiri-sushi"  // Money: 100M
	];

	// Array of all servers that only need 1 port opened
	// to gain root access. These have 32 GB of RAM
	var hosts1Port = [
		"neo-net",
		"zer0",
		"max-hardware",
		"iron-gym"  // Money: 500M
	];

	// Copy our scripts onto each server that requires 0 ports
	// to gain root access. Then use nuke() to gain admin access and
	// run the scripts.
	for (var i = 0; i < hosts0Port.length; ++i) {
		var host = hosts0Port[i];
		ns.scp(scriptFile, host);
		ns.nuke(host);
		ns.exec(scriptFile, host, 6, hackTarget);
	}

	// Wait until we acquire the "BruteSSH.exe" program
	while (!ns.fileExists("BruteSSH.exe")) {
		await ns.sleep(60000);
	}

	// Copy our scripts onto each server that requires 1 port
	// to gain root access. Then use brutessh() and nuke()
	// to gain admin access and run the scripts.
	for (var i = 0; i < hosts1Port.length; ++i) {
		var host = hosts1Port[i];
		ns.scp(scriptFile, host);
		ns.brutessh(host);
		ns.nuke(host);
		ns.exec(scriptFile, host, 12, hackTarget);
	}
}