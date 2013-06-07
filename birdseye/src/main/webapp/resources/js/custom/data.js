function initPieChart() {
    var width = 400, height = 400, radius = Math.min(width, height) / 2;

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

            numAC.count = 0;
            numAC.type = "Accident";

            numVB.count = 0;
            numVB.type = "Vehicle Breakdown";

            numRW.count = 0;
            numRW.type = "Road Work";

            numHT.count = 0;
            numHT.type = "Heavy Traffic";

            numOT.count = 0;
            numOT.type = "Others";

            var incidentArray = new Array();

            $.each(response, function(key, val) {
                switch (val.type) {
                case "Accident":
                    numAC.count++;
                    numAC.original = numAC.count;

                    break;

                case "Vehicle Breakdown":
                    numVB.count++;
                    numVB.original = numVB.count;

                    break;

                case "Road Work":
                    numRW.count++;
                    numRW.original = numRW.count;

                    break;

                case "Heavy Traffic":
                    numHT.count++;
                    numHT.original = numHT.count;

                    break;

                default:
                    numOT.count++;
                    numOT.original = numOT.count;
                    // others

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

        var path = svg.datum(data).selectAll("path").data(pie).enter().append("path").attr("value", function(d, i) {
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
            focusFunction.binning(incidentData.slice(0, 10));
        }

        d3.selectAll("input[name=dataIncidentType]").on("change", change);

        var min = 5;

        function change() {
            // console.log(this.value);

            switch (this.value) {
            case "Accident":
                if (this.checked) {
                    data[0].count = data[0].original;
                    min++;
                } else {
                    data[0].count = 0;
                    min--;
                }
                break;

            case "Vehicle Breakdown":
                if (this.checked) {
                    data[1].count = data[1].original;
                    min++;
                } else {
                    data[1].count = 0;
                    min--;
                }
                break;

            case "Road Work":
                if (this.checked) {
                    data[2].count = data[2].original;
                    min++;
                } else {
                    data[2].count = 0;
                    min--;
                }
                break;

            case "Heavy Traffic":
                if (this.checked) {
                    data[3].count = data[3].original;
                    min++;
                } else {
                    data[3].count = 0;
                    min--;
                }
                break;

            default:
                // others
                if (this.checked) {
                    data[4].count = data[4].original;
                    min++;
                } else {
                    data[4].count = 0;
                    min--;
                }
                break;
            }

            if (min > 0) {
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
        right : 10,
        bottom : 100,
        left : 50
    }, margin2 = {
        top : 430,
        right : 10,
        bottom : 20,
        left : 50
    }, width = 960 - margin.left - margin.right, height = 500 - margin.top - margin.bottom, height2 = 500 - margin2.top - margin2.bottom;

    var parseDate = d3.time.format("%b %Y").parse;

    var x = d3.time.scale().range([ 0, width ]), x2 = d3.time.scale().range([ 0, width ]), y = d3.scale.linear().range([ height, 0 ]), y2 = d3.scale
            .linear().range([ height2, 0 ]);

    var xAxis = d3.svg.axis().scale(x).orient("bottom"), xAxis2 = d3.svg.axis().scale(x2).orient("bottom"), yAxis = d3.svg.axis().scale(y).orient(
            "left");

    var brush = d3.svg.brush().x(x2).on("brush", brushed);

    var area = d3.svg.area().interpolate("monotone").x(function(d) {
        return x(d.date);
    }).y0(height).y1(function(d) {
        return y(d.count);
    });

    var line = d3.svg.line().interpolate("monotone").x(function(d) {
        return x(d.date);
    }).y(function(d) {
        return y(d.count);
    });

    var area2 = d3.svg.area().interpolate("monotone").x(function(d) {
        return x2(d.date);
    }).y0(height2).y1(function(d) {
        return y2(d.count);
    });

    var svg = d3.select("#d3Focus").append("svg").attr("width", width + margin.left + margin.right).attr("height",
            height + margin.top + margin.bottom);

    svg.append("defs").append("clipPath").attr("id", "clip").append("rect").attr("width", width).attr("height", height);

    var focus = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var context = svg.append("g").attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

    var bins = new Array();

    binning(incidentData);
    draw(bins);

    function binning(incidentData) {
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

    function draw(data) {
        data.forEach(function(d) {
            var date = new Date(d.minDate);
            d.date = date;
        });

        x.domain(d3.extent(data.map(function(d) {
            return d.date;
        })));
        y.domain([ 0, d3.max(data.map(function(d) {
            return d.count;
        })) ]);
        x2.domain(x.domain());
        y2.domain(y.domain());

        focus.append("path").datum(data).attr("class", "area").attr("clip-path", "url(#clip)").attr("d", area).attr("fill", "steelblue");
        focus.append("path").datum(data).attr("class", "line").attr("clip-path", "url(#clip)").attr("d", line);

        focus.selectAll("circle").data(data).enter().append("circle").attr("clip-path", "url(#clip)").attr("fill", "#B8B8B8").attr("r", 4).attr("cx",
                xx).attr("cy", yy).on("mousedown", function(d) {
            console.log(d.data);
        });

        focus.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")").call(xAxis);

        focus.append("g").attr("class", "y axis").call(yAxis);

        context.append("path").datum(data).attr("d", area2).attr("fill", "steelblue");

        context.append("g").attr("class", "x axis").attr("transform", "translate(0," + height2 + ")").call(xAxis2);

        context.append("g").attr("class", "x brush").call(brush).selectAll("rect").attr("y", -6).attr("height", height2 + 7);
    }

    function xx(d) {
        if (d.count != 0) {
            return x(d.date);
        }
    }

    function yy(d) {
        return y(d.count);
    }

    function brushed() {
        x.domain(brush.empty() ? x2.domain() : brush.extent());
        // focus.select("path").attr("d", area);

        focus.select(".line").attr("d", line);
        focus.select(".area").attr("d", area);
        focus.selectAll("circle").attr("cx", xx).attr("cy", yy);

        focus.select(".x.axis").call(xAxis);
    }
}