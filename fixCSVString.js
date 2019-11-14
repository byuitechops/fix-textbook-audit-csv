(function () {
    function fixIt(fileData) {
        function getD3DSV() {
            try {
                if (window !== undefined) {
                    return window.d3;
                }
            }
            catch (e) {
                return require('d3-dsv');
            }
        }

        function removeBom(stringIn) {
            if (stringIn[0] === "\uFEFF") {
                stringIn = stringIn.slice(1);
            }
            return stringIn;
        };

        function removeFirstLine(fileData) {
            // add an if
            var indexOfEOL = fileData.indexOf('\n');
            return fileData.slice(indexOfEOL + 1);
        }

        function fixHeaders(fileData) {
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
                .map(header => header.trim().replace(/ +/g, ' '));

            var headerText = parsedHeaders.join(',');
            var allText = lines.slice(secondLineNoSpaceIndex);
            // add the headers on to the top
            allText.unshift(headerText);
            // put it to a csv
            fileData = allText.join('\n');

            // console.log( );
            return fileData;
        }
        var dsv = getD3DSV();
        fileData = removeBom(fileData);



        var deleteFirstLineCheck = /^Course Verification Report/;
        if (deleteFirstLineCheck.test(fileData)) {
            fileData = removeFirstLine(fileData);
        }
        fileData = fixHeaders(fileData);
        // console.log(fileData.slice(0, 500));
        var books = dsv.csvParse(fileData);

        // console.log(books[0])
        books = books
            // trimming all the values
            .map(book => {
                for (const key in book) {
                    book[key] = book[key].trim();
                }
                return book;
            })
            // remove the stars that separate the classes
            .filter(book => {
                return !(book.DEPT.includes("***") || book.CRS.includes("***"));
            })
            // rolls the data to one line
            .reduce((booksOut, book, i) => {
                if (book.DEPT !== "") {
                    booksOut.push(book);
                }
                else {
                    for (const key in book) {
                        if (book[key] !== "") {
                            var space = "";
                            if (key === "Course Comments") {
                                space = " ";
                            }
                            booksOut[booksOut.length - 1][key] += space + book[key];
                        }
                    }
                }
                return booksOut;
            }, [])
            .map(book => {
                if (book["Course Comments"].includes('***')) {

                    notes = book["Course Comments"].split('***');
                    // take out any empty strings
                    notes = notes.filter(note => note !== "");
                    // console.log(notes)

                    notes.forEach((note, i) => {
                        book["Course Comments " + (i + 1)] = "***" + note;
                    });
                }
                delete book["Course Comments"]
                return book;
            })
            .map(book => {
                book.ISBN = `="${book.ISBN.toString()}"`;
                return book;
            });


        // console.log(booksString.slice(0, 3));

        return dsv.csvFormat(books);
    }

    // export it with node or browser
    try {
        // browser
        if (window !== undefined) {
            window.fixIt = fixIt;
        }
    }
    catch (e) {
        // node
        module.exports = fixIt;
    }
})()