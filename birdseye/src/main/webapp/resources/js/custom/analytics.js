var incidentData, heatMapData, permaHeatMapData;

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
    heatmap.setData(heatMapData);
    heatmap.setOptions({
        radius : 23,
        opacity : 0.6,
    });

    heatmap.setMap(map2);

    // set pan and slider to be visible
    $("#panLabel").html(new Date($('#startdatetimepicker').datetimepicker('getDate').getTime()));

    $("#incidentSlider").slider({
        range : "min",
        min : $('#startdatetimepicker').datetimepicker('getDate').getTime(),
        max : $('#enddatetimepicker').datetimepicker('getDate').getTime(),
        value : $('#startdatetimepicker').datetimepicker('getDate').getTime(),
        slide : function(event, ui) {
            var date = new Date(ui.value);

            /*
             * $('.ui-slider-handle').html( '<div data-toggle="tooltip"
             * class="tooltip fade top slider-tip"><div class="tooltip-arrow"></div><div
             * class="tooltip-inner">' + date + '</div></div>');
             */

            // every time slider is slide, calculate current value //
            // and push the filtered latlng into pointArray //
            heatMapData = new Array();
            heatMapData.push.apply(heatMapData, permaHeatMapData);

            var last = 0; // this variable keeps the last occurence of key
            // that
            // satisfy the if condition

            $.each(incidentData, function(key, heatObj) {
                if (parseInt(heatObj.startTimestamp) <= parseInt(ui.value)) {
                    last = key;
                }
            });

            var newHeatMapData = heatMapData.slice(0, last);

            heatmap.setData(newHeatMapData); // super

            $("#panLabel").html(date);
        }
    });

    $("#analyticsCheckBoxDiv").css("display", "block");
}

function retrieveBetweenIncidents() {
    $.post(urlHolder.betweenIncidents, {
        startTimestamp : $('#startdatetimepicker').datetimepicker('getDate').getTime(),
        endTimestamp : $('#enddatetimepicker').datetimepicker('getDate').getTime()
    }, function(response) {
        if (response != null) {
            // console.log(response);
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

        incidentData.push(heatObj);
        heatMapData.push(latlng);
        permaHeatMapData.push(latlng);
    });

    initializeHeatMap();
}
