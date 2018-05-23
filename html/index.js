'use strict';

var mapboxgl = require('mapbox-gl');
var instrumentile = require('..');

var TOKEN = 'pk.eyJ1Ijoic2JtYTQ0IiwiYSI6ImNqZG01Y3I5MDBoNDYycGxqZTMyNDRpNXEifQ.YHhxnKFP3dMzYutQGWiG9w';

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

document.addEventListener('DOMContentLoaded', function () {
    mapboxgl.accessToken = TOKEN;

    instrumentile.supportsWebWorkerPerformanceCollection(function (err, supported) {
        if (err) return;

        var elem = document.getElementById('supports');
        if (elem) {
            elem.className = supported ? 'success' : 'success (but not supported)';
            elem.children[0].innerText = '✔';
        }

        if (!supported) {
            ['source-geojson-load', 'source-geojson-setdata', 'source-vt'].forEach(function (p) {
                var elem = document.getElementById(p);
                if (elem) {
                    elem.className = 'na';
                    elem.children[0].innerText = '?';
                }
            });
        }

        var map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v9',
            collectResourceTiming: supported,
            hash: true,
            center: [-77.0574, 38.8937],
            zoom: 12
        });

        window.instrumentileHandle = new instrumentile(map, {
            token: TOKEN,
            source: 'integrationtest',
            stub: {
                events: {
                    push: function (e) {
                        // check if event looks ok
                        var numericProps = ['timeTaken'];
                        var optionalNumericProps = ['DNS', 'TCP', 'request', 'response', 'transferSize', 'encodedBodySize', 'decodedBodySize'];
                        if ((e.event === 'instrumentile.map.dragend') || (e.event === 'instrumentile.map.click')) {
                            numericProps = ['lat', 'lng', 'zoom'];
                            optionalNumericProps = [];
                        } else if (e.event === 'instrumentile.map.load') {
                            numericProps = ['DNS', 'TCP', 'appCache', 'lat', 'lng', 'loadtime', 'request', 'response', 'zoom'];
                            optionalNumericProps = [];
                        }
                        var numericPropsOk = numericProps.every(function (p) {
                            var res = (e[p] || (e[p] === 0)) && isNumeric(e[p]);
                            if (!res)
                                console.error('event ' + e.event + ' property ' + p + ' is not numeric');
                            return res;
                        });
                        var optionalNumericPropsOk = optionalNumericProps.every(function (p) {
                            if (!e[p]) {
                                console.warn('propery ' + e.event + '/' + p + ' not found but it is optional');
                            } else if (!isNumeric(e[p])) {
                                console.error('property ' + e.event + '/' + p + ' is optional but it was found and is NOT numeric, which is disallowed');
                                return false;
                            }
                            return true;
                        });
                        if (!numericPropsOk || !optionalNumericPropsOk)
                            return;
                        if (e.source !== 'integrationtest')
                            return;

                        // note its reception
                        var elemName = e.event.replace('instrumentile.', '').replace(/\./g, '-');
                        if (elemName === 'source-geojson')
                            elemName += '-' + (e.url.indexOf('step1') !== -1 ? 'load' : 'setdata');
                        var elem = document.getElementById(elemName);
                        if (elem) {
                            // this code should use awesome CSS pseudoclass/content trickery, but alas MS Edge is not
                            // reliable at refreshing its render when you do that
                            elem.className = 'success';
                            elem.children[0].innerText = '✔';
                        }
                    }
                }
            }
        });

        map.on('load', function () {
            console.log('- map loaded. loading GeoJSON...');
            map.addSource('blah', {
                type: 'geojson',
                data: 'step1.geojson'
            });

            window.setTimeout(function () {
                console.log('- loading second GeoJSON...');
                map.getSource('blah').setData('step2.geojson');
            }, 1000);
        });
    });
});
