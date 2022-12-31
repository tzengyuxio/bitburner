/** @param {NS} ns */
export async function main(ns) {
	// How much RAM each purchased server will have. In this case, it'll be 8GB.
	var ram = 8;
	var numThreads = Math.floor(ram / 2.6);
	var target = "phantasy";  // ns.args[0];

	// Iterator we'll use for our loop
	var i = 0;

	// Continuously try to purchase server until we've reached the maximum
	// amount of servers
	while (i < ns.getPurchasedServerLimit()) {
		// Check if we have enough money to purchase a server
		if (ns.getServerMoneyAvailable("home") > ns.getPurchasedServerCost(ram)) {
			// If we have enough money, then:
			//  1. Purchase the server
			//  2. Copy our hacking script onto the newly-purchased server
			//  3. Run our hacking script on the newly-purchased server with 3 threads
			var hostname = ns.purchaseServer("pserv-" + i, ram);
			ns.scp("do_hack.js", hostname);
			ns.exec("do_hack.js", hostname, numThreads, target);
			++i;
		}
	}
}