var directionsService;
var expresswaysData;
var dayArray = new Array();
var dayExpresswayArray = new Array();
var polyLineArray = new Array();
var congMap;
var routeColor = "#FF0000"

// add startswith function to the String prototype
if (typeof String.prototype.startsWith != 'function') {
    // see below for better implementation!
    String.prototype.startsWith = function(str) {
        return this.indexOf(str) == 0;
    };
}

function toggleDaysAll(source) {
    checkboxes = document.getElementsByName("dataCongestDay");

    for ( var i = 0, n = checkboxes.length; i < n; i++) {
        checkboxes[i].checked = source.checked;
    }

    concatDays(dayExpresswayArray);
    filterPolyLine();
}

function toggleExpresswaysAll(source) {
    checkboxes = document.getElementsByName("dataCongestExpressway");

    for ( var i = 0, n = checkboxes.length; i < n; i++) {
        checkboxes[i].checked = source.checked;
    }

    filterExpressway();
}

function initializeCongUI() {
    // hard code data limits from 27th May 2013 till current day

    // jquery ui elements
    var startDateTextBox = $('#congeststartdatetimepicker');
    var endDateTextBox = $('#congestenddatetimepicker');

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

    // change handler for day filter checkbox
    $("input[name=dataCongestDay]").change(function() {
        concatDays(dayExpresswayArray);
        filterPolyLine();
    });

    // change handler for expressway filter checkbox
    $("input[name=dataCongestExpressway]").change(function() {
        filterExpressway();
    });
}

function initCongMiniMap() {
    var MY_MAPTYPE_ID = "congestion_map"

    var featureOpts = [ {
        "stylers" : [ {
            "saturation" : -100
        }, {
            "gamma" : 1.2
        }, {
            "lightness" : 15
        } ]
    } ];

    var latlng = new google.maps.LatLng(1.352083, 103.819836);
    var myOptions = {
        zoom : 11,
        center : latlng,
        mapTypeId : MY_MAPTYPE_ID,
        mapTypeControlOptions : {
            mapTypeIds : [ google.maps.MapTypeId.ROADMAP, MY_MAPTYPE_ID ]
        },
    };

    congMap = new google.maps.Map(document.getElementById("congestMapContainer"), myOptions);

    var styledMapOptions = {
        name : 'Congestion'
    };

    var customMapType = new google.maps.StyledMapType(featureOpts, styledMapOptions);

    congMap.mapTypes.set(MY_MAPTYPE_ID, customMapType);

    directionsService = new google.maps.DirectionsService();
}

function retrieveCongestion() {
    // fancy animation
    $("#congestRetrieveButton").button('loading');
    $('#loadingModal').modal('show');

    $.post(urlHolder.congestion, {
        // + 8hrs in milliseconds as getTime() returns GMT time
        startTimestamp : $('#congeststartdatetimepicker').datetimepicker('getDate').getTime() + 28800000,
        endTimestamp : $('#congestenddatetimepicker').datetimepicker('getDate').getTime() + 28800000
    }, function(response) {
        if (response != null) {
            // console.log(response);
            $("#congestMapContainer").css("border-style", "solid");
            $("#congestMapContainer").css("border-width", "2px");
            $("#congestMapContainer").css("border-color", "gray");
            $("#congTableDiv").show();
            $(".congestFilter").show();

            initCongMiniMap();

            $("#congestRetrieveButton").button('reset');
            $('#loadingModal').modal('hide');

            expresswaysData = response;

            // bin data
            binExpresswayByDay(response);

            // count the no. of congestions per expressway for bar chart display
            // countExpressway(response);

            // init polyLineArray
            for ( var i = 0; i < 7; i++) {
                polyLineArray[i] = new Array();
            }

            // for congestion pairs without prior data
            plotCongestions(response.expressways);

            // existing directionsResults
            plotDirectionsResults(response.directionResults);
        }
    });
}

function countExpressway(data) {
    var expressways = data.expressways;
    var directionResults = data.directionResults;

    var expresswayCount = new Array();
    for ( var i = 0; i < 9; i++) {
        var expressway = new Object();
        expressway.count = 0;

        expresswayCount.push(expressway);
    }

    expresswayCount[0].name = "PIE";
    expresswayCount[1].name = "BKE";
    expresswayCount[2].name = "AYE";
    expresswayCount[3].name = "SLE";
    expresswayCount[4].name = "TPE";
    expresswayCount[5].name = "ECP";
    expresswayCount[6].name = "KJE";
    expresswayCount[7].name = "KPE";
    expresswayCount[8].name = "CTE";

    // loop through and obtain no. of congestions per expressway
    $.each(directionResults, function(index, dr) {
        var expresswayName = dr.name;

        if ((expresswayName).startsWith("PIE")) {
            expresswayCount[0].count++;
        } else if ((expresswayName).startsWith("BKE")) {
            expresswayCount[1].count++;
        } else if ((expresswayName).startsWith("AYE")) {
            expresswayCount[2].count++;
        } else if ((expresswayName).startsWith("SLE")) {
            expresswayCount[3].count++;
        } else if ((expresswayName).startsWith("TPE")) {
            expresswayCount[4].count++;
        } else if ((expresswayName).startsWith("ECP")) {
            expresswayCount[5].count++;
        } else if ((expresswayName).startsWith("KJE")) {
            expresswayCount[6].count++;
        } else if ((expresswayName).startsWith("KPE")) {
            expresswayCount[7].count++;
        } else if ((expresswayName).startsWith("CTE")) {
            expresswayCount[8].count++;
        }
    });

    $.each(expressways, function(index, e) {
        var expresswayName = e.name;

        if ((expresswayName).startsWith("PIE")) {
            expresswayCount[0].count++;
        } else if ((expresswayName).startsWith("BKE")) {
            expresswayCount[1].count++;
        } else if ((expresswayName).startsWith("AYE")) {
            expresswayCount[2].count++;
        } else if ((expresswayName).startsWith("SLE")) {
            expresswayCount[3].count++;
        } else if ((expresswayName).startsWith("TPE")) {
            expresswayCount[4].count++;
        } else if ((expresswayName).startsWith("ECP")) {
            expresswayCount[5].count++;
        } else if ((expresswayName).startsWith("KJE")) {
            expresswayCount[6].count++;
        } else if ((expresswayName).startsWith("KPE")) {
            expresswayCount[7].count++;
        } else if ((expresswayName).startsWith("CTE")) {
            expresswayCount[8].count++;
        }
    });

    initBarChart(expresswayCount);
}

function plotDirectionsResults(data) {
    $.each(data, function(index, dr) {
        var directionsResult = JSON.parse(dr.directionsResult);

        // get day
        var date = new Date(parseInt(dr.startTimestamp)/* - 28800000 */); //
        // cloud
        // deployment
        // var date = new Date(parseInt(dr.startTimestamp));
        var day = parseInt(date.getDay());

        // "overview_path" to plot polyline
        var paths = directionsResult.routes[0].overview_path;
        var overview_path = new Array();

        $.each(paths, function(index, pathObj) {
            // create a new google latlng object for each pair of jb kb values
            var overviewlatlng = new google.maps.LatLng(pathObj.jb, pathObj.kb);

            overview_path.push(overviewlatlng);
        });

        var polyline = new google.maps.Polyline({
            path : overview_path,
            strokeColor : routeColor,
            strokeOpacity : 0.3,
            strokeWeight : 4
        });

        polyline.setMap(congMap);

        polyLineArray[day].push(polyline);

        // console.log(polyLineArray);
    });
}

function plotCongestions(data) {
    // loop through each expressway
    // retrieve the ramps lat and lng to query for directions
    // plot the resulting polyline using directions renderer

    var locationArray = new Array();
    var expressArray = new Array();
    var directionsArray = new Array();

    var threshold = 1; // at most n overlapping location latlngs
    var requestCount = 0;
    var origCount = 0;

    $.each(data, function(index, expressway) {
        // console.log(expressway.name);

        var eExists = false;

        $.each(expressArray, function(index, e) {
            if (e.name == expressway.name) {
                eExists = true;
                e.count++;

                return false;
            }
        });

        if (!eExists) {
            var ew = new Object();
            ew.name = expressway.name;
            ew.count = 1;

            expressArray.push(ew);
        }

        var ramps = expressway.ramps;

        // reduce number of requests
        // limit = 2500 per day
        // overlapping origins and destinations max threshold = 3
        location1 = new google.maps.LatLng(ramps[0].lat, ramps[0].lng);
        location2 = new google.maps.LatLng(ramps[1].lat, ramps[1].lng);

        var exists = false;
        var max = false;

        // check locations array if current location1 and location2 exists
        $.each(locationArray, function(index, l) {
            if (l.loc1.equals(location1) && l.loc2.equals(location2)) {
                // already exists, increment count
                // console.log("exists");
                exists = true;
                l.count++;

                if (l.count > threshold) {
                    // console.log("max");
                    l.count = threshold;
                    max = true;
                }

                return false;
            }
        });

        if (!exists) {
            // a new location object
            var location = new Object();
            location.loc1 = location1;
            location.loc2 = location2;
            location.count = 1;

            locationArray.push(location);

            requestCount++;

            // plot
            googleRequestDirections(location1, location2, expressway);
        } else {
            // exist
            if (!max) {
                // send request to directions service if threshold not met
                // plot
                googleRequestDirections(location1, location2, expressway);
                requestCount++;
            }
        }

        // plot
        origCount++;
    });

    function googleRequestDirections(start, end, expressway) {
        // a new directions renderer for each route
        // so multiple routes can be shown simultaneously
        var directionsDisplay = new google.maps.DirectionsRenderer({
            suppressMarkers : true,
            preserveViewport : true
        });

        directionsDisplay.setMap(congMap);

        // get day
        var date = new Date(parseInt(expressway.startTimestamp)/* - 28800000 */);
        var day = parseInt(date.getDay());

        var request = {
            origin : start,
            destination : end,
            travelMode : google.maps.TravelMode.DRIVING,
            provideRouteAlternatives : false
        };

        directionsService.route(request, function(directionsResult, status) {
            if (status == google.maps.DirectionsStatus.OK) {
                // console.log(directionsResult);

                // store as a DirectionResult object
                var direction = new Object();
                direction.id = expressway.incidentId;
                direction.name = expressway.name;
                direction.startTimestamp = expressway.startTimestamp;
                direction.directionsResult = JSON.stringify(directionsResult); // directionsResult.routes[0].overview_path;

                // console.log(direction);

                // add into directionsArray
                directionsArray.push(direction);

                // directionsDisplay.setDirections(directionsResult); // auto
                // drawing of route by google

                // manual drawing using polyline
                // "overview_path" to plot polyline
                var paths = directionsResult.routes[0].overview_path;
                var overview_path = new Array();

                $.each(paths, function(index, pathObj) {
                    // create a new google latlng object for each pair of jb kb
                    // values
                    var overviewlatlng = new google.maps.LatLng(pathObj.jb, pathObj.kb);

                    overview_path.push(overviewlatlng);
                });

                var polyline = new google.maps.Polyline({
                    path : overview_path,
                    strokeColor : routeColor,
                    strokeOpacity : 0.3,
                    strokeWeight : 4
                });

                polyline.setMap(congMap);

                polyLineArray[day].push(polyline);

                // console.log(polyLineArray);
            }
        });
    }

    console.log("no. of compressed requests sent: " + requestCount);
    console.log("no. of original requests sent: " + origCount);
    // console.log("expressway array: ");
    // console.log(expressArray);

    setTimeout(function() {
        updateDirections(directionsArray);
    }, 3000);
}

function updateDirections(directionsArray) {
    $.post(urlHolder.updateDirections, {
        directions : JSON.stringify(directionsArray)
    }, function(response) {
        if (response != null) {
            console.log("updated directionResults:");
            console.log(response);

            if (response.length != 0) {
                $.each(response, function(index, key) {
                    // check expresswaysData.directionResults
                    // if exist dun add, else add

                    var exist = false;

                    $.each(expresswaysData.directionResults, function(index, dr) {
                        if (dr.id == key.id) {
                            exist = true;

                            return;
                        }
                    });

                    if (!exist) {
                        expresswaysData.directionResults.push(key);
                    }
                });
            }
        }
    });
}

function initBarChart(data) {
    $('.congContentInner').remove();

    var margin = {
        top : 70,
        right : 20,
        bottom : 50,
        left : 40
    }, width = 700 - margin.left - margin.right, height = 500 - margin.top - margin.bottom;

    var color = d3.scale.category10();

    var x = d3.scale.ordinal().rangeRoundBands([ 0, width ], .1, 1);

    var y = d3.scale.linear().range([ height, 0 ]);

    var xAxis = d3.svg.axis().scale(x).orient("bottom");

    var yAxis = d3.svg.axis().scale(y).orient("left");// .ticks(2);

    var svg = d3.select("#d3Barchart").append("svg").attr("class", "congContentInner").attr("width", width + margin.left + margin.right).attr(
            "height", height + margin.top + margin.bottom).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    x.domain(data.map(function(d) {
        return d.name;
    }));
    y.domain([ 0, d3.max(data, function(d) {
        return d.count;
    }) ]);

    svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")").call(xAxis);

    svg.append("g").attr("class", "y axis").call(yAxis).append("text").attr("transform", "rotate(-90)").attr("y", 6).attr("dy", ".71em").style(
            "text-anchor", "end").text("Congestion");

    svg.selectAll(".bar").data(data).enter().append("rect").attr("class", "bar").attr("x", function(d) {
        return x(d.name);
    }).attr("width", x.rangeBand()).attr("y", function(d) {
        return y(d.count);
    }).attr("height", function(d) {
        return height - y(d.count);
    }).attr("fill", function(d) {
        return color(d.name);
    });

    d3.select("input").on("change", change);

    var sortTimeout = setTimeout(function() {
        d3.select("input").property("checked", true).each(change);
    }, 2000);

    function change() {
        clearTimeout(sortTimeout);

        // Copy-on-write since tweens are evaluated after a delay.
        var x0 = x.domain(data.sort(this.checked ? function(a, b) {
            return b.count - a.count;
        } : function(a, b) {
            return d3.ascending(a.name, b.name);
        }).map(function(d) {
            return d.name;
        })).copy();

        var transition = svg.transition().duration(750), delay = function(d, i) {
            return i * 50;
        };

        transition.selectAll(".bar").delay(delay).attr("x", function(d) {
            return x0(d.name);
        });

        transition.select(".x.axis").call(xAxis).selectAll("g").delay(delay);
    }

}

function binExpresswayByDay(data) {
    var expressways = data.expressways;
    var directionResults = data.directionResults;

    dayArray = new Array();

    // init dayArray
    for ( var i = 0; i < 7; i++) {
        dayArray[i] = new Object();
        dayArray[i].expressways = new Array();
        dayArray[i].directionResults = new Array();
    }

    $.each(expressways, function(index, e) {
        var date = new Date(parseInt(e.startTimestamp)/* - 28800000 */);
        var day = parseInt(date.getDay());

        dayArray[day].expressways.push(e);
    });

    // for directionResults
    $.each(directionResults, function(index, dr) {
        var date = new Date(parseInt(dr.startTimestamp)/* - 28800000 */);
        var day = parseInt(date.getDay());

        dayArray[day].directionResults.push(dr);
    });

    // 0 = mon, 6 = sun
    $.each(dayArray, function(index, day) {
        dayExpresswayArray[index] = binExpressway(day);
    });

    concatDays(dayExpresswayArray);

}

function concatDays(array) {
    // check day filter checkbox and combine those days that are checked
    // 0 = mon, 6 = sun
    // console.log(array);

    var finalExpresswayArray = new Array();
    var finalExpresswayCountArray = new Array();

    finalExpresswayCountArray.expressways = new Array();
    finalExpresswayCountArray.directionResults = new Array();

    // init finalDayArray
    for ( var i = 0; i < 24; i++) {
        var expresswayObj = new Object();
        expresswayObj.PIE = 0;
        expresswayObj.BKE = 0;
        expresswayObj.AYE = 0;
        expresswayObj.SLE = 0;
        expresswayObj.TPE = 0;
        expresswayObj.ECP = 0;
        expresswayObj.KJE = 0;
        expresswayObj.KPE = 0;
        expresswayObj.CTE = 0;

        var iString = i.toString();

        if (i < 10) {
            iString = "0" + iString;
        }

        expresswayObj.hour = iString;
        expresswayObj.data = new Array();
        finalExpresswayArray.push(expresswayObj);
    }

    $("input[name=dataCongestDay]").each(function() {
        if (this.checked) {
            var day = parseInt(this.value);

            finalExpresswayCountArray.expressways = finalExpresswayCountArray.expressways.concat(dayArray[day].expressways);
            finalExpresswayCountArray.directionResults = finalExpresswayCountArray.directionResults.concat(dayArray[day].directionResults);

            // take all data from this day and put into finalExpresswayArray
            for ( var h = 0; h < 24; h++) {

                finalExpresswayArray[h].PIE += array[day][h].PIE;
                finalExpresswayArray[h].BKE += array[day][h].BKE;
                finalExpresswayArray[h].AYE += array[day][h].AYE;
                finalExpresswayArray[h].SLE += array[day][h].SLE;
                finalExpresswayArray[h].TPE += array[day][h].TPE;
                finalExpresswayArray[h].ECP += array[day][h].ECP;
                finalExpresswayArray[h].KJE += array[day][h].KJE;
                finalExpresswayArray[h].KPE += array[day][h].KPE;
                finalExpresswayArray[h].CTE += array[day][h].CTE;

                finalExpresswayArray[h].data = finalExpresswayArray[h].data.concat(array[day][h].data);
            }
        }
    });

    // recalculate
    countExpressway(finalExpresswayCountArray);
    initLineChart(finalExpresswayArray);
}

function filterPolyLine() {
    // clear table rows
    $('.congRow').remove();

    // set everything to invisible first
    $.each(polyLineArray, function(index, polyLineDay) {
        $.each(polyLineDay, function(index, polyLine) {
            polyLine.setVisible(false);
        });
    });

    $("input[name=dataCongestDay]").each(function() {
        if (this.checked) {
            var day = parseInt(this.value);

            $.each(polyLineArray[day], function(index, polyLine) {
                polyLine.setVisible(true);
            });
        }
    });
}

function filterExpressway() {
    $("input[name=dataCongestExpressway]").each(function() {
        var className = ".line" + this.value;

        if (this.checked) {
            $(className).css("visibility", 'visible');
        } else {
            $(className).css("visibility", 'hidden');
        }
    });
}

function binExpressway(data) {
    var expressways = data.expressways;
    var directionResults = data.directionResults;

    // binning method
    var expresswayArray = new Array();

    for ( var i = 0; i < 24; i++) {
        var expresswayObj = new Object();
        expresswayObj.PIE = 0;
        expresswayObj.BKE = 0;
        expresswayObj.AYE = 0;
        expresswayObj.SLE = 0;
        expresswayObj.TPE = 0;
        expresswayObj.ECP = 0;
        expresswayObj.KJE = 0;
        expresswayObj.KPE = 0;
        expresswayObj.CTE = 0;

        var iString = i.toString();

        if (i < 10) {
            iString = "0" + iString;
        }

        expresswayObj.hour = iString;
        expresswayObj.data = new Array();
        expresswayArray.push(expresswayObj);
    }

    $.each(expressways, function(index, e) {
        var expresswayName = e.name;

        if ((expresswayName).startsWith("PIE")) {
            var congestion = new Object();
            congestion.startTimestamp = e.startTimestamp;
            congestion.incidentId = e.incidentId;
            congestion.name = "PIE";

            var date = new Date(parseInt(congestion.startTimestamp)/*
                                                                     * -
                                                                     * 28800000
                                                                     */);
            var hours = parseInt(date.getHours());

            expresswayArray[hours].PIE++;
            expresswayArray[hours].data.push(congestion);
        } else if ((expresswayName).startsWith("BKE")) {
            var congestion = new Object();
            congestion.startTimestamp = e.startTimestamp;
            congestion.incidentId = e.incidentId;
            congestion.name = "BKE";

            var date = new Date(parseInt(congestion.startTimestamp)/*
                                                                     * -
                                                                     * 28800000
                                                                     */);
            var hours = parseInt(date.getHours());

            expresswayArray[hours].BKE++;
            expresswayArray[hours].data.push(congestion);
        } else if ((expresswayName).startsWith("AYE")) {
            var congestion = new Object();
            congestion.startTimestamp = e.startTimestamp;
            congestion.incidentId = e.incidentId;
            congestion.name = "AYE";

            var date = new Date(parseInt(congestion.startTimestamp)/*
                                                                     * -
                                                                     * 28800000
                                                                     */);
            var hours = parseInt(date.getHours());

            expresswayArray[hours].AYE++;
            expresswayArray[hours].data.push(congestion);
        } else if ((expresswayName).startsWith("SLE")) {
            var congestion = new Object();
            congestion.startTimestamp = e.startTimestamp;
            congestion.incidentId = e.incidentId;
            congestion.name = "SLE";

            var date = new Date(parseInt(congestion.startTimestamp)/*
                                                                     * -
                                                                     * 28800000
                                                                     */);
            var hours = parseInt(date.getHours());

            expresswayArray[hours].SLE++;
            expresswayArray[hours].data.push(congestion);
        } else if ((expresswayName).startsWith("TPE")) {
            var congestion = new Object();
            congestion.startTimestamp = e.startTimestamp;
            congestion.incidentId = e.incidentId;
            congestion.name = "TPE";

            var date = new Date(parseInt(congestion.startTimestamp)/*
                                                                     * -
                                                                     * 28800000
                                                                     */);
            var hours = parseInt(date.getHours());

            expresswayArray[hours].TPE++;
            expresswayArray[hours].data.push(congestion);
        } else if ((expresswayName).startsWith("ECP")) {
            var congestion = new Object();
            congestion.startTimestamp = e.startTimestamp;
            congestion.incidentId = e.incidentId;
            congestion.name = "ECP";

            var date = new Date(parseInt(congestion.startTimestamp)/*
                                                                     * -
                                                                     * 28800000
                                                                     */);
            var hours = parseInt(date.getHours());

            expresswayArray[hours].ECP++;
            expresswayArray[hours].data.push(congestion);
        } else if ((expresswayName).startsWith("KJE")) {
            var congestion = new Object();
            congestion.startTimestamp = e.startTimestamp;
            congestion.incidentId = e.incidentId;
            congestion.name = "KJE";

            var date = new Date(parseInt(congestion.startTimestamp)/*
                                                                     * -
                                                                     * 28800000
                                                                     */);
            var hours = parseInt(date.getHours());

            expresswayArray[hours].KJE++;
            expresswayArray[hours].data.push(congestion);
        } else if ((expresswayName).startsWith("KPE")) {
            var congestion = new Object();
            congestion.startTimestamp = e.startTimestamp;
            congestion.incidentId = e.incidentId;
            congestion.name = "KPE";

            var date = new Date(parseInt(congestion.startTimestamp)/*
                                                                     * -
                                                                     * 28800000
                                                                     */);
            var hours = parseInt(date.getHours());

            expresswayArray[hours].KPE++;
            expresswayArray[hours].data.push(congestion);
        } else if ((expresswayName).startsWith("CTE")) {
            var congestion = new Object();
            congestion.startTimestamp = e.startTimestamp;
            congestion.incidentId = e.incidentId;
            congestion.name = "CTE";

            var date = new Date(parseInt(congestion.startTimestamp)/*
                                                                     * -
                                                                     * 28800000
                                                                     */);
            var hours = parseInt(date.getHours());

            expresswayArray[hours].CTE++;
            expresswayArray[hours].data.push(congestion);
        }
    });

    // for directionResults
    $.each(directionResults, function(index, dr) {
        var expresswayName = dr.name;

        if ((expresswayName).startsWith("PIE")) {
            var congestion = new Object();
            congestion.startTimestamp = dr.startTimestamp;
            congestion.incidentId = dr.id;
            congestion.name = "PIE";

            var date = new Date(parseInt(congestion.startTimestamp)/*
                                                                     * -
                                                                     * 28800000
                                                                     */);
            var hours = parseInt(date.getHours());

            expresswayArray[hours].PIE++;
            expresswayArray[hours].data.push(congestion);
        } else if ((expresswayName).startsWith("BKE")) {
            var congestion = new Object();
            congestion.startTimestamp = dr.startTimestamp;
            congestion.incidentId = dr.id;
            congestion.name = "BKE";

            var date = new Date(parseInt(congestion.startTimestamp)/*
                                                                     * -
                                                                     * 28800000
                                                                     */);
            var hours = parseInt(date.getHours());

            expresswayArray[hours].BKE++;
            expresswayArray[hours].data.push(congestion);
        } else if ((expresswayName).startsWith("AYE")) {
            var congestion = new Object();
            congestion.startTimestamp = dr.startTimestamp;
            congestion.incidentId = dr.id;
            congestion.name = "AYE";

            var date = new Date(parseInt(congestion.startTimestamp)/*
                                                                     * -
                                                                     * 28800000
                                                                     */);
            var hours = parseInt(date.getHours());

            expresswayArray[hours].AYE++;
            expresswayArray[hours].data.push(congestion);
        } else if ((expresswayName).startsWith("SLE")) {
            var congestion = new Object();
            congestion.startTimestamp = dr.startTimestamp;
            congestion.incidentId = dr.id;
            congestion.name = "SLE";

            var date = new Date(parseInt(congestion.startTimestamp)/*
                                                                     * -
                                                                     * 28800000
                                                                     */);
            var hours = parseInt(date.getHours());

            expresswayArray[hours].SLE++;
            expresswayArray[hours].data.push(congestion);
        } else if ((expresswayName).startsWith("TPE")) {
            var congestion = new Object();
            congestion.startTimestamp = dr.startTimestamp;
            congestion.incidentId = dr.id;
            congestion.name = "TPE";

            var date = new Date(parseInt(congestion.startTimestamp)/*
                                                                     * -
                                                                     * 28800000
                                                                     */);
            var hours = parseInt(date.getHours());

            expresswayArray[hours].TPE++;
            expresswayArray[hours].data.push(congestion);
        } else if ((expresswayName).startsWith("ECP")) {
            var congestion = new Object();
            congestion.startTimestamp = dr.startTimestamp;
            congestion.incidentId = dr.id;
            congestion.name = "ECP";

            var date = new Date(parseInt(congestion.startTimestamp)/*
                                                                     * -
                                                                     * 28800000
                                                                     */);
            var hours = parseInt(date.getHours());

            expresswayArray[hours].ECP++;
            expresswayArray[hours].data.push(congestion);
        } else if ((expresswayName).startsWith("KJE")) {
            var congestion = new Object();
            congestion.startTimestamp = dr.startTimestamp;
            congestion.incidentId = dr.id;
            congestion.name = "KJE";

            var date = new Date(parseInt(congestion.startTimestamp)/*
                                                                     * -
                                                                     * 28800000
                                                                     */);
            var hours = parseInt(date.getHours());

            expresswayArray[hours].KJE++;
            expresswayArray[hours].data.push(congestion);
        } else if ((expresswayName).startsWith("KPE")) {
            var congestion = new Object();
            congestion.startTimestamp = dr.startTimestamp;
            congestion.incidentId = dr.id;
            congestion.name = "KPE";

            var date = new Date(parseInt(congestion.startTimestamp)/*
                                                                     * -
                                                                     * 28800000
                                                                     */);
            var hours = parseInt(date.getHours());

            expresswayArray[hours].KPE++;
            expresswayArray[hours].data.push(congestion);
        } else if ((expresswayName).startsWith("CTE")) {
            var congestion = new Object();
            congestion.startTimestamp = dr.startTimestamp;
            congestion.incidentId = dr.id;
            congestion.name = "CTE";

            var date = new Date(parseInt(congestion.startTimestamp)/*
                                                                     * -
                                                                     * 28800000
                                                                     */);
            var hours = parseInt(date.getHours());

            expresswayArray[hours].CTE++;
            expresswayArray[hours].data.push(congestion);
        }
    });

    // console.log("expresswayArray: ");
    // console.log(expresswayArray);

    return expresswayArray;
}

function initLineChart(data) {
    $('.congLineContentInner').remove();

    var margin = {
        top : 20,
        right : 80,
        bottom : 30,
        left : 30
    }, width = $("#d3Linechart").width() - margin.right, height = 400 - margin.top - margin.bottom;

    var x = d3.time.scale().range([ 0, width ]);

    var y = d3.scale.linear().range([ height, 0 ]);

    var parseDate = d3.time.format("%H").parse;

    var color = d3.scale.category10();

    var xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(24);

    var yAxis = d3.svg.axis().scale(y).orient("left");

    var line = d3.svg.line().interpolate("monotone").x(function(d) {
        // console.log(d);
        return x(d.hour);
    }).y(function(d) {
        // console.log(d);
        return y(d.congestion);
    });

    function xx(d) {
        // console.log("xx d: " + d);
        // console.log("x(d.hour): " + x(d.hour));
        return x(d.hour);
    }

    function yy(d) {
        // console.log("yy d: " + d);
        // console.log("y(d.congestion): " + y(d.congestion));
        return y(d.congestion);
    }

    var svg = d3.select("#d3Linechart").append("svg").attr("class", "congLineContentInner").attr("width", width + margin.left + margin.right).attr(
            "height", height + margin.top + margin.bottom).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    color.domain(d3.keys(data[0]).filter(function(key) {
        return (key !== "hour" && key !== "data");
    }));

    data.forEach(function(d) {
        // console.log(d);
        d.hour = parseDate(d.hour);
    });

    var expressways = color.domain().map(function(name) {
        return {
            name : name,
            values : data.map(function(d) {
                return {
                    hour : d.hour,
                    congestion : +d[name],
                    data : d.data.filter(function(d) {
                        return d.name == name;
                    })
                };
            })
        };
    });

    // console.log(data);
    // console.log(expressways);

    x.domain(d3.extent(data, function(d) {
        return d.hour;
    }));

    y.domain([ d3.min(expressways, function(e) {
        return d3.min(e.values, function(v) {
            return v.congestion;
        });
    }), d3.max(expressways, function(e) {
        return d3.max(e.values, function(v) {
            return v.congestion;
        });
    }) ]);

    svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")").call(xAxis);

    svg.append("g").attr("class", "y axis").call(yAxis).append("text").attr("transform", "rotate(-90)").attr("y", 6).attr("dy", ".71em").style(
            "text-anchor", "end").text("Congestion");

    var expressway = svg.selectAll(".expressway").data(expressways).enter().append("g").attr("class", "expressway");

    expressway.append("path").attr("class", function(d) {
        return ("line " + "line" + d.name);
    }).attr("d", function(d) {
        return line(d.values);
    }).style("stroke", function(d) {
        return color(d.name);
    });

    var circlePosArray = new Array();
    var div = d3.select("body").append("div").attr("id", "focus").attr("class", "tooltip").style("opacity", 0);

    $.each(expressways, function(index, expressway) {
        $.each(expressway.values, function(index, val) {
            // console.log(val);

            if (val.congestion != 0) {
                circlePosArray.push(val);
            }
        });
    });

    // console.log(circlePosArray);

    svg.selectAll("circle").data(circlePosArray).enter().append("circle").attr("style", "cursor:hand;").attr("stroke", "gray").style("stroke-width",
            "1").attr("fill", "#E5E4E2").attr("r", 4).attr("class", function(d) {
        return "line" + d.data[0].name;
    }).attr("cx", function(d) {
        // console.log("xx: " + xx(d));
        return xx(d);
    }).attr("cy", function(d) {
        // console.log("yy: " + yy(d));
        return yy(d);
    }).on(
            "mousedown",
            function(d) {
                // console.log(d.data);
                // clear table first
                $('.congRow').remove();

                var htmlString = "";

                for ( var i = 0; i < d.data.length; i++) {
                    htmlString += "<tr class='congRow' id='congRow" + (i + 1) + "'>" + "<td>" + (i + 1) + "</td>" + "<td class='congMsg' id='congRow"
                            + (i + 1) + "'>" + (d.data[i].name + " C-" + (i + 1)) + "</td>" + "</tr>";
                }

                $('#congTable tr:last').after(htmlString);

                var polyline = null;

                $('#congTable > tbody > tr > .congMsg').mouseover(function() {
                    // mouse is over row n
                    // console.log(d.data[((this.id).replace(/^\D+/g, '') -
                    // 1)].incidentId);

                    var incidentId = d.data[((this.id).replace(/^\D+/g, '') - 1)].incidentId;

                    $.each(expresswaysData.directionResults, function(index, dr) {
                        if (dr.id == incidentId) {
                            var directionsResult = JSON.parse(dr.directionsResult);

                            // "overview_path" to plot polyline
                            var paths = directionsResult.routes[0].overview_path;
                            var overview_path = new Array();

                            $.each(paths, function(index, pathObj) {
                                // create a new google latlng object for each
                                // pair of jb kb values
                                var overviewlatlng = new google.maps.LatLng(pathObj.jb, pathObj.kb);

                                overview_path.push(overviewlatlng);
                            });

                            polyline = new google.maps.Polyline({
                                path : overview_path,
                                strokeColor : '#00FF00',
                                strokeOpacity : 0.7,
                                strokeWeight : 4,
                                zIndex : 100
                            });

                            polyline.setMap(congMap);

                            return;
                        }
                    });

                });

                $('#congTable > tbody > tr > .congMsg').mouseout(function() {
                    if (polyline != null) {
                        polyline.setMap(null);
                    }
                });

            }).on("mouseover", function(d) {
        div.transition().duration(500).style("opacity", 1);
    }).on("mousemove", function(d) {
        div.html("<br>" + d.congestion).style("left", (d3.event.pageX - 34) + "px").style("top", (d3.event.pageY - 24) + "px");
    }).on("mouseout", function(d) {
        div.transition().duration(500).style("opacity", 1e-6);
    });
    ;

}