const tape = require('tape');
const mbxgljs = require('mapbox-gl-js-mock');
const instrumentile = require('../index.js');
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
        responseEnd: 125
    },
    now: () => { return +new Date(); }
};

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
            if (e.event !== 'map.load')
                return;
            t.ok(e.loadtime, 'loadtime property exists');
            delete e.loadtime; // has timestamp built-in so this won't remain static
            const expected = {
                DNS: 100,
                SSL: 3,
                TCP: 4,
                appCache: 2,
                event: 'map.load',
                id: 'mapbox/testmap',
                lat: 2,
                lng: 1,
                request: 4,
                response: 10,
                source: 'test',
                zoom: 3
            };
            t.deepEquals(e, expected, 'load event is as expected');
            t.end();
        }
    };

    const map = mapInit();

    const inst = instrumentile(map, {
        token: TOKEN,
        source: 'test',
        stub: {
            events: eventsStub,
            performance: perfStub
        }
    });
});

tape('throws error when collectResourceTiming=false', (t) => {
    const map = mapInit({ collectResourceTiming: false });
    const eventsStub = { push: () => {} };
    const inst = instrumentile.bind(null, map, {
        token: TOKEN,
        source: 'test',
        stub: {
            events: eventsStub,
            performance: perfStub
        }
    });
    t.throws(inst, /Instrumentile-GL requires Map\.collectResourceTiming to be true/i, 'throws when collectResourceTiming=false');
    t.end();
});

tape('throws error on missing token', (t) => {
    const map = mapInit();
    const eventsStub = { push: () => {} };
    const inst = instrumentile.bind(null, map, {
        source: 'test',
        stub: {
            events: eventsStub,
            performance: perfStub
        }
    });
    t.throws(inst, /You must provide a valid Mapbox token/i, 'throws on missing token');
    t.end();
});

tape('click event', (t) => {
    const eventsStub = {
        push: (e) => {
            if (e.event !== 'map.click')
                return;
            const expected = { event: 'map.click', id: 'mapbox/testmap', lat: 2.2, lng: 1.1, source: 'test', zoom: 3 };
            t.deepEquals(e, expected, 'click event is as expected');
            t.end();
        }
    };

    const map = mapInit();

    const inst = instrumentile(map, {
        token: TOKEN,
        source: 'test',
        stub: {
            events: eventsStub,
            performance: perfStub
        }
    });

    setTimeout(() => {
        map.fire('click', { lngLat: { lng: 1.1, lat: 2.2 } });
    }, 0);
});

tape('dragend event', (t) => {
    const eventsStub = {
        push: (e) => {
            if (e.event !== 'map.dragend')
                return;
            const expected = { event: 'map.dragend', id: 'mapbox/testmap', lat: 2.2, lng: 1.1, source: 'test', zoom: 3 };
            t.deepEquals(e, expected, 'dragend event is as expected');
            t.end();
        }
    };

    const map = mapInit();

    const inst = instrumentile(map, {
        token: TOKEN,
        source: 'test',
        stub: {
            events: eventsStub,
            performance: perfStub
        }
    });

    setTimeout(() => {
        map.fire('dragend', { lngLat: { lng: 1.1, lat: 2.2 } });
    }, 0);
});

tape('vt load event', (t) => {
    const eventsStub = {
        push: (e) => {
            if (e.event !== 'source.vt')
                return;
            const expected = {
                DNS: 0,
                SSL: 833.8100000000001,
                TCP: 0,
                event: 'source.vt',
                host: undefined,
                id: 'mapbox/testmap',
                request: 10.700000000000045,
                response: 5.694999999999936,
                source: 'test',
                timeTaken: 21.105000000000018,
                url: 'https://a.tiles.mapbox.com/v4/mapbox.mapbox-terrain-v2,mapbox.mapbox-streets-v7/4/14/6.vector.pbf'
            };
            t.deepEquals(e, expected, 'source.vt event is as expected');
            t.end();
        }
    };

    const map = mapInit();

    const inst = instrumentile(map, {
        token: TOKEN,
        source: 'test',
        stub: {
            events: eventsStub,
            performance: perfStub
        }
    });

    setTimeout(() => {
        map.fire('data', {
            tile: {
                resourceTiming: [ {
                    name: "https://a.tiles.mapbox.com/v4/mapbox.mapbox-terrain-v2,mapbox.mapbox-streets-v7/4/14/6.vector.pbf?access_token=pk.xyz123",
                    entryType: "resource",
                    startTime: 833.8100000000001,
                    duration: 21.105000000000018,
                    initiatorType: "xmlhttprequest",
                    nextHopProtocol: "http/1.1",
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
                } ]
            }
        });
    }, 0);
});


/*
tape('geojson load event', (t) => {
    t.end();
});


*/