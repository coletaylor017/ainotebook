
/**
 * Takes an Entry object (as specified in the database schema) and generates a snippet of HTML summarizing it.
 * @param {*} entry The entry to generate the HTML summary for.
 */
function generateEntrySummary(entry) {

    // I wrote this as one massive concatenation, which admittedly is not very readable. Might change this later.

    let charCounter = 0; // will use this later

    return `Mentions: <span style="text-transform: capitalize"> `
        // add entities, capitalized an separated by commas
    + entry.metadata.nluData.entities.sort((a, b) =>
        b.relevance - a.relevance
    ).slice(0, 5).map((entity) => entity.name).join(", ")
    + `</span><br style="margin-bottom: 0.8em">...`

    // the following reduction makes a single array with one element for every mention of a keyword
    + entry.metadata.nluData.keywords.reduce((prev, curr) => {
        // for every location of this keyword, add a new array element
        curr.locations.forEach((loc) =>
            prev.push(
                {
                    "location": loc,
                    "text": curr.text
                }
            )
        )
        return prev;
    }, [])
    .sort((a, b) => a.location - b.location) // sort by location, ascending
    // should at this point have an array like: {location: n, text: "blah"}, {}, {}...
    .map((kwObj, index, arr) => {

        const keywordPadding = 6; // include 3 words on either side of each keyword

        let returnVal = ""; // the string we will append to and then eventually return

        // find (n) preceding words, n = keywordPadding
        let letterCounterBefore = 0;
        let wordCounter = 0;

        while (true) {
            let currChar = entry.body.charAt(kwObj.location - letterCounterBefore);
            if (currChar == ' ') {
                wordCounter++; // if we detect a space, increment word counter
            }
            // find either n words or 8n chars. Avg length of english word is ~5.
            if (wordCounter == keywordPadding || letterCounterBefore == keywordPadding * 8) {
                break;
            }
            letterCounterBefore++;
        }

        let intersectsWithPrevious = false;

        // if the words before the keyword (the "prefix") do not intersect with what we have already printed
        if (kwObj.location - letterCounterBefore > charCounter)
        {
            returnVal += entry.body.substring(kwObj.location - letterCounterBefore, kwObj.location)
        } else { // if the prefix does intersect something we've already written
            intersectsWithPrevious = true;
            returnVal += entry.body.substring(charCounter, kwObj.location)
        }
        // increment global char counter
        charCounter = kwObj.location;

        // get the index of the next keyword location
        let nextLoc = entry.body.length; // if we are on the last keyword location
        if (index < arr.length - 1) // if we are not on the last keyword
        {
            nextLoc = arr[index + 1].location; // find start location of next keyword
        }

        // if for some reason the current keyword and the next keyword intersect, print only
        // the difference (currKeyword) - (nextKeyword)
        if (kwObj.location + kwObj.text.length > nextLoc) {
            returnVal += "<strong>" + entry.body.substring(kwObj.location, nextLoc) + "</strong>";
            charCounter = nextLoc; // increment global char counter
            return returnVal;
        }

        // now we are fine to start checking for the suffix
        let letterCounterAfter = 0;
        wordCounter = 0;
        // for convenience
        let keywordEnd = kwObj.location + kwObj.text.length;

        while (true) {
            let currChar = entry.body.charAt(keywordEnd + letterCounterAfter);
            if (currChar == ' ') {
                wordCounter++; // if we detect a space, increment word counter
            }
            // find either n words or 8n chars. Avg length of english word is ~5. Alternatively, if we get to another keyword, stop.
            if (wordCounter == keywordPadding || letterCounterAfter == keywordPadding * 8
            || keywordEnd + letterCounterAfter === nextLoc) {
                break;
            }
            letterCounterAfter++;
        }

        // increment global charCounter
        charCounter = keywordEnd + letterCounterAfter;

        returnVal += "<strong>"
        + entry.body.substring(kwObj.location, keywordEnd)
        + "</strong>"
        + entry.body.substring(keywordEnd, keywordEnd + letterCounterAfter);

        // If we do not intersect with the previous keyword snippet, prepend a "..." to our final output
        if (!intersectsWithPrevious)
        {
            returnVal = "..." + returnVal;
        }

        // if we are the last keyword snippet, add a "..." to the end
        if (index == arr.length - 1)
        {
            returnVal += "...";
        }

        return returnVal;

    }).join('') // get rid of default .map() commas
}