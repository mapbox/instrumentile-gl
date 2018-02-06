Instrumentile GL
================

Instrumentile GL is a [plugin for Mapbox GL JS](https://www.mapbox.com/mapbox-gl-js/api/) for [tracking page render time for embed pages](https://github.com/mapbox/tilestream-pro/issues/3012). It updates the original [Instrumentile](https://github.com/mapbox/instrumentile) project by @camilleanne for Mapbox GL JS.

Tracking these metrics is important in order for Mapbox to understand the performance of tile loading for users, in addition to the performance of different [Content Delivery Networks (CDN)](https://en.wikipedia.org/wiki/Content_delivery_network), such as Amazon and Akamai. We also collect these metrics in order to evaluate network neutrality violations from different ISPs.

The implementation relies upon the [performance.timing API](http://www.w3.org/TR/2012/REC-navigation-timing-20121217/#sec-window.performance-attribute), which is fully available in Mapbox GL JS >=0.44.0 via the `collectResourceTiming` option. Data is collected from front-end embeds and pushed through [mapbox-events](https://github.com/mapbox/mapbox-events) to [api-events](https://github.com/mapbox/api-events).

## Install

Not yet published, but: 

```
npm install @mapbox/instrumentile-gl
```

## Usage

```javascript
const mapboxgl = require('mapbox-gl');
const instrumentile = require('instrumentile-gl');

mapboxgl.accessToken = VALID_ACCESS_TOKEN;
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v9',
    collectResourceTiming: true
});

var inst = instrumentile(map, {
    token: VALID_ACCESS_TOKEN,
    api: 'https://api.tiles.mapbox.com', // this is the default
    source: 'whatevs' // optional source string that is sent along every event
});
```

## Tests (not yet implemented)

To test different browsers, run `npm start` and open your browser to `http://localhost:3000/test/test.html`.

To see instrumentile in action without running automated tests, run `npm start`

TODO:
- [ ] cross-browser manual test page
- [ ] mocked GL JS