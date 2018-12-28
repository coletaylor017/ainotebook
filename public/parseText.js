//"text" should be the string to be turned into an object
//like this: "name: value name:value, name:value"

var parseText = function(text) {
    text = text.trim();
    text = text.replace(/, /g, " ");
    text = text.replace(/,/g, " ");
    text = text.replace(/#/g, "");
    text = text.replace(/: /g, ":");
    text = text.split(" ");
    // var obj = new Object();
    // for (var i = 0; i < text.length; i++) {
    //     var item = text[i];
    //     item = item.split(":");
    //     obj. = item[1];
    // }
    return(text);
}

module.exports = parseText;