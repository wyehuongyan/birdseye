var directionsService;

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

    map = new google.maps.Map(document.getElementById("congestMapContainer"), myOptions);

    var styledMapOptions = {
        name : 'Congestion'
    };

    var customMapType = new google.maps.StyledMapType(featureOpts, styledMapOptions);

    map.mapTypes.set(MY_MAPTYPE_ID, customMapType);

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
            console.log(response);
            initCongMiniMap();

            $("#congestRetrieveButton").button('reset');
            $('#loadingModal').modal('hide');

            // count the no. of congestions per expressway for bar chart display
            countExpressway(response);

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

    // add startswith function to the String prototype
    if (typeof String.prototype.startsWith != 'function') {
        // see below for better implementation!
        String.prototype.startsWith = function(str) {
            return this.indexOf(str) == 0;
        };
    }

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
    initLineChart();
}

function plotDirectionsResults(data) {
    $.each(data, function(index, dr) {
        var directionsResult = JSON.parse(dr.directionsResult);

        // console.log(directionsResult);

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
            strokeColor : '#FF0000',
            strokeOpacity : 0.3,
            strokeWeight : 4
        });

        polyline.setMap(map);
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

        directionsDisplay.setMap(map);

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

                directionsDisplay.setDirections(directionsResult);
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
            console.log("DB directions updated: " + response);
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
    }, width = 650 - margin.left - margin.right, height = 500 - margin.top - margin.bottom;

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
            "text-anchor", "end").text("Congestions");

    svg.selectAll(".bar").data(data).enter().append("rect").attr("class", "bar").attr("x", function(d) {
        return x(d.name);
    }).attr("width", x.rangeBand()).attr("y", function(d) {
        return y(d.count);
    }).attr("height", function(d) {
        return height - y(d.count);
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

function initLineChart(data) {
    var margin = {
        top : 20,
        right : 80,
        bottom : 30,
        left : 30
    }, width = 1350 - margin.left - margin.right, height = 400 - margin.top - margin.bottom;

    var parseDate = d3.time.format("%Y%m%d").parse;

    var x = d3.time.scale().range([ 0, width ]);

    var y = d3.scale.linear().range([ height, 0 ]);

    var color = d3.scale.category10();

    var xAxis = d3.svg.axis().scale(x).orient("bottom");

    var yAxis = d3.svg.axis().scale(y).orient("left");

    var line = d3.svg.line().interpolate("basis").x(function(d) {
        return x(d.date);
    }).y(function(d) {
        return y(d.temperature);
    });

    var svg = d3.select("#d3Linechart").append("svg").attr("width", width + margin.left + margin.right).attr("height",
            height + margin.top + margin.bottom).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    d3.tsv("resources/data.tsv", function(error, data) {
        color.domain(d3.keys(data[0]).filter(function(key) {
            return key !== "date";
        }));

        data.forEach(function(d) {
            d.date = parseDate(d.date);
        });

        var cities = color.domain().map(function(name) {
            return {
                name : name,
                values : data.map(function(d) {
                    return {
                        date : d.date,
                        temperature : +d[name]
                    };
                })
            };
        });

        x.domain(d3.extent(data, function(d) {
            return d.date;
        }));

        y.domain([ d3.min(cities, function(c) {
            return d3.min(c.values, function(v) {
                return v.temperature;
            });
        }), d3.max(cities, function(c) {
            return d3.max(c.values, function(v) {
                return v.temperature;
            });
        }) ]);

        svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")").call(xAxis);

        svg.append("g").attr("class", "y axis").call(yAxis).append("text").attr("transform", "rotate(-90)").attr("y", 6).attr("dy", ".71em").style(
                "text-anchor", "end").text("Temperature (ºF)");

        var city = svg.selectAll(".city").data(cities).enter().append("g").attr("class", "city");

        city.append("path").attr("class", "line").attr("d", function(d) {
            return line(d.values);
        }).style("stroke", function(d) {
            return color(d.name);
        });

        city.append("text").datum(function(d) {
            return {
                name : d.name,
                value : d.values[d.values.length - 1]
            };
        }).attr("transform", function(d) {
            return "translate(" + x(d.value.date) + "," + y(d.value.temperature) + ")";
        }).attr("x", 3).attr("dy", ".35em").text(function(d) {
            return d.name;
        });
    });
}