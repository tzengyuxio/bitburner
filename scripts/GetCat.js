/** @param {NS} ns */
export async function main(ns) {
	await ns.wget("https://api.thecatapi.com/v1/images/search", "json.txt");
	var content = ns.read("js.txt");
	var url = JSON.parse(content)[0]["url"];
	ns.write(ns.args[0], `<html><body><img src=\"${url}\"</img></body></html>`, "w");
};