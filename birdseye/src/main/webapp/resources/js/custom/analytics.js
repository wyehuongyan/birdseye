var incidentData, heatMapData, permaHeatMapData;
var pointArray;

function initializeUI() {
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

function initializeHeatMap() {
    pointArray = new google.maps.MVCArray(heatMapData);

    heatmap.setData(pointArray);
    heatmap.setOptions({
        radius : 23,
        opacity : 0.6,
    });

    heatmap.setMap(map2);

    $("#incidentSlider").slider({
        range : "min",
        min : $('#startdatetimepicker').datetimepicker('getDate').getTime() + 28800000,
        max : $('#enddatetimepicker').datetimepicker('getDate').getTime() + 28800000,
        value : $('#startdatetimepicker').datetimepicker('getDate').getTime() + 28800000,
        slide : sliderMoveCallback
    });

    $("#analyticsInfoDiv").css("display", "block");

    // reset retrieve loading button to original state
    $("#retrieveButton").button('reset');
}

function sliderMoveCallback(event, ui) {
    var date = new Date(ui.value);

    // every time slider is slide, calculate current value //
    // and push the filtered latlng into pointArray //
    pointArray.clear();

    $.each(incidentData, function(key, heatObj) {
        if (heatObj.visible) {
            if (parseInt(heatObj.startTimestamp) <= parseInt(ui.value)) {
                pointArray.push(heatObj.latlng);
            }
        }
    });

    var dateString = date.toString().split(" ");
    // console.log(dateString);

    $("#analyticsDate").val(dateString[0] + " " + dateString[1] + " " + dateString[2] + " " + dateString[3]);
    $("#analyticsTime").val(dateString[4]);
}

function toggleAnalyticsAll(source) {
    checkboxes = document.getElementsByName("analyticsIncidentType");

    for ( var i = 0, n = checkboxes.length; i < n; i++) {
        checkboxes[i].checked = source.checked;
    }

    filterAnalyticsIncidents();
}

function filterAnalyticsIncidents() {
    $("input[name=analyticsIncidentType]").each(
            function() {
                for ( var i = 0; i < incidentData.length; i++) {
                    if (this.value != "Others") {
                        if (incidentData[i].data.type == this.value) {
                            // incidentData[i].marker.setVisible(this.checked);
                            incidentData[i].visible = this.checked;
                        }
                    } else {
                        if (incidentData[i].data.type != "Accident" && incidentData[i].data.type != "Road Work"
                                && incidentData[i].data.type != "Vehicle Breakdown" && incidentData[i].data.type != "Heavy Traffic") {
                            // incidentData[i].marker.setVisible(this.checked);
                            incidentData[i].visible = this.checked;
                        }
                    }
                }
            });

    var tempUI = new Object();
    tempUI.value = $("#incidentSlider").slider('value');

    sliderMoveCallback(null, tempUI);
}

function retrieveBetweenIncidents() {
    $("#retrieveButton").button('loading');

    $.post(urlHolder.betweenIncidents, {
        // + 8hrs in milliseconds as getTime() returns GMT time
        startTimestamp : $('#startdatetimepicker').datetimepicker('getDate').getTime() + 28800000,
        endTimestamp : $('#enddatetimepicker').datetimepicker('getDate').getTime() + 28800000
    }, function(response) {
        if (response != null) {
            // console.log(response);
            // reset checkboxes to all true
            var checkboxes = document.getElementsByName("analyticsIncidentType");

            for ( var i = 0, n = checkboxes.length; i < n; i++) {
                checkboxes[i].checked = true;
            }

            parseHeatMapIncidents(response);

        } else {
            alert('Failure! An error has occurred retrieving Gps period!');
        }
    });
}

function parseHeatMapIncidents(data) {
    // clear incidentData array first
    incidentData = new Array();
    heatMapData = new Array();

    permaHeatMapData = new Array();

    // create a google latlng object for each incident
    // and push it into the incidentData array
    $.each(data, function(key, incident) {
        var heatObj = new Object();
        var latlng = new google.maps.LatLng(incident.latitude, incident.longitude);

        heatObj.latlng = latlng;
        heatObj.startTimestamp = incident.startTimestamp;
        heatObj.data = incident;
        heatObj.visible = true;

        incidentData.push(heatObj);
        heatMapData.push(latlng);
        permaHeatMapData.push(latlng);
    });

    initializeHeatMap();
}
