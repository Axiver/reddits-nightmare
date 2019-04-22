
//Initialize WordPOS library
var WordPOS = require('wordpos'),
    wordpos = new WordPOS();

async function autoHashtag(caption) {
	return new Promise(resolve => {
		wordpos.getNouns(caption, function(result) {
			let nouns = result;
			wordpos.getAdjectives(caption, function(result) {
				let adjective = result;
				for (var i=0;i<nouns.length;i++) {
					if (nouns[i].length < 3) {
						nouns.splice(nouns[i], 1);
					} else {
				    	nouns[i]="#"+nouns[i];
					}
				}
				for (var i=0;i<adjective.length;i++) {
					if (adjective[i].length < 3) {
						adjective.splice(adjective[i], 1);
					} else {
				    	adjective[i]="#"+adjective[i];
				    	if (nouns.includes(adjective[i]))
				    		adjective = adjective.splice(adjective[i], 1);
					}
				}
				let editedcaption = nouns.join(" ");
				editedcaption += " ";
				editedcaption += adjective.join(" ");
				resolve(editedcaption);
			});
		});
	});
}

async function getCaption(caption) {
	console.log(await autoHashtag(caption));
}

let YourCaption = "Just like the real thing."

getCaption(YourCaption.toLowerCase());