/*eslint-env browser*/

'use strict';

var Events = require('@mapbox/mapbox-events');

function URLParse(s) {
    this.url = s;
    this.search = s.split('?').length > 1 ? s.split('?')[1] : '';
    this.hostname = this.url.replace(/https?:\/\/([^/]+)\/.*$/, '$1');
}
URLParse.prototype.toString = function () {
    return this.url.split('?')[0] + (this.search ? '?' + this.search : '');
};

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

    if (this.options.stub && this.options.stub.events)
        this._events = this.options.stub.events;
    else
        this._events = Events({
            api: this.options.api,
            token: this.options.token,
            flushAt: this.options.flushAt,
            flushAfter: this.options.flushAfter,
            version: 2
        });

    function pushFunc(e) {
        e.schema = e.event + '-2.1';
        this._events.push(e);
    }

    // apply schema versioning
    this.events = {
        push: pushFunc.bind(this)
    };

    if (this.options.stub && this.options.stub.performance)
        this.performance = this.options.stub.performance;
    else if (window && window.performance)
        this.performance = performance;
    else
        this.performance = false;

    function dataFunc(mde) {
        // vector tile load event
        if (mde.tile && mde.tile.resourceTiming && (mde.tile.resourceTiming.length > 0))
            this._dataLoadEvent('instrumentile.source.vt', mde.tile.resourceTiming[mde.tile.resourceTiming.length - 1]);
        // GeoJSON load event
        else if (
            (mde.source) &&
            (mde.source.type === 'geojson') &&
            (mde.source.data) &&
            (typeof mde.source.data === 'string') &&
            (mde.resourceTiming) &&
            (mde.resourceTiming.length > 0)
        )
            this._dataLoadEvent('instrumentile.source.geojson', mde.resourceTiming[mde.resourceTiming.length - 1]);
    }

    map.on('data', dataFunc.bind(this));
    map.on('load', this._mapLoadEvent.bind(this));
    map.on('click', this._interactionEvent.bind(this, 'instrumentile.map.click'));
    map.on('dragend', this._interactionEvent.bind(this, 'instrumentile.map.dragend'));
}

Instrumentile.prototype._performance = function () {
    //use performance.now over new Date() when available
    if (this.performance && this.performance.now)
        return this.performance.now();
    else
        return new Date();
};

Instrumentile.prototype._dataLoadEvent = function (label, p) {
    var url = new URLParse(p.name);
    url.search = url.search
        .split('&')
        .filter(function (param) { return !/(^|\?)access_token=.*/.test(param); })
        .join('&');
    var DNS = p.domainLookupEnd - p.domainLookupStart;
    var TCP = p.connectEnd - p.connectStart;
    var SSL = (!isNaN(parseFloat(p.secureConnectionStart)) && isFinite(p.secureConnectionStart)) ?
        p.connectEnd - p.secureConnectionStart : undefined;
    var request = p.responseStart - p.requestStart;
    var response = p.responseEnd - p.responseStart;
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
        response: response,
        transferSize: p.transferSize,
        decodedBodySize: p.decodedBodySize,
        encodedBodySize: p.encodedBodySize
    });
};

Instrumentile.prototype._interactionEvent = function (label, e) {
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

Instrumentile.prototype._mapLoadEvent = function () {
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

    if (this.performance) {
        p = this.performance.timing;
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
        event: 'instrumentile.map.load',
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
};

module.exports = function (map, options) {
    return new Instrumentile(map, options);
};
