var fs = require('fs');
var stripBom = require('strip-bom');
var dsv = require('d3-dsv');
var fileData = fs.readFileSync(process.argv[2], 'utf8');
fileData = stripBom(fileData);

function removeFirstLine(fileData) {
    var indexOfEOL = fileData.indexOf('\n');
    return fileData.slice(indexOfEOL + 1);
}

function fixHeaders(fileData) {
    var dsv = require('d3-dsv');
    var lines = fileData.split('\n'),
        secondLineNoSpaceIndex = lines.findIndex((line, i) => {
            return i > 0 && line[0] !== ' ';
        });
    // console.log(secondLineNoSpaceIndex);
    // console.log('line',lines[secondLineNoSpaceIndex]);
    var headerRows = lines.slice(0, secondLineNoSpaceIndex);
    var headerRowsText = headerRows.join('\n');
    var parsedHeaders = dsv.csvParseRows(headerRowsText);
    parsedHeaders = parsedHeaders
        // combine all the rows first
        .reduce((rowOut, row) => {
            return rowOut.map((cell, i) => cell + row[i])
        }) // no starting acc
        // trim and remove extra spaces all the values
        .map(header => header.trim().replace(/ +/g,' '));

    var headerText = parsedHeaders.join(',');
    var allText = lines.slice(secondLineNoSpaceIndex);
    // add the headers on to the top
    allText.unshift(headerText);
    // put it to a csv
    fileData = allText.join('\n');

    // console.log( );
    return fileData;
}

fileData = removeFirstLine(fileData);
fileData = fixHeaders(fileData);
var deleteFirstLineCheck = /^Course Verification Report/
if (deleteFirstLineCheck.test(fileData)) {
    fileData = fileData.replace(/^Course Verification Report.*?(\r?\n)+/m, '');
}
console.log(fileData.slice(0, 500));
books = dsv.csvParse(fileData);


books = books
    .map(book => {
        for (const key in book) {
            book[key] = book[key].trim();
        }
        return book;
    })
    .filter(book => {
        return !(book.DEPT.includes("***") || book.CRS.includes("***"));
    })
    .reduce((booksOut, book, i) => {
        if (book.DEPT !== "") {
            booksOut.push(book);
        }
        else {
            for (const key in book) {
                if (book[key] !== "") {
                    if (key === "Course Comments") {
                        booksOut[booksOut.length - 1][key] += " " + book[key];
                    } else {
                        booksOut[booksOut.length - 1][key] += book[key];
                    }
                }
            }
        }

        return booksOut;
    }, [])
    .map(book => {
        if (book["Course Comments"].includes('***')) {

            notes = book["Course Comments"].split('***');
            // take the first one off
            notes.shift();
            // console.log(notes)

            notes.forEach((note, i) => {
                book["Course Comments" + (i + 1)] = "***" + note;
            });
        }
        delete book["Course Comments"]
        return book;
    })
    .map(book => {
        book.ISBN = `="${book.ISBN.toString()}"`;
        return book;
    });

// console.log(books.slice(0, 30));

// fs.writeFileSync(`fixed${Date.now()}.csv`,dsv.csvFormat(books),'utf8');
fs.writeFileSync(`fixed.csv`, dsv.csvFormat(books), 'utf8');