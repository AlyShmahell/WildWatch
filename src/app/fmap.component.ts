import { Component, OnInit, Input } from '@angular/core';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import 'ol/ol.css';
import { Map, View, Overlay, Feature } from 'ol';
import TileLayer from 'ol/layer/Tile';
import { Vector as LayerVector } from 'ol/layer';
import { Vector as SourceVector } from 'ol/source';
import OSM from 'ol/source/OSM';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Style, Icon } from 'ol/style';
import { toStringHDMS } from 'ol/coordinate';
import Point from 'ol/geom/Point';
import { defaults as defaultInteractions, DragRotateAndZoom } from 'ol/interaction';
import { Injectable } from '@angular/core';
import { SQLiteProvider } from './sqlite.provider';
import Search from 'ol-ext/control/Search';
import { easeOut } from 'ol/easing';


@Component({
  selector: 'fmap',
  templateUrl: 'fmap.component.html',
  styleUrls: ['fmap.component.scss'],
})


@Injectable({
  providedIn: 'root'
})

export class fMapComponent implements OnInit {
  @Input() title: string = 'Drawer UI element';
  constructor(private geolocation: Geolocation, private db: SQLiteProvider) { }
  async update_map_sql(center) {
    await this.db.dbInstance.executeSql(`UPDATE filters SET lon=${center[0]}, lat=${center[1]} WHERE id=1`);
    var res2 = await this.db.dbInstance.executeSql(`SELECT * from filters`);
    console.log('res2', res2);
  }
  ngOnInit() {

    var center = [0, 0];
    this.geolocation.getCurrentPosition().then((resp) => {
      center = [resp.coords.longitude, resp.coords.latitude]
      console.log("set coordinate", center);
    }).catch((error) => {
      console.log('Error getting location', error);
    });
    var view = new View({
      center: fromLonLat(center),
      zoom: 8
    });
    var geometry = new Point(fromLonLat(center));
    var container = document.getElementById('ol-popup');
    var closer = document.getElementById('ol-popup-closer');
    var content = document.getElementById('ol-popup-content');
    var overlay = new Overlay({
      element: container,
      autoPan: true,
      autoPanAnimation: {
        duration: 250000
      }
    });
    var map = new Map({
      interactions: defaultInteractions().extend([
        new DragRotateAndZoom()
      ]),
      target: document.getElementById('fmap'),
      overlays: [overlay],
      layers: [
        new TileLayer({
          source: new OSM()
        })
      ],
      view: view
    });
    document.querySelector('.ol-zoom').innerHTML = '';
    //document.querySelector('fmap').innerHTML += '<p>A</p>'
    /*
    var search = new Search(
      {	target: document.querySelector('.ol-zoom'),
        // Title to use in the list
        getTitle: function (f) { return f.name; }
      });
    map.addControl(search);

    // Center when click on the reference index
    search.on('select', function (e) {
      map.getView().animate({
        center: e.search.pos,
        zoom: 6,
        easing: easeOut
      })
    });
    */
    var iconFeature = new Feature({
      geometry: geometry
    });
    var ivaryle = new Style({
      image: new Icon({
        src: 'assets/img/location-outline.png'
      })
    });
    iconFeature.setStyle(ivaryle);
    var layer = new LayerVector({
      source: new SourceVector({
        features: [iconFeature]
      })
    });
    map.addLayer(layer);
    map.on('click', function (evt: any) {
      var coordinate = evt.coordinate;
      var hdms = toStringHDMS(toLonLat(coordinate));
      content.innerHTML = '<p>clicked coordinates are :</p><code>' + hdms + '</code>';
      overlay.setPosition(coordinate);
      console.log(coordinate);
      return true;
    });
    closer.onclick = function () {
      overlay.setPosition(undefined);
      closer.blur();
      return false;
    };
    let watch = this.geolocation.watchPosition();
    watch.subscribe((data) => {
      center = [data.coords.longitude, data.coords.latitude]
      console.log("changed coordinate", center);
      view.setCenter(fromLonLat(center));
      geometry.setCoordinates(fromLonLat(center));
      this.update_map_sql(center);
    });
    setTimeout(async () => {
      map.updateSize();
      await this.db.seed('assets/sql/seed.sql');
      await this.db.dbInstance.executeSql(`INSERT INTO filters(id, lon, lat) VALUES (1, ${center[0]}, ${center[1]})`);
      var res = await this.db.dbInstance.executeSql(`SELECT * from filters`);
      console.log('res', res);
    }, 1);
  }
}