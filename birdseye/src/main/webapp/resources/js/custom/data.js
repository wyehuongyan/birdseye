function initPieChart() {
    var width = $("#d3PieChart").width(), height = $("#d3PieChart").width(), radius = Math.min(width, height) / 2;

    var color = d3.scale.category20();

    var pie = d3.layout.pie().value(function(d) {
        return d.count;
    }).sort(null);

    var arc = d3.svg.arc().innerRadius(radius - 100).outerRadius(radius - 20);

    var svg = d3.select("#d3PieChart").append("svg").attr("width", width).attr("height", height).append("g").attr("transform",
            "translate(" + width / 2 + "," + height / 2 + ")");

    var div = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);

    var incidentData;

    $.post(urlHolder.allIncidents, function(response) {
        if (response != null) {
            // do stuff here
            incidentData = response;

            focusFunction(incidentData);

            // find out the count of each incident type: Accident, Vehicle
            // Breakdown, Roadwork, Heavy Traffic, Others
            var numAC = new Object();
            var numVB = new Object();
            var numRW = new Object();
            var numHT = new Object();
            var numOT = new Object();

            numAC.data = new Array();
            numAC.count = 0;
            numAC.type = "Accident";

            numVB.data = new Array();
            numVB.count = 0;
            numVB.type = "Vehicle Breakdown";

            numRW.data = new Array();
            numRW.count = 0;
            numRW.type = "Road Work";

            numHT.data = new Array();
            numHT.count = 0;
            numHT.type = "Heavy Traffic";

            numOT.data = new Array();
            numOT.count = 0;
            numOT.type = "Others";

            var incidentArray = new Array();

            $.each(response, function(key, val) {
                switch (val.type) {
                case "Accident":
                    numAC.count++;
                    numAC.original = numAC.count;
                    numAC.data.push(val);

                    break;

                case "Vehicle Breakdown":
                    numVB.count++;
                    numVB.original = numVB.count;
                    numVB.data.push(val);

                    break;

                case "Road Work":
                    numRW.count++;
                    numRW.original = numRW.count;
                    numRW.data.push(val);

                    break;

                case "Heavy Traffic":
                    numHT.count++;
                    numHT.original = numHT.count;
                    numHT.data.push(val);

                    break;

                default: // others
                    numOT.count++;
                    numOT.original = numOT.count;
                    numOT.data.push(val);

                    break;
                }
            });

            console.log("Accidents: " + numAC.count);
            console.log("Vehicle Breakdowns: " + numVB.count);
            console.log("Road Works: " + numRW.count);
            console.log("Heavy Traffic: " + numHT.count);
            console.log("Others: " + numOT.count);

            numAC.value = ((numAC.count / response.length) * 100).toFixed(2);
            numVB.value = ((numVB.count / response.length) * 100).toFixed(2);
            numRW.value = ((numRW.count / response.length) * 100).toFixed(2);
            numHT.value = ((numHT.count / response.length) * 100).toFixed(2);
            numOT.value = ((numOT.count / response.length) * 100).toFixed(2);

            incidentArray.push(numAC);
            incidentArray.push(numVB);
            incidentArray.push(numRW);
            incidentArray.push(numHT);
            incidentArray.push(numOT);

            parseIncidents(incidentArray);

        } else {
            alert("An error has occurred retrieving ongoing incidents");
        }
    });

    function parseIncidents(data) {
        // console.log(data);

        var path = svg.datum(data).selectAll("path").data(pie).enter().append("path").attr("class", "pie").attr("style", "cursor:hand;").attr(
                "value", function(d, i) {
                    return data[i].value;
                }).attr("type", function(d, i) {
            return data[i].type;
        }).attr("fill", function(d, i) {
            return color(i);
        }).attr("d", arc).each(function(d) {
            this._current = d; // store the initial angles
        }).on("mouseover", mouseover).on("mousemove", mousemove).on("mouseout", mouseout).on("mousedown", mousedown);

        function mouseover() {
            div.transition().duration(500).style("opacity", 1);
        }

        function mousemove() {
            div.html(this.getAttribute("type") + "<br>" + this.getAttribute("value") + "%").style("left", (d3.event.pageX - 34) + "px").style("top",
                    (d3.event.pageY - 24) + "px");
        }

        function mouseout() {
            div.transition().duration(500).style("opacity", 1e-6);
        }

        function mousedown() {
            // change focus
            var focus = focusFunction.prototype.focus;
            var context = focusFunction.prototype.context;

            focus.select(".line").remove();
            focus.select(".area").remove();
            focus.selectAll("circle").remove();
            focus.selectAll(".axis").remove();

            context.select(".area2").remove();
            context.select(".axis").remove();
            context.select(".brush").remove();

            var incidentType = this.getAttribute("type");
            var newData;

            switch (incidentType) {
            case "Accident":
                newData = data[0].data;

                break;

            case "Vehicle Breakdown":
                newData = data[1].data;

                break;

            case "Road Work":
                newData = data[2].data;

                break;

            case "Heavy Traffic":
                newData = data[3].data;

                break;

            default: // others
                newData = data[4].data;

                break;
            }

            // call
            binning(newData);
            draw(focusFunction.prototype.bins, this.getAttribute("fill"));
        }

        d3.selectAll("input[name=dataIncidentType]").on("change", change);

        var min = 5;

        var total = 0;

        for ( var i = 0; i < data.length; i++) {
            total += parseInt(data[i].original);
        }

        function change() {
            // console.log(this.value);
            // console.log(total);

            switch (this.value) {
            case "Accident":
                if (this.checked) {
                    data[0].count = data[0].original;
                    total += data[0].original;
                    min++;
                } else {
                    data[0].count = 0;
                    total -= data[0].original;
                    min--;
                }
                break;

            case "Vehicle Breakdown":
                if (this.checked) {
                    data[1].count = data[1].original;
                    total += data[1].original;
                    min++;
                } else {
                    data[1].count = 0;
                    total -= data[1].original;
                    min--;
                }
                break;

            case "Road Work":
                if (this.checked) {
                    data[2].count = data[2].original;
                    total += data[2].original;
                    min++;
                } else {
                    data[2].count = 0;
                    total -= data[2].original;
                    min--;
                }
                break;

            case "Heavy Traffic":
                if (this.checked) {
                    data[3].count = data[3].original;
                    total += data[3].original;
                    min++;
                } else {
                    data[3].count = 0;
                    total -= data[3].original;
                    min--;
                }
                break;

            default:
                // others
                if (this.checked) {
                    data[4].count = data[4].original;
                    total += data[4].original;
                    min++;
                } else {
                    data[4].count = 0;
                    total -= data[4].original;
                    min--;
                }
                break;
            }

            // console.log(total);

            if (min > 0) {
                // update values
                data[0].value = ((data[0].count / total) * 100).toFixed(2);
                data[1].value = ((data[1].count / total) * 100).toFixed(2);
                data[2].value = ((data[2].count / total) * 100).toFixed(2);
                data[3].value = ((data[3].count / total) * 100).toFixed(2);
                data[4].value = ((data[4].count / total) * 100).toFixed(2);

                // console.log("Accident: " + data[0].value);
                // console.log("Vehicle Breakdown: " + data[1].value);
                // console.log("Road Work: " + data[2].value);
                // console.log("Heavy Traffic: " + data[3].value);
                // console.log("Others: " + data[4].value);

                svg.selectAll(".pie").attr("value", function(d, i) {
                    return data[i].value;
                });

                path = path.data(pie); // compute the new angles
                path.transition().duration(750).attrTween("d", arcTween); // redraw
                // the
                // arcs
            }
        }
    }

    // Store the displayed angles in _current.
    // Then, interpolate from _current to the new angles.
    // During the transition, _current is updated in-place by d3.interpolate.
    function arcTween(a) {
        var i = d3.interpolate(this._current, a);
        this._current = i(0);
        return function(t) {
            return arc(i(t));
        };
    }
}

var focusFunction = function(incidentData) {
    // console.log(incidentData);

    var margin = {
        top : 10,
        right : 50,
        bottom : 100,
        left : 50
    }, margin2 = {
        top : 430,
        right : 50,
        bottom : 20,
        left : 50
    };

    var width = $("#dummy").width() - margin.left - margin.right;

    focusFunction.prototype.height = 500 - margin.top - margin.bottom, focusFunction.prototype.height2 = 500 - margin2.top - margin2.bottom;

    var parseDate = d3.time.format("%b %Y").parse;

    focusFunction.prototype.x = d3.time.scale().range([ 0, width ]), focusFunction.prototype.x2 = d3.time.scale().range([ 0, width ]),
            focusFunction.prototype.y = d3.scale.linear().range([ focusFunction.prototype.height, 0 ]), focusFunction.prototype.y2 = d3.scale
                    .linear().range([ focusFunction.prototype.height2, 0 ]);

    focusFunction.prototype.xAxis = d3.svg.axis().scale(focusFunction.prototype.x).orient("bottom"), xAxis2 = d3.svg.axis().scale(
            focusFunction.prototype.x2).orient("bottom"), yAxis = d3.svg.axis().scale(focusFunction.prototype.y).orient("left");

    focusFunction.prototype.brush = d3.svg.brush().x(focusFunction.prototype.x2).on("brush", brushed);

    focusFunction.prototype.area = d3.svg.area().interpolate("monotone").x(function(d) {
        return focusFunction.prototype.x(d.date);
    }).y0(focusFunction.prototype.height).y1(function(d) {
        return focusFunction.prototype.y(d.count);
    });

    focusFunction.prototype.line = d3.svg.line().interpolate("monotone").x(function(d) {
        return focusFunction.prototype.x(d.date);
    }).y(function(d) {
        return focusFunction.prototype.y(d.count);
    });

    focusFunction.prototype.area2 = d3.svg.area().interpolate("monotone").x(function(d) {
        return focusFunction.prototype.x2(d.date);
    }).y0(focusFunction.prototype.height2).y1(function(d) {
        return focusFunction.prototype.y2(d.count);
    });

    var svg = d3.select("#d3Focus").append("svg").attr("width", width + margin.left + margin.right).attr("height",
            focusFunction.prototype.height + margin.top + margin.bottom);

    svg.append("defs").append("clipPath").attr("id", "clip").append("rect").attr("width", width).attr("height", focusFunction.prototype.height);

    focusFunction.prototype.focus = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    focusFunction.prototype.context = svg.append("g").attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

    focusFunction.prototype.bins = new Array();

    // binning and draw function calls
    binning(incidentData);
    draw(focusFunction.prototype.bins, "#D1D0CE");

    function brushed() {
        focusFunction.prototype.x.domain(focusFunction.prototype.brush.empty() ? focusFunction.prototype.x2.domain() : focusFunction.prototype.brush
                .extent());
        // focus.select("path").attr("d", area);

        focusFunction.prototype.focus.select(".line").attr("d", focusFunction.prototype.line);
        focusFunction.prototype.focus.select(".area").attr("d", focusFunction.prototype.area);
        focusFunction.prototype.focus.selectAll("circle").attr("cx", focusFunction.prototype.xx).attr("cy", focusFunction.prototype.yy);

        focusFunction.prototype.focus.select(".x.axis").call(focusFunction.prototype.xAxis);
    }

    focusFunction.prototype.xx = function(d) {
        if (d.count != 0) {
            return focusFunction.prototype.x(d.date);
        }
    };

    focusFunction.prototype.yy = function(d) {
        return focusFunction.prototype.y(d.count);
    };
}

function binning(incidentData) {
    focusFunction.prototype.bins = new Array();

    function roundMinutes(date) {

        date.setHours(date.getHours() + Math.floor(date.getMinutes() / 60));
        date.setMinutes(0);

        return date;
    }

    // bin data into hourly intervals
    var minStartTimestamp = d3.min(incidentData.map(function(d) {
        return d.startTimestamp;
    }));
    var maxStartTimestamp = d3.max(incidentData.map(function(d) {
        return d.startTimestamp;
    }));

    var bins = focusFunction.prototype.bins;

    var curStartTimestamp = roundMinutes(new Date(parseInt(minStartTimestamp))).getTime(); // cursor
    var width = 3600000; // 1 hour, in milliseconds

    while (curStartTimestamp <= maxStartTimestamp) {
        // do stuff here
        var bin = new Object();
        bin.data = new Array();
        bin.count = 0;
        bin.minDate = parseInt(curStartTimestamp);

        // -1 millisec i.e 2359
        bin.maxDate = parseInt(curStartTimestamp) + width - 1;
        bin.range = width;

        // prepare for next bin
        curStartTimestamp = parseInt(curStartTimestamp) + width;

        bins.push(bin); // add cur bin into bins array
    }

    // don't forget about the last bin
    // curStartTimestamp to maxStartTimestamp
    var bin = new Object();
    bin.data = new Array();
    bin.count = 0;
    bin.minDate = curStartTimestamp - width;
    bin.maxDate = parseInt(maxStartTimestamp);
    bin.range = bin.maxDate - bin.minDate;

    bins.push(bin); // push last bin in

    // see which bin does each incident fall into
    $.each(incidentData, function(key, incident) {
        var startTimestamp = parseInt(incident.startTimestamp);

        for ( var i = 0; i < bins.length; i++) {
            if ((startTimestamp <= bins[i].maxDate) && (startTimestamp >= bins[i].minDate)) {
                // within bin range
                bins[i].count++;
                bins[i].data.push(incident);

                break;
            }
        }
    });

    // console.log(bins);
}

function draw(data, color) {
    data.forEach(function(d) {
        var date = new Date(d.minDate);
        d.date = date;
    });

    var x = focusFunction.prototype.x;
    var y = focusFunction.prototype.y;

    var x2 = focusFunction.prototype.x2;
    var y2 = focusFunction.prototype.y2;

    var focus = focusFunction.prototype.focus;
    var context = focusFunction.prototype.context;

    var area = focusFunction.prototype.area;
    var area2 = focusFunction.prototype.area2;
    var line = focusFunction.prototype.line;

    var height = focusFunction.prototype.height, height2 = focusFunction.prototype.height2;
    var xAxis = focusFunction.prototype.xAxis;

    var brush = focusFunction.prototype.brush;

    var div = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);

    // calculating the x and y axis ranges
    x.domain(d3.extent(data.map(function(d) {
        return d.date;
    })));
    y.domain([ 0, d3.max(data.map(function(d) {
        return d.count + 1; // +1 because some circles are being cut off
    })) ]);
    x2.domain(x.domain());
    y2.domain(y.domain());

    // area, line and circle for focus
    focus.append("path").datum(data).attr("class", "area").attr("clip-path", "url(#clip)").attr("d", area).attr("fill", color);
    focus.append("path").datum(data).attr("class", "line").attr("clip-path", "url(#clip)").attr("d", line);

    focus.selectAll("circle").data(data).enter().append("circle").attr("clip-path", "url(#clip)").attr("style", "cursor:hand;")
            .attr("stroke", "gray").style("stroke-width", "1").attr("fill", "#E5E4E2").attr("r", 4).attr("cx", xx).attr("cy", yy).on(
                    "mousedown",
                    function(d) {
                        // console.log(d.data);
                        // clear table first
                        $('.infoRow').remove();

                        var htmlString = "";

                        for ( var i = 0; i < d.data.length; i++) {
                            htmlString += "<tr class='infoRow' id='row" + (i + 1) + "'>" + "<td>" + (i + 1) + "</td>" + "<td>"
                                    + (new Date(parseInt(d.data[i].startTimestamp))).toString() + "</td>" + "<td>" + d.data[i].message + "</td>"
                                    + "<td>" + (d.data[i].timeElapsed.replace("PT", "").replace("S", "")).toHHMMSS() + "</td>" + "</tr>";
                        }

                        $('#infoTable tr:last').after(htmlString);
                    }).on("mouseover", function(d) {
                div.transition().duration(500).style("opacity", 1);
            }).on("mousemove", function(d) {
                div.html("<br>" + d.data.length).style("left", (d3.event.pageX - 34) + "px").style("top", (d3.event.pageY - 24) + "px");
            }).on("mouseout", function(d) {
                div.transition().duration(500).style("opacity", 1e-6);
            });

    // x and y axis for focus
    focus.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")").call(xAxis);

    focus.append("g").attr("class", "y axis").call(yAxis);

    // area2 for context
    context.append("path").datum(data).attr("class", "area2").attr("d", area2).attr("fill", color);

    // x axis for context
    context.append("g").attr("class", "x axis").attr("transform", "translate(0," + height2 + ")").call(xAxis2);

    context.append("g").attr("class", "x brush").call(brush).selectAll("rect").attr("y", -6).attr("height", height2 + 7);

    function xx(d) {
        if (d.count != 0) {
            return focusFunction.prototype.x(d.date);
        }
    }

    function yy(d) {
        return focusFunction.prototype.y(d.count);
    }

}

String.prototype.toHHMMSS = function() {
    var sec_num = parseInt(this, 10); // don't forget the second parm
    var hours = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours < 10) {
        hours = "0" + hours;
    }
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    if (seconds < 10) {
        seconds = "0" + seconds;
    }
    var time = hours + ':' + minutes + ':' + seconds;
    return time;
}