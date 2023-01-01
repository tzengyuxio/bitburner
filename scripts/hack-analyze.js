/** @param {NS} ns */
export async function main(ns) {
    // an utility to grab some info for hacking analyze
    let target = ns.args[0];

    function ms2str(milliseconds) {
        var temp = Math.floor(milliseconds / 1000);
        var decimal_part = Math.round(milliseconds - temp * 1000);
        var levels = [
            [Math.floor(temp / 86400), "days"],
            [Math.floor((temp % 86400) / 3600), "hours"],
            [Math.floor((temp % 3600) / 60), "minutes"],
            [(temp % 60) + decimal_part / 1000, "seconds"],
        ];
        var returntext = "";

        for (var i = 0, max = levels.length; i < max; i++) {
            if (levels[i][0] === 0) continue;
            returntext +=
                " " +
                levels[i][0] +
                " " +
                (levels[i][0] === 1
                    ? levels[i][1].substr(0, levels[i][1].length - 1)
                    : levels[i][1]);
        }
        return returntext.trim();
    }

    let server = ns.getServer(target);
    let player = ns.getPlayer();
    ns.tprint("host: ", target);
    ns.tprintf(
        "security level: %f (min: %f)\n",
        ns.getServerSecurityLevel(target),
        ns.getServerMinSecurityLevel(target)
    );
    ns.tprintf(
        "money: %f (max: %f)\n",
        ns.getServerMoneyAvailable(target),
        ns.getServerMaxMoney(target)
    );
    ns.tprint(
        "weakenTime: ",
        ms2str(ns.formulas.hacking.weakenTime(server, player))
    );
    ns.tprint(
        "growTime: ",
        ms2str(ns.formulas.hacking.growTime(server, player))
    );
    ns.tprint(
        "hackTime: ",
        ms2str(ns.formulas.hacking.hackTime(server, player))
    );

    // thread & core on weaken 分析
    /*
    for (let i = 1; i <= 4; ++i) {
        for (let j = 1; j <= 100; ++j) {
            ns.tprintf(
                "[T:%3d, C:%d] decrease: %0.3f\n",
                j,
                i,
                ns.weakenAnalyze(j, i)
            );
        }
    }
    //*/
}
