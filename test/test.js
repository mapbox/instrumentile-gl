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

function mapInit() {
	return new mbxgljs.Map({
		container: 'map',
	    style: 'mapbox://styles/mapbox/streets-v9',
	    collectResourceTiming: true,
	    center: [1, 2],
	    zoom: 3
	});
}

tape('map load event', (t) => {
	let eventCount = 0;
	const eventsStub = {
		push: (e) => {
			t.ok(e.loadtime, 'loadtime property exists');
			delete e.loadtime; // has timestamp built-in so this won't remain static
			const expected = {
				DNS: 100,
				SSL: 3,
				TCP: 4,
				appCache: 2,
				event: 'map.load',
				id: 'mapbox/testmap',
				lat: 0,
				lng: 0,
				request: 4,
				response: 10,
				source: 'test',
				zoom: 3
			};
			t.deepEquals(e, expected, 'load event is as expected');
			eventCount++;
			if (eventCount > 0)
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

tape('click event', (t) => {
	let eventCount = 0;
	const eventsStub = {
		push: (e) => {
			if (e.event !== 'map.click')
				return;
			const expected = { event: 'map.click', id: 'mapbox/testmap', lat: 2.2, lng: 1.1, source: 'test', zoom: 3 };
			t.deepEquals(e, expected, 'click event is as expected');
			eventCount++;
			if (eventCount > 0)
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

/*
tape('vt load event', (t) => {
	t.end();
});

tape('geojson load event', (t) => {
	t.end();
});


tape('dragend event', (t) => {
	t.end();
});

tape('throws error when collectResourceTiming=false', (t) => {
	t.end();
});

tape('throws error on missing token', (t) => {
	t.end();
});
*/