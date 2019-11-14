var fs = require('fs');
var path = require("path");
var fixIt = require("./fixCSVString");
var fullLocation = path.resolve(process.argv[2]);
var fileData = fs.readFileSync(fullLocation, 'utf8');
var filename = path.basename(process.argv[2], '.csv');
var filenameOut = `${filename}_fixed.csv`;

var booksString = fixIt(fileData);

fs.writeFileSync(filenameOut, booksString , 'utf8');
console.log(`wrote ${filenameOut}`);