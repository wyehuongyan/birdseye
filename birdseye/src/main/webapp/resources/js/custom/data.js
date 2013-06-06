function initData() {
    var width = 400, height = 400, radius = Math.min(width, height) / 2;

    var color = d3.scale.category20();

    var pie = d3.layout.pie().value(function(d) {
        return d.count;
    }).sort(null);

    var arc = d3.svg.arc().innerRadius(radius - 100).outerRadius(radius - 20);

    var svg = d3.select("#d3").append("svg").attr("width", width).attr("height", height).append("g").attr("transform",
            "translate(" + width / 2 + "," + height / 2 + ")");

    var div = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);

    $.post(urlHolder.allIncidents, function(response) {
        if (response != null) {
            // do stuff here

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
        console.log(data);

        var path = svg.datum(data).selectAll("path").data(pie).enter().append("path").attr("type", function(d, i) {
            return data[i].type;
        }).attr("fill", function(d, i) {
            return color(i);
        }).attr("d", arc).each(function(d) {
            this._current = d; // store the initial angles
        }).on("mouseover", mouseover).on("mousemove", mousemove).on("mouseout", mouseout);

        function mouseover() {
            div.transition().duration(500).style("opacity", 1);
        }

        function mousemove() {
            div.text(this.getAttribute("type")).style("left", (d3.event.pageX - 34) + "px").style("top", (d3.event.pageY - 24) + "px");
        }

        function mouseout() {
            div.transition().duration(500).style("opacity", 1e-6);
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