var incidentData;

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

function retrieveBetweenIncidents() {
    $("#retrieveButton").button('loading');

    $.post(urlHolder.betweenIncidents, {
        // + 8hrs in milliseconds as getTime() returns GMT time
        startTimestamp : $('#startdatetimepicker').datetimepicker('getDate').getTime() + 28800000,
        endTimestamp : $('#enddatetimepicker').datetimepicker('getDate').getTime() + 28800000
    }, function(response) {
        if (response != null) {
            // console.log(response);
            incidentData = response;
            initScatterPlot(response);

            $("#retrieveButton").button('reset');
            $(".scatterPlotInfoDiv").css("display", "block");

            // reset checkboxes to all true
            var checkboxes = document.getElementsByName("scatterPlotIncidentType");

            for ( var i = 0, n = checkboxes.length; i < n; i++) {
                checkboxes[i].checked = true;
            }
        } else {
            alert('Failure! An error has occurred retrieving Gps period!');
        }
    });
}

function toggleScatterPlotAll(source) {
    var checkboxes = document.getElementsByName("scatterPlotIncidentType");

    for ( var i = 0, n = checkboxes.length; i < n; i++) {
        checkboxes[i].checked = source.checked;
    }
}

function filterScatterPlotIncidents(checkbox) {
    // console.log(checkbox);

    if (checkbox.value == "All") {
        d3.selectAll(".scatterCircle").attr("opacity", Number(checkbox.checked));
    } else {
        // $("#selectAllScatterPlotIncidentType").attr("checked", false);

        if (checkbox.value != "Others") {
            d3.selectAll(".scatterCircle").filter(function(d) {
                return d.type == checkbox.value;
            }).attr("opacity", Number(checkbox.checked));
        } else {
            d3.selectAll(".scatterCircle").filter(function(d) {
                return (d.type != "Accident") && (d.type != "Road Work") && (d.type != "Vehicle Breakdown") && (d.type != "Heavy Traffic");
            }).attr("opacity", Number(checkbox.checked));
        }
    }
}

function initScatterPlot(data) {
    var width = 960, size = $(window).height() / 2.5, padding = 30;

    var x = d3.scale.linear().range([ padding / 2, size - padding / 2 ]);

    var y = d3.scale.linear().range([ size - padding / 2, padding / 2 ]);

    var xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(5);

    var yAxis = d3.svg.axis().scale(y).orient("left").ticks(5);

    var color = d3.scale.category10();

    parseIncidents(data);

    // data
    function parseIncidents(data) {
        // console.log(data);

        var domainByTrait = {}, traits = d3.keys(data[0]).filter(function(d) {
            return ((d == "latitude") || (d == "longitude"));
        }), n = traits.length;

        traits.forEach(function(trait) {
            domainByTrait[trait] = d3.extent(data, function(d) {
                return d[trait];
            });
        });

        xAxis.tickSize(size * n);
        yAxis.tickSize(-size * n);

        var brush = d3.svg.brush().x(x).y(y).on("brushstart", brushstart).on("brush", brushmove).on("brushend", brushend);

        d3.select(".scatterplot").remove(); // remove the old one
        var svg = d3.select("#d3Scatterplot").append("svg").attr("class", "scatterplot").attr("width", size * n + padding).attr("height",
                size * n + padding).append("g").attr("transform", "translate(" + padding + "," + padding / 2 + ")");

        svg.selectAll(".x.axis").data(traits).enter().append("g").attr("class", "x axis scatter").attr("transform", function(d, i) {
            return "translate(" + (n - i - 1) * size + ",0)";
        }).each(function(d) {
            x.domain(domainByTrait[d]);
            d3.select(this).call(xAxis);
        });

        svg.selectAll(".y.axis").data(traits).enter().append("g").attr("class", "y axis scatter").attr("transform", function(d, i) {
            return "translate(0," + i * size + ")";
        }).each(function(d) {
            y.domain(domainByTrait[d]);
            d3.select(this).call(yAxis);
        });

        var cell = svg.selectAll(".cell").data(cross(traits, traits)).enter().append("g").attr("class", "cell").attr("transform", function(d) {
            return "translate(" + (n - d.i - 1) * size + "," + d.j * size + ")";
        }).each(plot);

        // Titles for the diagonal.
        cell.filter(function(d) {
            return d.i === d.j;
        }).append("text").attr("x", padding).attr("y", padding).attr("dy", ".71em").text(function(d) {
            return d.x;
        });

        function plot(p) {
            var cell = d3.select(this);

            x.domain(domainByTrait[p.x]);
            y.domain(domainByTrait[p.y]);

            cell.append("rect").attr("class", "frame").attr("x", padding / 2).attr("y", padding / 2).attr("width", size - padding).attr("height",
                    size - padding);

            cell.selectAll("circle").data(data).enter().append("circle").attr("class", "scatterCircle").attr("value", function(d) {
                return d.type;
            }).attr("cx", function(d) {
                return x(d[p.x]);
            }).attr("cy", function(d) {
                return y(d[p.y]);
            }).attr("r", 8).style("fill", function(d) {
                // console.log(d.type + ": " + color(d.type));
                return color(d.type);
            });

            cell.call(brush);
        }

        var brushCell;

        // Clear the previously-active brush, if any.
        function brushstart(p) {
            if (brushCell !== p) {
                cell.call(brush.clear());
                x.domain(domainByTrait[p.x]);
                y.domain(domainByTrait[p.y]);
                brushCell = p;
            }
        }

        // Highlight the selected circles.
        function brushmove(p) {
            var e = brush.extent();
            svg.selectAll("circle").classed("hiddenfied", function(d) {
                return e[0][0] > d[p.x] || d[p.x] > e[1][0] || e[0][1] > d[p.y] || d[p.y] > e[1][1];
            });
        }

        // If the brush is empty, select all circles.
        function brushend() {
            if (brush.empty()) {
                svg.selectAll(".hiddenfied").classed("hiddenfied", false);
            }
        }

        function cross(a, b) {
            var c = [], n = a.length, m = b.length, i, j;
            for (i = -1; ++i < n;) {
                for (j = -1; ++j < m;) {
                    c.push({
                        x : a[i],
                        i : i,
                        y : b[j],
                        j : j
                    });
                }
            }
            return c;
        }

        d3.select(self.frameElement).style("height", size * n + padding + 20 + "px");
    }
}