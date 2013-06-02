var fromautocomplete, toautocomplete;
var fromlatlng, tolatlng;

var markerArray = new Array();
var incidentArray = new Array();
var latlngArray;

function calcRoute() {
    var travelMode = document.getElementById("travelmodeDDL").value;
    var avoidHighways = document.getElementById("avoidhighwaysCheckbox");
    var avoidTolls = document.getElementById("avoidtollsCheckbox");
    var threshold = 2;

    var request = {
        origin : fromlatlng,
        destination : tolatlng,
        travelMode : google.maps.TravelMode[travelMode],
        provideRouteAlternatives : false,
        avoidHighways : avoidHighways.checked,
        avoidTolls : avoidTolls.checked
    };

    // call to google direction service api
    directionsService.route(request, function(directionsResult, status) {
        console.log(status);

        if (status == google.maps.DirectionsStatus.OK) {
            directionsDisplay.setDirections(directionsResult);

            // reset all incidents' near attribute to false everytime a new
            // direction result is received
            $.each(incidentArray, function(key, incident) {
                incident.near = false;
            });

            // retrieve the route object and extract all the latlngs that makes
            // up the path
            var directionsRoutes = directionsResult.routes;
            console.log(directionsRoutes);

            latlngArray = directionsRoutes[0].overview_path;

            // latlngArray will be used to check distance between incidents and
            // path //
            // to determine which are the 'relevant' incidents close to the path
            $.each(latlngArray, function(key, latlng) {
                // check with each incident in incidentArray
                $.each(incidentArray, function(key, incident) {
                    // sameple incident only if it has not been marked as near
                    // the path
                    if (!incident.near) {
                        // use haversine formula and see if returned result >
                        // custom threshold
                        var distance = getDistanceFromLatLonInKm(latlng.lat(), latlng.lng(), incident.marker.getPosition().lat(), incident.marker
                                .getPosition().lng())

                        // console.log("distance: " +distance);

                        if (distance <= threshold) {
                            // if distance within threshold of planned path
                            // incident.marker.setVisible(true); // show the
                            // marker

                            // do not sample the marker again
                            incident.near = true;
                        } else {
                            // hide the marker
                            // incident.marker.setVisible(false);
                        }
                    }
                });
            });

            // console.log(latlngArray);

            // expand the accordion to show directionResults
            $('#collapseIncident').collapse('hide');
            $('#collapseDirection').collapse('show');

            $('#relevantCheckBox').prop('disabled', false); // allow the
            // checkbox to be
            // checked
        } else if (status == google.maps.DirectionsStatus.ZERO_RESULTS) {
            alert("There are no routes");
        }
    });
}

// Haversine formula: calculates great-circle distances between the two points
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1); // deg2rad below
    var dLon = deg2rad(lon2 - lon1);

    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km

    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

function showNearIncidents() {
    $.each(incidentArray, function(key, incident) {
        if (incident.near) {
            incident.marker.setVisible(true);
        } else {
            incident.marker.setVisible(false);
        }
    });
}

function showAllIncidents() {
    $.each(incidentArray, function(key, incident) {
        incident.marker.setVisible(true);
    });
}

// end of haversine formula

function initializePlaces() {
    // Google places API
    var fromdirection = document.getElementById("fromdirection");
    var todirection = document.getElementById("todirection");

    // bind autocomplete to desired textfield
    fromautocomplete = new google.maps.places.Autocomplete(fromdirection);
    toautocomplete = new google.maps.places.Autocomplete(todirection);

    // listener functions
    google.maps.event.addListener(fromautocomplete, 'place_changed', function() {
        fromdirection.className = '';

        var place = fromautocomplete.getPlace();

        if (!place.geometry) {
            // Inform the user that the place was not found and return.
            fromdirection.className = 'notfound';
            return;

        }

        if (place.geometry.viewport) {
            map.fitBounds(place.geometry.viewport);

        } else {
            map.setCenter(place.geometry.location);
            map.setZoom(15); // Why 17? Because it looks good.

        }

        // store starting location latlng into fromlatlng
        fromlatlng = place.geometry.location;

        console.log(place.geometry.location);
        console.log("source: %s \nlat: %s \nlong: %s", place.formatted_address, place.geometry.location.jb, place.geometry.location.kb);
    });

    google.maps.event.addListener(toautocomplete, 'place_changed', function() {
        toautocomplete.className = '';

        var place = toautocomplete.getPlace();

        if (!place.geometry) {
            // Inform the user that the place was not found and return.
            toautocomplete.className = 'notfound';
            return;

        }

        if (place.geometry.viewport) {
            map.fitBounds(place.geometry.viewport);

        } else {
            map.setCenter(place.geometry.location);
            map.setZoom(15); // Why 17? Because it looks good.

        }

        // store destination latlng into tolatlng
        tolatlng = place.geometry.location;

        console.log(place.geometry.location);
        console.log("destination: %s \nlat: %s \nlong: %s", place.formatted_address, place.geometry.location.jb, place.geometry.location.kb);
    });
}

function toggleAll(source) {
    checkboxes = document.getElementsByName("incidentType");

    for ( var i = 0, n = checkboxes.length; i < n; i++) {
        checkboxes[i].checked = source.checked;
    }

    filterIncidents();
}

function filterIncidents() {
    // called when checkbox onchange events occur
    $("input[name=incidentType]").each(
            function() {
                for ( var i = 0; i < incidentArray.length; i++) {
                    if ($("#relevantCheckBox").is(":checked")) {
                        if (incidentArray[i].near) {
                            if (this.value != "Others") {
                                if (incidentArray[i].data.type == this.value) {
                                    incidentArray[i].marker.setVisible(this.checked);
                                }
                            } else {
                                if (incidentArray[i].data.type != "Accident" && incidentArray[i].data.type != "Road Work"
                                        && incidentArray[i].data.type != "Vehicle Breakdown" && incidentArray[i].data.type != "Heavy Traffic") {
                                    incidentArray[i].marker.setVisible(this.checked);
                                }
                            }
                        }
                    } else {
                        if (this.value != "Others") {
                            if (incidentArray[i].data.type == this.value) {
                                incidentArray[i].marker.setVisible(this.checked);
                            }
                        } else {
                            if (incidentArray[i].data.type != "Accident" && incidentArray[i].data.type != "Road Work"
                                    && incidentArray[i].data.type != "Vehicle Breakdown" && incidentArray[i].data.type != "Heavy Traffic") {
                                incidentArray[i].marker.setVisible(this.checked);
                            }
                        }
                    }
                }
            });
}

function retrieveOngoingIncidents() {
    // post request to server to retrieve all ongoing incidents
    $.post(urlHolder.ongoingIncidents, function(response) {
        if (response != null) {
            // do stuff here
            parseIncidents(response);
        } else {
            alert("An error has occurred retrieving ongoing incidents");
        }
    });
}

function parseIncidents(data) {
    // clear markers first
    map.clearMarkers();
    map.clearIncidents();

    var icons = {
        "Accident" : {
            icon : "./resources/icons/accident.png"
        },
        "Road Work" : {
            icon : "./resources/icons/road_work.png"
        },
        "Vehicle Breakdown" : {
            icon : "./resources/icons/vehicle_breakdown.png"
        },
        "Heavy Traffic" : {
            icon : "./resources/icons/heavy_traffic.png"
        },
        "Unattended Vehicle" : {
            icon : "./resources/icons/others.png"
        },
        "Obstacle" : {
            icon : "./resources/icons/others.png"
        }
    };

    $.each(data, function(key, val) {
        // console.log("id: " +val.id+ "\nlongitude: " +val.longitude+
        // "\nlatitude: " +val.latitude);
        var incident = new Object();
        incident.data = val;

        // google maps marker stuff //
        var marker = new google.maps.Marker({
            position : new google.maps.LatLng(val.latitude, val.longitude),
            icon : icons[val.type].icon,
            map : map,
            title : val.type
        });

        var infowindow = new google.maps.InfoWindow({
            content : val.message,
            maxWidth : 200
        });

        // marker click listener
        google.maps.event.addListener(marker, 'click', function() {
            // map.setZoom(15);
            // map.setCenter(marker.getPosition());

            // open corresponding info window
            infowindow.open(map, marker);
        });

        // marker visible changed listener
        google.maps.event.addListener(marker, 'visible_changed', function() {
            // open corresponding info window
            if (!marker.getVisible()) {
                infowindow.close();
            }
        });
        // end of google maps marker stuff //

        // set markers to invisible at first
        // marker.setVisible(false);

        incident.marker = marker;
        incident.infowindow = infowindow;
        incident.near = false; // near attribute signifies that it is near the
        // planned path

        incidentArray.push(incident);
        markerArray.push(marker);
    });

    // console.log("Coordinates Parsed.");
    // console.log("no. of markers: " + incidentArray.length);
}