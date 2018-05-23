'use strict';

const tape = require('tape');
const mbxgljs = require('mapbox-gl-js-mock');
const instrumentile = require('..');
const TOKEN = 'pk.abcdefghijklmnopqrstuvwxyz1234567890';

const perfStub = {
    timing: {
        navigationStart: 0,
        redirectStart: 1,
        redirectEnd: 2,
        fetchStart: 3,
        domainLookupStart: 5,
        domainLookupEnd: 105,
        connectStart: 106,
        secureConnectionStart: 107,
        connectEnd: 110,
        requestStart: 111,
        responseStart: 115,
        responseEnd: 125,
        transferSize: 0,
        encodedBodySize: 1024,
        decodedBodySize: 2048
    },
    now: () => { return +new Date(); }
};

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function mapInit(opts) {
    opts = opts || {};
    return new mbxgljs.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v9',
        collectResourceTiming: typeof opts.collectResourceTiming === 'undefined' ? 'true' : opts.collectResourceTiming,
        center: [1, 2],
        zoom: 3
    });
}

tape('map load event', (t) => {
    const eventsStub = {
        push: (e) => {
            if (e.event !== 'instrumentile.map.load')
                return;
            t.ok(e.loadtime, 'loadtime property exists');
            delete e.loadtime; // has timestamp built-in so this won't remain static
            const expected = {
                DNS: 100,
                SSL: 3,
                TCP: 4,
                appCache: 2,
                event: 'instrumentile.map.load',
                id: 'mapbox/testmap',
                lat: 2,
                lng: 1,
                request: 4,
                response: 10,
                source: 'test',
                zoom: 3,
                schema: 'instrumentile.map.load-2.1'
            };
            t.deepEquals(e, expected, 'load event is as expected');
            t.end();
        }
    };

    const map = mapInit();

    const inst = new instrumentile(map, {
        token: TOKEN,
        source: 'test',
        stub: {
            events: eventsStub,
            performance: perfStub
        }
    });
    t.ok(inst);
});

tape('throws error on missing token', (t) => {
    const map = mapInit();
    const eventsStub = {push: () => {}};
    const inst = function () {
        return new instrumentile(map, {
            source: 'test',
            stub: {
                events: eventsStub,
                performance: perfStub
            }
        });
    };
    t.throws(inst, /You must provide a valid Mapbox token/i, 'throws on missing token');
    t.end();
});

tape('click event', (t) => {
    const eventsStub = {
        push: (e) => {
            if (e.event !== 'instrumentile.map.click')
                return;
            const expected = {
                event: 'instrumentile.map.click',
                id: 'mapbox/testmap',
                lat: 2.2,
                lng: 1.1,
                source: 'test',
                zoom: 3,
                schema: 'instrumentile.map.click-2.1'
            };
            t.deepEquals(e, expected, 'click event is as expected');
            t.end();
        }
    };

    const map = mapInit();

    const inst = new instrumentile(map, {
        token: TOKEN,
        source: 'test',
        stub: {
            events: eventsStub,
            performance: perfStub
        }
    });
    t.ok(inst);

    setTimeout(() => {
        map.fire('click', {lngLat: {lng: 1.1, lat: 2.2}});
    }, 0);
});

tape('dragend event', (t) => {
    const eventsStub = {
        push: (e) => {
            if (e.event !== 'instrumentile.map.dragend')
                return;
            const expected = {
                event: 'instrumentile.map.dragend',
                id: 'mapbox/testmap',
                lat: 2.2,
                lng: 1.1,
                source: 'test',
                zoom: 3,
                schema: 'instrumentile.map.dragend-2.1'
            };
            t.deepEquals(e, expected, 'dragend event is as expected');
            t.end();
        }
    };

    const map = mapInit();

    const inst = new instrumentile(map, {
        token: TOKEN,
        source: 'test',
        stub: {
            events: eventsStub,
            performance: perfStub
        }
    });
    t.ok(inst);

    setTimeout(() => {
        map.fire('dragend', {lngLat: {lng: 1.1, lat: 2.2}});
    }, 0);
});

tape('vt load event', (t) => {
    const eventsStub = {
        push: (e) => {
            if (e.event !== 'instrumentile.source.vt')
                return;
            const expected = {
                DNS: 0,
                SSL: 833.8100000000001,
                TCP: 0,
                event: 'instrumentile.source.vt',
                host: 'a.tiles.mapbox.com',
                id: 'mapbox/testmap',
                request: 10.700000000000045,
                response: 5.694999999999936,
                source: 'test',
                timeTaken: 21.105000000000018,
                decodedBodySize: 20187,
                encodedBodySize: 13511,
                transferSize: 14189,
                url: 'https://a.tiles.mapbox.com/v4/mapbox.mapbox-terrain-v2,mapbox.mapbox-streets-v7/4/14/6.vector.pbf',
                schema: 'instrumentile.source.vt-2.1'
            };
            t.deepEquals(e, expected, 'instrumentile.source.vt event is as expected');
            t.end();
        }
    };

    const map = mapInit();

    const inst = new instrumentile(map, {
        token: TOKEN,
        source: 'test',
        stub: {
            events: eventsStub,
            performance: perfStub
        }
    });
    t.ok(inst);

    setTimeout(() => {
        map.fire('data', {
            tile: {
                resourceTiming: [{
                    name: 'https://a.tiles.mapbox.com/v4/mapbox.mapbox-terrain-v2,mapbox.mapbox-streets-v7/4/14/6.vector.pbf?access_token=pk.xyz123',
                    entryType: 'resource',
                    startTime: 833.8100000000001,
                    duration: 21.105000000000018,
                    initiatorType: 'xmlhttprequest',
                    nextHopProtocol: 'http/1.1',
                    workerStart: 0,
                    redirectStart: 0,
                    redirectEnd: 0,
                    fetchStart: 833.8100000000001,
                    domainLookupStart: 833.8100000000001,
                    domainLookupEnd: 833.8100000000001,
                    connectStart: 833.8100000000001,
                    connectEnd: 833.8100000000001,
                    secureConnectionStart: 0,
                    requestStart: 838.5200000000001,
                    responseStart: 849.2200000000001,
                    responseEnd: 854.9150000000001,
                    transferSize: 14189,
                    encodedBodySize: 13511,
                    decodedBodySize: 20187,
                    serverTiming: []
                }]
            }
        });
    }, 0);
});


tape('geojson load & setData events', (t) => {
    const map = mapInit();

    let eventCount = 0;

    const eventsStub = {
        push: (e) => {
            if (e.event !== 'instrumentile.source.geojson')
                return;

            ['DNS', 'TCP', 'SSL', 'request', 'response', 'timeTaken'].forEach((tk) => {
                t.ok(isNumeric(e[tk]) && (e[tk] > 0), tk + ' looks ok');
                delete e[tk];
            });

            const expected = {
                event: 'instrumentile.source.geojson',
                host: 'localhost:5000',
                id: 'mapbox/testmap',
                source: 'instrumentileTest',
                url: 'http://localhost:5000/test.geojson',
                decodedBodySize: 155,
                encodedBodySize: 155,
                transferSize: 443,
                schema: 'instrumentile.source.geojson-2.1'
            };

            if (eventCount === 0) {
                t.deepEquals(e, expected, 'geojson map.addSource produces expected load event');
                eventCount += 1;
                map.getSource('fakeGeoJSONsource').setData('http://localhost:5000/test2.geojson');
            } else {
                expected.url = 'http://localhost:5000/test2.geojson';
                t.deepEquals(e, expected, 'geojson setData produces expected event');
                t.end();
            }
        }
    };

    const inst = new instrumentile(map, {
        token: TOKEN,
        source: 'instrumentileTest',
        stub: {
            events: eventsStub,
            performance: perfStub
        }
    });
    t.ok(inst);

    map.on('load', () => {
        map.addSource('fakeGeoJSONsource', {
            type: 'geojson',
            data: 'http://localhost:5000/test.geojson'
        });
    });
});

tape('supportsWebWorkerPerformanceCollection=true', (t) => {
    function Worker() {
        var self = {};
        self.postMessage = () => {
            self.onmessage({data: 'found'});
        };
        return self;
    }
    global.Worker = Worker;
    global.URL = {createObjectURL: () => {}};
    global.window = {Worker: global.Worker, URL: global.URL};
    global.Blob = function () { return true; };
    instrumentile.supportsWebWorkerPerformanceCollection((err, res) => {
        t.error(err);
        t.equals(res, true, 'returns true when facilities are available');
        t.end();
    });
});

tape('supportsWebWorkerPerformanceCollection=false (IE 10)', (t) => {
    function Worker() {
        var self = {};
        self.postMessage = () => {
            self.onmessage({data: 'found'});
        };
        return self;
    }
    global.Worker = Worker;
    global.URL = {createObjectURL: () => {}};
    global.window = {Worker: global.Worker, URL: global.URL};
    global.MSBlobBuilder = true;
    global.Blob = function () { return true; };
    instrumentile.supportsWebWorkerPerformanceCollection((err, res) => {
        t.error(err);
        t.equals(res, false, 'returns false when MSBlobBuilder is defined');
        t.end();
    });
});

tape('supportsWebWorkerPerformanceCollection=false (no web workers)', (t) => {
    global.Worker = false;
    global.URL = {createObjectURL: () => {}};
    global.window = {Worker: global.Worker, URL: global.URL};
    instrumentile.supportsWebWorkerPerformanceCollection((err, res) => {
        t.error(err);
        t.equals(res, false, 'returns false when Worker is undefined');
        t.end();
    });
});

