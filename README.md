Instrumentile GL
================

Instrumentile GL is a [plugin for Mapbox GL JS](https://www.mapbox.com/mapbox-gl-js/api/) for [tracking page render time for embed pages](https://github.com/mapbox/tilestream-pro/issues/3012). It updates the original [Instrumentile](https://github.com/mapbox/instrumentile) project by @camilleanne for Mapbox GL JS.

Tracking these metrics is important in order for Mapbox to understand the performance of tile loading for users, in addition to the performance of different [Content Delivery Networks (CDN)](https://en.wikipedia.org/wiki/Content_delivery_network), such as Amazon and Akamai. We also collect these metrics in order to watch for network neutrality violations from different ISPs.

The implementation relies upon the [performance.timing API](http://www.w3.org/TR/2012/REC-navigation-timing-20121217/#sec-window.performance-attribute), which is fully available in Mapbox GL JS >=0.44.0 via the `collectResourceTiming` option. Data is collected from front-end embeds and pushed through [mapbox-events](https://github.com/mapbox/mapbox-events) to [api-events](https://github.com/mapbox/api-events).

## Firefox Compatibility

As of this writing, the current version of Firefox Quantum (58) suffers from [a bug affecting the accessibility of the performance.timing API in web workers](https://bugzilla.mozilla.org/show_bug.cgi?id=1425458). This is slated to be fixed in Firefox 60. In the meantime, relevant parts of Mapbox GL JS and Instrumentile GL will fail silently.

## Installation

```
npm install @mapbox/instrumentile-gl
```

## Usage

```javascript
const mapboxgl = require('mapbox-gl');
const instrumentile = require('@mapbox/instrumentile-gl');

mapboxgl.accessToken = VALID_ACCESS_TOKEN;

// optional check for web worker performance API support -- avoids errors on Mapbox GL 0.44 & 0.45
instrumentile.supportsWebWorkerPerformanceCollection(function(err, supported) {
    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v9',
        collectResourceTiming: supported
    });

    const inst = new instrumentile(map, {
        token: VALID_ACCESS_TOKEN,
        api: 'https://api.tiles.mapbox.com', // this is the default
        source: 'whatevs' // optional source string that is sent along every event
    });
});
```

## Tests

Unit tests can be run with `npm test` and use [mapbox-gl-js-mock](https://github.com/mapbox/mapbox-gl-js-test). The somewhat tautologous nature of these unit tests means that **browser-based integration testing is essential**.

To run these integration tests, run `npm run test-browser` and open your browser to `http://localhost:3000/`. Map load, GeoJSON and Vector Tile events should fire in the course of the map loading. You will need to click and pan the map to fire their corresponding events.

## Deploying

Ensure you are authed and run `bin/deploy.sh`.