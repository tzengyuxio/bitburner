import * as libfmt from 'libfmt.js';
import * as libhwgw from 'libhwgw.js';

/** @param {NS} ns */
export async function main(ns) {
	ns.tprint(libfmt.ms2str(123456789));
	ns.tprint("abbrNum(12, 1)          => ", libfmt.abbrNum(12, 1));          // 12
	ns.tprint("abbrNum(0, 2)           => ", libfmt.abbrNum(0, 2));           // 0
	ns.tprint("abbrNum(1234, 0)        => ", libfmt.abbrNum(1234, 0));        // 1k
	ns.tprint("abbrNum(34567, 2)       => ", libfmt.abbrNum(34567, 2));       // 34.57k
	ns.tprint("abbrNum(918395, 1)      => ", libfmt.abbrNum(918395, 1));      // 918.4k
	ns.tprint("abbrNum(2134124, 2)     => ", libfmt.abbrNum(2134124, 2));     // 2.13m
	ns.tprint("abbrNum(47475782130, 2) => ", libfmt.abbrNum(47475782130, 2)); // 47.48b

	let allHosts = libhwgw.getAllHosts(ns);
	allHosts.forEach((x) => ns.tprint(x));

	let targets = libhwgw.topMaxMoneyServers(ns);
	targets.forEach((x) => ns.tprint(x, ": ", ns.getServerMaxMoney(x).toLocaleString()));
}