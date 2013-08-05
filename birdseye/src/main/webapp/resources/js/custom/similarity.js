var incidentData;
var markerArray = new Array();
var map;

function initializeSimUI() {
    // hard code data limits from 27th May 2013 till current day

    // jquery ui elements
    var startDateTextBox = $('#startdatetimepicker');
    var endDateTextBox = $('#enddatetimepicker');

    startDateTextBox.datetimepicker({
        minDate : new Date(2013, 4, 27, 0, 0),
        maxDate : new Date(),
        dateFormat : "D MM d yy",
        separator : ' @ ',
        defaultDate : new Date(startDateTextBox.datepicker("option", "minDate")),
        onClose : function(dateText, inst) {
            if (endDateTextBox.val() != '') {
                var testStartDate = startDateTextBox.datetimepicker('getDate');
                var testEndDate = endDateTextBox.datetimepicker('getDate');

                if (testStartDate > testEndDate) {
                    endDateTextBox.datetimepicker('setDate', testStartDate);
                }
            } else {
                // endDateTextBox.val(dateText);
                endDateTextBox.datetimepicker('setDate', dateText);
            }
        },
        onSelect : function(selectedDateTime) {
            endDateTextBox.datetimepicker('option', 'minDate', startDateTextBox.datetimepicker('getDate'));
        }
    });
    endDateTextBox.datetimepicker({
        minDate : new Date(2013, 4, 27, 0, 0),
        maxDate : new Date(),
        dateFormat : "D MM d yy",
        separator : ' @ ',
        onClose : function(dateText, inst) {
            if (startDateTextBox.val() != '') {
                var testStartDate = startDateTextBox.datetimepicker('getDate');
                var testEndDate = endDateTextBox.datetimepicker('getDate');
                if (testStartDate > testEndDate) {
                    startDateTextBox.datetimepicker('setDate', testEndDate);
                }
            } else {
                // startDateTextBox.val(dateText);
                startDateTextBox.datetimepicker('setDate', dateText);
            }
        },
        onSelect : function(selectedDateTime) {
            startDateTextBox.datetimepicker('option', 'maxDate', endDateTextBox.datetimepicker('getDate'));
        }
    });
}

function initSimMiniMap() {
    // mini google map at bottom right corner
    var latlng = new google.maps.LatLng(1.352083, 103.819836);
    var myOptions = {
        zoom : 10,
        center : latlng,
        mapTypeId : google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById("simMapContainer"), myOptions);
}

function initCarouselImages(camera) {
    $(".carousel").remove();
    $(".carouselModal-footer").remove();

    var carouselHTMLString = "<div id='trafficImageCarousel' class='carousel slide'> <ol class='carousel-indicators'></ol><div class='carousel-inner'></div><a class='carousel-control left' href='#trafficImageCarousel' data-slide='prev'>&lsaquo;</a><a class='carousel-control right' href='#trafficImageCarousel' data-slide='next'>&rsaquo;</a></div>";
    $("#carousel-body").append(carouselHTMLString);

    // console.log("click listener for camera: " + camera[0].cameraId);

    var carouselIndicatorHTMLString = "<li data-target='#trafficImageCarousel' data-slide-to='0' class='active carousel-indicator-content'></li>";
    var carouselInnerHTMLString = "<div class='active carousel-inner-content item'><img style='margin-left: auto; margin-right: auto;' src='data:image/jpg;base64,"
            + camera[0].image + "'></div>";

    $
            .each(
                    camera,
                    function(index, processedImage) {
                        if (index != 0) {
                            carouselIndicatorHTMLString += "<li data-target='#trafficImageCarousel' data-slide-to='" + index
                                    + "' class='carousel-indicator-content'></li>";
                            carouselInnerHTMLString += "<div class='carousel-inner-content item'><img style='margin-left: auto; margin-right: auto;' src='data:image/jpg;base64,"
                                    + processedImage.image + "'></div>";
                        }
                    });

    $(".carousel-indicators").append(carouselIndicatorHTMLString);
    $(".carousel-inner").append(carouselInnerHTMLString);

    $("#carousel-footer").append("<p class='carouselModal-footer'>Camera Id: " + camera[0].cameraId + "</p>");

    // stop auto scrolling
    $('#trafficImageCarousel').carousel({
        interval : false
    });

    $('#carouselModal').modal('show');
}

function createTrafficImageMarker(camera) {
    // plot on map
    var trafficImageMarker = new google.maps.Marker({
        position : new google.maps.LatLng(camera[0].latitude, camera[0].longitude),
        map : map,
        icon : "./resources/icons/traffic_camera.png",
        title : "Camera ID: " + camera[0].cameraId,
        animation : google.maps.Animation.DROP
    });

    // marker click listener
    google.maps.event.addListener(trafficImageMarker, 'click', function() {
        initCarouselImages(camera);
    });

    return trafficImageMarker;
}

function addSimMarkerPair(rowId) {
    // clear map of markers first
    map.clearMarkers();

    // init icons
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

    var incident = incidentData[rowId - 1];

    var targetIncident = incident.targetIncident;
    var bestMatch = incident.bestMatch;
    var bestImages = incident.bestImages;

    if (bestImages.length != 0) {
        var cameraArray = new Array();

        // sorting
        $.each(bestImages, function(index, processedImage) {
            // bin into different arrays, depending on camera ID
            if (!(typeof cameraArray[processedImage.cameraId] !== 'undefined' && cameraArray[processedImage.cameraId] !== null)) {
                cameraArray[processedImage.cameraId] = new Array();
            } else {
                cameraArray[processedImage.cameraId].push(processedImage);
            }
        });

        // plotting
        for ( var cameraKey in cameraArray) {

            // console.log(cameraKey);
            var camera = cameraArray[cameraKey];

            var trafficImageMarker = createTrafficImageMarker(camera);

            markerArray.push(trafficImageMarker);
        }

        // console.log(cameraArray);
    }

    var targetIncidentMarker = new google.maps.Marker({
        position : new google.maps.LatLng(targetIncident.latitude, targetIncident.longitude),
        map : map,
        icon : icons[targetIncident.type].icon,
        title : targetIncident.type,
        animation : google.maps.Animation.DROP
    });

    markerArray.push(targetIncidentMarker);

    if (bestMatch.type != null) {
        var bestMatchMarker = new google.maps.Marker({
            position : new google.maps.LatLng(bestMatch.latitude, bestMatch.longitude),
            map : map,
            icon : icons[bestMatch.type].icon,
            title : bestMatch.type,
            animation : google.maps.Animation.DROP
        });
        markerArray.push(bestMatchMarker);
    }

    // set viewport to center of targetIncidentMarker
    map.panTo(new google.maps.LatLng(targetIncident.latitude, targetIncident.longitude));
    map.setZoom(13);
}

google.maps.Map.prototype.clearMarkers = function() {
    for ( var i = 0; i < markerArray.length; i++) {
        markerArray[i].setMap(null);
    }

    markerArray = new Array();
};

function retrieveSimilarIncidents() {
    // fancy animation
    $("#retrieveButton").button('loading');
    $('#loadingModal').modal('show');

    $.post(urlHolder.similarIncidents, {
        // + 8hrs in milliseconds as getTime() returns GMT time
        startTimestamp : $('#startdatetimepicker').datetimepicker('getDate').getTime() + 28800000,
        endTimestamp : $('#enddatetimepicker').datetimepicker('getDate').getTime() + 28800000,
        type1 : $("input:checkbox[name='similarityIncidentType']:checked")[0].value,
        type2 : $("input:checkbox[name='similarityIncidentType']:checked")[1].value,
        radius : $("#radiusSlider").slider("value"),
        time : $("#timeSlider").slider("value")
    }, function(response) {
        if (response != null) {
            // hide loading modal
            $('.similarContent').css('display', 'block');
            $('#loadingModal').modal('hide');
            $("#retrieveButton").button('reset');
            initSimMiniMap();

            console.log(response);
            incidentData = response.cosSimilarities;

            // testing
            $('td[name=tmsg]').each(function() {
                $(this).text("(5/7)20:55 Roadworks on Boon Lay Way (towards Pioneer Road North) after Jurong West Street 61. Avoid right lane.");
            });

            // append rows to similarity table
            $('.simRow').remove();

            var htmlString = "<tbody class='simRow'>";
            var cosineSimilarity = 0;
            var bestMatchType = "";

            for ( var i = 0; i < incidentData.length; i++) {
                var dataObj = incidentData[i];

                // console.log(dataObj.bestImages);

                var simLevel = "Low";

                if (dataObj.similarity > 0) {
                    if (dataObj.bestImages.length != 0) {
                        simLevel = "High (image)"
                    } else {
                        simLevel = "High"; // not really good to show 1.0, have
                        // some ambiguity
                    }
                }

                cosineSimilarity += parseFloat(dataObj.similarity);

                var targetIncidentOccurredOn = new Date((parseInt(dataObj.targetIncident.startTimestamp)) /*- 28800000*/);
                var targetIncidentMsg = dataObj.targetIncident.message;

                var bestMatchOccurredOn = "No match found";
                var bestMatchMsg = "No match found";
                var trColor = "";

                if (dataObj.bestMatch.startTimestamp != null && dataObj.bestMatch.message != null) {
                    bestMatchOccurredOn = new Date((parseInt(dataObj.bestMatch.startTimestamp)) /*- 28800000*/);
                    bestMatchMsg = dataObj.bestMatch.message;
                    bestMatchType = dataObj.bestMatch.type;
                    trColor = " success";
                }

                htmlString += "<tr class='simRow" + trColor + "' id='simRow" + (i + 1) + "'>" + "<td>" + (i + 1) + "</td>" + "<td>"
                        + targetIncidentOccurredOn + "</td>" + "<td name='simMsg'>" // cloud
                        // deployment
                        + targetIncidentMsg + "</td>" + "<td>" + bestMatchOccurredOn + "</td>" + "<td name='simMsg'>" // cloud
                        // deployment
                        + bestMatchMsg + "</td>" + "<td>"

                        + dataObj.timeApart + " mins" + "</td>" + "<td>" + simLevel + "</td>" + "</tr>";

            }

            htmlString += "</tbody>"

            $('#similarTable thead:last').after(htmlString);

            // set header title
            $('#scatterLabel').text(incidentData[0].targetIncident.type + " VS " + bestMatchType);

            // update pie chart
            var cosSim = (cosineSimilarity / incidentData.length) * 100;
            setTimeout(function() {
                $('.chart').data('easyPieChart').update(cosSim.toFixed(1))
            }, 500);
            console.log("cosine similarity:" + cosSim);

            // display summary table
            $('.sumTable').remove();

            $('#summaryDiv').html(
                    "<table class='sumTable table table-hover'>" + "<tr>" + "<td>" + incidentData[0].targetIncident.type + " Count</td>" + "<td>"
                            + response.numTargetIncident + "</td>" + "</tr>" + "<tr>" + "<td>" + bestMatchType + " Count</td>" + "<td>"
                            + response.numBestMatch + "</td>" + "</tr>" + "<tr>" + "<td>" + "Number of Matches</td>" + "<td>" + response.numMatches
                            + "</td>" + "</tr>" + "</table>");

            // tbody click handler
            $('.table > tbody > tr').click(function() {
                // row was clicked
                addSimMarkerPair((this.id).replace(/^\D+/g, ''));
            });

        } else {
            alert('Failure! An error has occurred retrieving Gps period!');
        }
    });
}