
// globToRegExp turns a UNIX glob expression into a RegEx expression.
//  Supports all simple glob patterns. Examples: *.ext, /foo/*, ../../path, ^foo.*
// - single character matching, matching ranges of characters etc. group matching are no supported
// - flags are not supported
var globToRegExp = function (globExp) {
    if (typeof globExp !== 'string') {
        throw new TypeError('Glob Expression must be a string!');
    }

    var regExp = "";

    for (let i = 0, len = globExp.length; i < len; i++) {
        let c = globExp[i];

        switch (c) {
            case "/":
            case "$":
            case "^":
            case "+":
            case ".":
            case "(":
            case ")":
            case "=":
            case "!":
            case "|":
                regExp += "\\" + c;
                break;

            case "*":
                // treat any number of "*" as one
                while(globExp[i + 1] === "*") {
                    i++;
                }
                regExp += ".*";
                break;

            default:
                regExp += c;
        }
    }

    // set the regular expression with ^ & $
    regExp = "^" + regExp + "$";

    return new RegExp(regExp);
};

module.exports = globToRegExp;