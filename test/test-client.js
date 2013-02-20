var olisbn = require('../index');
var nock = require('nock');
var fs = require('fs');

exports['testGetEditionsByWorkId'] = function(test)
{
    fs.readFile('./fixtures/OL2784132W.editions.json', 'utf-8', function(err, data) {
        var scope = nock('http://openlibrary.org')
                        .get('/works/OL2784132W/editions.json').reply('200', data);

        var client = new olisbn.Client();

        client.getEditionsByWorkId('/works/OL2784132W', function(err, eds)
        {
            test.equal(5, eds.length);
            test.equal("/books/OL24051551M", eds[0].key);
            test.equal("/books/OL3320928M", eds[4].key);
            test.done();
        });
    });
}

exports['testGetEditions'] = function(test)
{
    fs.readFile('./fixtures/isbn-0415935938-work-ids.json', 'utf-8', function(errIsbn10, isbn10) {
        fs.readFile('./fixtures/isbn-9780415935937-work-ids.json', 'utf-8', function(errIsbn13, isbn13)
        {
            fs.readFile('./fixtures/OL281330W.editions.json', 'utf-8', function(errWork1, work1){
                fs.readFile('./fixtures/OL13674595W.editions.json', 'utf-8', function(errWork2, work2){
                    var scope = nock('http://openlibrary.org')
                        .get('/query.json?type=/type/edition&isbn_10=0415935938&works=').reply('200', isbn10)
                        .get('/query.json?type=/type/edition&isbn_13=9780415935937&works=').reply('200', isbn13)
                        .get('/works/OL281330W/editions.json').reply('200', work1)
                        .get('/works/OL13674595W/editions.json').reply('200', work2);
                    var client = new olisbn.Client();
                    client.getEditionsByISBN('0415935938', function(err, eds)
                    {
                        test.equal(3, eds.length);
                        test.done();
                    });
                });
            });
        });
    });
}