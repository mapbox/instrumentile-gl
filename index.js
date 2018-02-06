var Events = require('mapbox-events');

function Instrumentile(map, options) {
    this.map = map;
    this.options = options || {};
    this.id = null;
    this.source = this.options.source || '';

    if (!this.map)
        throw new TypeError('You must provide a valid Mapbox GL Map object');

    if (!this.options.token)
        throw new TypeError('You must provide a valid Mapbox token');
    
    if (!this.map._collectResourceTiming)
        throw new TypeError('Instrumentile-GL requires Map.collectResourceTiming to be true (available in Mapbox GL JS >=0.44.0).');

    this._events = Events({
        api: this.options.api,
        token: this.options.token,
        flushAt: this.options.flushAt,
        flushAfter: this.options.flushAfter
    });

    this.events = {
        push: (e) => {
            console.log(e);
            // this._events.push(e);
        }
    };

    var that = this;
    map.on('data', function(mde) {
        // vector tile load event
        if (mde.tile && mde.tile.resourceTiming && (mde.tile.resourceTiming.length > 0)) {
            that._dataLoadEvent('source.vt', mde.tile.resourceTiming[mde.tile.resourceTiming.length - 1]);
        }
        // GeoJSON load event
        else if (
            (mde.source) &&
            (mde.source.type === 'geojson') &&
            (mde.source.data) &&
            (typeof mde.source.data === 'string') &&
            (mde.resourceTiming) &&
            (mde.resourceTiming.length > 0)
        ) {
            that._dataLoadEvent('source.geojson', mde.resourceTiming[mde.resourceTiming.length - 1]);
        }
    });

    map.on('load', this._mapLoadEvent.bind(this));
    map.on('click', this._interactionEvent.bind(this, 'map.click'));
    map.on('dragend', this._interactionEvent.bind(this, 'map.dragend'));
}

Instrumentile.prototype._performance = function() {
    //use performance.now over new Date() when available
    if (window.performance && window.performance.now)
        return window.performance.now();
    else
        return new Date();
};

Instrumentile.prototype._dataLoadEvent = function(label, p) {
    var url = new URL(p.name);
    url.search = url.search
        .split('&')
        .filter(function(param) { return !/(^|\?)access_token=.*/.test(param); })
        .join('&');
    DNS = p.domainLookupEnd - p.domainLookupStart;
    TCP = p.connectEnd - p.connectStart;
    SSL = (!isNaN(parseFloat(p.secureConnectionStart)) && isFinite(p.secureConnectionStart)) ?
        p.connectEnd - p.secureConnectionStart : undefined;
    request = p.responseStart - p.requestStart;
    response = p.responseEnd - p.responseStart;
    this.events.push({
        id: this.id,
        source: this.source,
        event: label,
        url: url.toString(),
        timeTaken: p.duration,
        host: url.hostname,
        DNS: DNS,
        TCP: TCP,
        SSL: SSL,
        request: request,
        response: response
    });
};

Instrumentile.prototype._interactionEvent = function(label, e) {
    var zoom = this.map.getZoom();
    var lngLat = e.lngLat || this.map.getCenter();
    this.events.push({
        id: this.id,
        source: this.source,
        event: label,
        lat: lngLat.lat,
        lng: lngLat.lng,
        zoom: zoom
    });
};

Instrumentile.prototype._mapLoadEvent = function(e) {
    // assemble map style ID once component parts are loaded/available
    var mapId = [];
    if (this.map.style && this.map.style.stylesheet) {
        if (this.map.style.stylesheet.owner)
            mapId.push(this.map.style.stylesheet.owner || '');
        if (this.map.style.stylesheet.id)
            mapId.push(this.map.style.stylesheet.id || '');
        this.id = mapId.join('/');
    }        

    var DNS, TCP, SSL, loadtime, request, response, appCache;
    var center = this.map.getCenter();
    var zoom = this.map.getZoom();
    var p = {};

    if (window.performance) {
        p = performance.timing;
        DNS = p.domainLookupEnd - p.domainLookupStart;
        TCP = p.connectEnd - p.connectStart;
        SSL = p.secureConnectionStart ?
            p.connectEnd - p.secureConnectionStart : undefined;
        loadtime = +new Date() - p.navigationStart;
        request = p.responseStart - p.requestStart;
        response = p.responseEnd - p.responseStart;
        appCache = p.domainLookupStart - p.fetchStart;
    }

    this.events.push({
        id: this.id,
        source: this.source,
        event: 'map.load',
        lat: center.lat,
        lng: center.lng,
        zoom: zoom,
        DNS: DNS,
        TCP: TCP,
        SSL: SSL,
        loadtime: loadtime,
        request: request,
        response: response,
        appCache: appCache
    });
}

module.exports = function(map, options) {
    return new Instrumentile(map, options);
};