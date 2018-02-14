'use strict';

var mapboxgl = require('mapbox-gl');
var instrumentile = require('..');

var TOKEN = 'pk.eyJ1Ijoic2JtYTQ0IiwiYSI6ImNqZG01Y3I5MDBoNDYycGxqZTMyNDRpNXEifQ.YHhxnKFP3dMzYutQGWiG9w';

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

document.addEventListener('DOMContentLoaded', function() {
  mapboxgl.accessToken = TOKEN;
  var map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v9',
      collectResourceTiming: true,
      hash: true,
      center: [-77.0574, 38.8937],
      zoom: 12
  });

  instrumentile(map, {
      token: TOKEN,
      source: 'integrationtest',
      stub: {
        events: {
          push: function(e) {
            // check if event looks ok
            var numericProps = ['DNS', 'TCP', 'request', 'response', 'timeTaken'];
            if ((e.event === 'map.dragend') || (e.event === 'map.click'))
              numericProps = ['lat', 'lng', 'zoom'];
            else if (e.event === 'map.load')
              numericProps = ['DNS', 'TCP', 'appCache', 'lat', 'lng', 'loadtime', 'request', 'response', 'zoom'];
            if (!numericProps.every(function(p) {
              var res = (e[p] || (e[p] === 0)) && isNumeric(e[p]);
              if (!res) {
                console.error('event ' + e.event + ' property ' + p + ' is not numeric');
              }
              return res;
            }))
              return;
            if (e.source !== 'integrationtest')
              return;

            // note its reception
            var elemName = e.event.replace('.', '-');
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

  map.on('load', () => {
      console.log('- map loaded. loading GeoJSON...');
      map.addSource('blah', {
          type: 'geojson',
          data: 'step1.geojson'
      });

      window.setTimeout( function(){
          console.log('- loading second GeoJSON...');
          map.getSource('blah').setData('step2.geojson');
      }, 1000);
  });
});