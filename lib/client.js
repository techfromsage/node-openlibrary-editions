var request = require('request');
var ISBN = require('isbn').global;
var _ = require('underscore')._;
var async = require('async');
var Client = function(options)
{
    var _location = "http://openlibrary.org";

    if(typeof options === 'object')
    {
        for(o in options)
        {
            switch(o)
            {
                case 'location':
                    _location = options[o];
                    break;
            }
        }
    }

    var getWorkIDByEditionKeyValue = function(key, value, callback)
    {
        var url = _location + "/query.json?type=/type/edition&" + key + "=" + encodeURIComponent(value) + "&works="
        request.get({url: url, json: true}, function (error, response, editions) {

            var workIds = []

            for (i in editions) {
                if(editions[i].works)
                {
                    for(w in editions[i].works)
                    {
                        if(editions[i].works[w].key)
                        {
                            workIds.push(editions[i].works[w].key);
                        }
                    }
                }
            }
            callback(workIds);

        });
    }

    var getEditionsByWorkId = function(workId, callback)
    {
        var url = _location + workId + "/editions.json";
        request.get({url: url, json: true}, function (error, response, editions) {

            var records = []

            for (i in editions.entries) {
                records.push(editions.entries[i]);
            }
            callback(null, records);

        });
    }

    this.getEditionsByWorkId = function(id, callback) { getEditionsByWorkId(id, callback); };

    this.getEditionsByISBN = function(isbn, callback) {
        var isbns = [];
        var parsedISBN = ISBN.parse(isbn);
        if(parsedISBN)
        {
            isbns.push(parsedISBN.asIsbn10());
            isbns.push(parsedISBN.asIsbn13());
        } else {
            isbns.push(isbn.replace(/[^0-9Xx]*/g, ''));
        }
        var workIds = []
        var records = {};

        function addRecords(recs, cb)
        {
            var rec = recs.pop();
            if(rec)
            {
                records[rec.key] = rec;
                addRecords(recs, cb);
            } else {
                cb(null);
            }
        }

        function getEditionsForWorkIds(works, cb)
        {
            var work = works.pop();
            if(work)
            {
                if(workIds.indexOf(work) === -1)
                {
                    workIds.push(work);
                    getEditionsByWorkId(work, function(err, recs) {
                        addRecords(recs, function(err) {
                            getEditionsForWorkIds(works, cb);
                        });
                    });
                } else {
                    getEditionsForWorkIds(works, cb);
                }
            } else {
                cb(null);
            }
        }
        function getWorkIdsForIsbn(isbn, cb)
        {
            getWorkIDByEditionKeyValue('isbn_' + isbn.length, isbn, function(ids)
            {
                cb(null, ids);
            });
        }
        function getEditionsForIsbns(isbns, cb)
        {
            var isbn = isbns.pop();
            if(isbn)
            {
                getWorkIdsForIsbn(isbn, function(e, works)
                {
                    getEditionsForWorkIds(works, function(err)
                    {
                        getEditionsForIsbns(isbns, cb);
                    });

                });
            } else {
                cb(null);
            }
        }

        getEditionsForIsbns(isbns, function(err){
            var recs = [];
            for(r in records)
            {
                recs.push(records[r]);
            }
            callback(err, recs);
        });
    }

}

module.exports = function(options) {
    return new Client(options);
};