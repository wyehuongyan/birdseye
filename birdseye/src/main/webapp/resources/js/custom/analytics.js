function initializeUI() {
    // jquery ui elements
    var startDateTextBox = $('#startdatetimepicker');
    var endDateTextBox = $('#enddatetimepicker');

    startDateTextBox.datetimepicker({
        minDate : new Date(2009, 9, 1, 0, 0),
        maxDate : new Date(2010, 4, 31, 0, 0),
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
        minDate : new Date(2009, 9, 1, 0, 0),
        maxDate : new Date(2010, 4, 31, 0, 0),
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

function setLoadingBar(progress, msg) {
    if (progress != null && progress != "") {
        $("#loadprogress").width(progress);
    }

    $("#loadmsg").html(msg);
}

function retrieveGpsPeriod() {
    $("#loadModal").modal('show');

    setLoadingBar("10%", "Querying DB...");

    $.post(urlHolder.gpsperiod, {
        startTimestamp : $('#startdatetimepicker').datetimepicker('getDate').getTime() / 1000,
        endTimestamp : $('#enddatetimepicker').datetimepicker('getDate').getTime() / 1000,
        userid : "002"
    }, function(response) {
        if (response != null) {
            setLoadingBar("30%", "Parsing Data...");
            // alert("Success!\n" +response);

            setTimeout(function() {
                parseGps(response);
            }, 2000);

        } else {
            alert('Failure! An error has occurred retrieving Gps period!');

            setLoadingBar(null, "Error in AJAX Request");
            $("#loadModal").modal('hide');
        }
    });
}

function retrieveGps() {
    requestData = {
        'userid' : '002'
    };
    $.ajax({
        url : urlHolder.gps,
        data : JSON.stringify(requestData),
        type : 'POST',
        contentType : "application/json; charset=utf-8",
        dataType : 'json',

        success : function(response, textStatus, jqXHR) {
            // pass the response to callback function
            parseGps(response);
        },

        error : function(jqXHR, textStatus, errorThrown) {
            alert("Error " + "\njqXHR: " + jqXHR + "\ntextStatus: " + textStatus + "\nerrorThrown: " + errorThrown);
        },

        complete : function(jqXHR, textStatus) {

        }
    });
}

function parseGps(data) {
    // clear markers first
    map.clearMarkers();

    setLoadingBar("80%", "Plotting...");

    $.each(data, function(key, val) {
        // console.log("id: " +val.id+ "\nlongtitude: " +val.longtitude+
        // "\nlatitude: " +val.latitude);
        var marker = new google.maps.Marker({
            position : new google.maps.LatLng(val.latitude, val.longtitude),
            map : map
        });

        markerArray.push(marker);
    });

    console.log("Coordinates Parsed.");

    setTimeout(function() {
        setLoadingBar("100%", "Done");

        setTimeout(function() {
            $("#loadModal").modal('hide');
        }, 1000);

    }, 2000);
}
