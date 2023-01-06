// library of string formatters

export function ms2str(milliseconds) {
	var ipart = Math.floor(milliseconds / 1000);         // integer part
	var fpart = Math.round(milliseconds - ipart * 1000); // fractional part
	var levels = [
		[Math.floor(ipart / 86400), "days"],
		[Math.floor((ipart % 86400) / 3600), "hours"],
		[Math.floor((ipart % 3600) / 60), "minutes"],
		[(ipart % 60) + fpart / 1000, "seconds"],
	];
	var return_text = "";

	for (var i = 0, max = levels.length; i < max; i++) {
		if (levels[i][0] === 0) continue;
		let num = levels[i][0];
		let unit = levels[i][1];
		return_text += " " + num + " " + (num === 1 ? unit.substr(0, unit.length - 1) : unit);
	}
	return return_text.trim();
}

// https://stackoverflow.com/questions/2685911/is-there-a-way-to-round-numbers-into-a-reader-friendly-format-e-g-1-1k
export function abbrNum(number, decPlaces) {
	// 2 decimal places => 100, 3 -> 1000, etc
	decPlaces = Math.pow(10, decPlaces);

	// Enumerate number abbreviations
	var abbrev = ["k", "m", "b", "t", "q"];

	// Go through the array backwards, so we do the largets first
	for (var i = abbrev.length - 1; i >= 0; i--) {

		// Convert array index to "1000", "1000000", etc
		var size = Math.pow(10, (i + 1) * 3);

		// If the number is bigger or equal do the abbreviation
		if (size <= number) {
			// Here, we multiply by decPlaces, round, and then divide by decPlaces.
			// This gives us nice rounding to a particular decimal place.
			number = Math.round(number * decPlaces / size) / decPlaces;

			// Handle special case where we round up to the next abbreviation
			if ((number == 1000) && (i < abbrev.length - 1)) {
				number = 1;
				i++;
			}

			// Add the letter for the abbreviation
			number += abbrev[i];

			// We are done... stop
			break;
		}
	}

	return number;
}

// https://stackoverflow.com/questions/2901102/how-to-format-a-number-with-commas-as-thousands-separators
// or `n.toLocaleString()`
export function numberWithCommas(x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}