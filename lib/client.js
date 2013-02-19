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
        async.forEach(isbns, function(i, cb)
        {
            getWorkIDByEditionKeyValue('isbn_' + i.length, i, function(ids)
            {
                async.forEach(ids, function(w, cb2)
                {
                    if(workIds.indexOf(w) === -1)
                    {
                        workIds.push(w);
                        getEditionsByWorkId(w, function(err, recs) {
                            for(r in recs)
                            {
                                if(!records[recs[r].key])
                                {
                                    records[recs[r].key] = recs[r];
                                }
                            }
                            cb2(null, w);
                        });
                    } else {
                        cb2(null, w);
                    }


                }, function(err) {
                    cb(null, i);
                });

            });

        }, function() {
            var recs = [];
            for(r in records)
            {
                recs.push(records[r]);
            }
            callback(null, recs); });

    }

}

module.exports = function(options) {
    return new Client(options);
};