var map, map2;
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

    trafficLayer = new google.maps.TrafficLayer();
    trafficLayer.setMap(map);

    directionsService = new google.maps.DirectionsService();
    directionsDisplay = new google.maps.DirectionsRenderer();

    directionsDisplay.setMap(map);
    directionsDisplay.setPanel(document.getElementById("directionsDiv"));
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