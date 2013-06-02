var map, map2;

var heatmap;
var trafficLayer;
var geocoder;
var directionsService;
var directionsDisplay;

function initializeMap() {
    var mapOptions = {
        center : new google.maps.LatLng(1.352083, 103.819836),
        zoom : 12,
        mapTypeId : google.maps.MapTypeId.ROADMAP
    };

    map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);

    // custom heatmap
    var MY_MAPTYPE_ID = "custom_heatmap";

    var featureOpts = [ {
        "stylers" : [ {
            "saturation" : -100
        }, {
            "gamma" : 1.2
        }, {
            "lightness" : 15
        } ]
    } ];

    var mapOptions2 = {
        center : new google.maps.LatLng(1.352083, 103.819836),
        zoom : 12,
        mapTypeId : MY_MAPTYPE_ID,
        mapTypeControlOptions : {
            mapTypeIds : [ google.maps.MapTypeId.ROADMAP, MY_MAPTYPE_ID ]
        },
    };

    map2 = new google.maps.Map(document.getElementById("map_canvas2"), mapOptions2);

    var styledMapOptions = {
        name : 'Heatmap'
    };

    var customMapType = new google.maps.StyledMapType(featureOpts, styledMapOptions);

    map2.mapTypes.set(MY_MAPTYPE_ID, customMapType);

    // other google apis initialization
    geocoder = new google.maps.Geocoder();
    heatmap = new google.maps.visualization.HeatmapLayer();

    directionsService = new google.maps.DirectionsService();
    directionsDisplay = new google.maps.DirectionsRenderer();

    directionsDisplay.setMap(map);
    directionsDisplay.setPanel(document.getElementById("directionsDiv"));

    // traffic overlay toggle button
    var controlDiv = document.createElement('DIV');
    $(controlDiv).addClass('gmap-control-container').addClass('gmnoprint');

    var controlUI = document.createElement('DIV');
    $(controlUI).addClass('gmap-control');
    $(controlUI).text('Traffic');
    $(controlDiv).append(controlUI);

    var legend = '<ul>'
            + '<li><span style="background-color: #30ac3e">&nbsp;&nbsp;</span><span style="color: #30ac3e"> &gt; 80 km per hour</span></li>'
            + '<li><span style="background-color: #ffcf00">&nbsp;&nbsp;</span><span style="color: #ffcf00"> 40 - 80 km per hour</span></li>'
            + '<li><span style="background-color: #ff0000">&nbsp;&nbsp;</span><span style="color: #ff0000"> &lt; 40 km per hour</span></li>'
            + '<li><span style="background-color: #c0c0c0">&nbsp;&nbsp;</span><span style="color: #c0c0c0"> No data available</span></li>' + '</ul>';

    var controlLegend = document.createElement('DIV');
    $(controlLegend).addClass('gmap-control-legend');
    $(controlLegend).html(legend);
    $(controlLegend).hide();
    $(controlDiv).append(controlLegend);

    // Set hover toggle event
    $(controlUI).mouseenter(function() {
        $(controlLegend).show();
    }).mouseleave(function() {
        $(controlLegend).hide();
    });

    var trafficLayer = new google.maps.TrafficLayer();

    google.maps.event.addDomListener(controlUI, 'click', function() {
        if (typeof trafficLayer.getMap() == 'undefined' || trafficLayer.getMap() === null) {
            $(controlUI).addClass('gmap-control-active');
            trafficLayer.setMap(map);
        } else {
            trafficLayer.setMap(null);
            $(controlUI).removeClass('gmap-control-active');
        }
    });

    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(controlDiv);
}

google.maps.Map.prototype.clearMarkers = function() {
    for ( var i = 0; i < markerArray.length; i++) {
        markerArray[i].setMap(null);
    }

    markerArray = new Array();
};

google.maps.Map.prototype.clearIncidents = function() {
    for ( var i = 0; i < incidentArray.length; i++) {
        incidentArray[i].marker.setMap(null);
    }

    incidentArray = new Array();
};