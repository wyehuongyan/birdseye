<%@ taglib uri='http://java.sun.com/jsp/jstl/core' prefix='c' %>

<c:url value="/gps/get" var="getGpsUrl"/>
<c:url value="/gps/get/period" var="getGpsPeriodUrl"/>
<c:url value="/traffic/incidents/ongoing" var="ongoingIncidentsUrl"/>

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Bird's Eye</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="">
    <meta name="author" content="">

	<!-- Le javascript -->
	<script type='text/javascript' src='<c:url value="/resources/js/jquery-1.9.1.js"/>'></script>
    <script type='text/javascript' src='<c:url value="/resources/js/jquery-ui-1.10.0.custom.js"/>'></script>
    <script type='text/javascript' src='<c:url value="/resources/js/jquery-ui-timepicker-addon.js"/>'></script>
	<script type='text/javascript' src='<c:url value="/resources/js/bootstrap.js"/>'></script>
	<script type="text/javascript" src='<c:url value="https://maps.googleapis.com/maps/api/js?key=AIzaSyDn1xjmKkgF7KL8Y6txLXmsrJIc7nzTDSo&libraries=places&sensor=false"/>'></script>
    <script type="text/javascript" src="<c:url value="/resources/js/jquery.tmpl.js"/>"></script>
    <script type="text/javascript" src="<c:url value="/resources/js/jquery.validate.js"/>"></script>
    <script type="text/javascript" src="<c:url value="/resources/js/validation.js"/>"></script>

    <!-- Le styles -->
    <link rel='stylesheet' type='text/css' media='screen' href='<c:url value="/resources/css/bootstrap.css"/>'/>
    <link rel='stylesheet' type='text/css' media='screen' href='<c:url value="/resources/css/jquery-ui-1.10.0.custom.css"/>'/>
    <link rel='stylesheet' type='text/css' media='screen' href='<c:url value="/resources/css/jquery-ui-timepicker-addon.css"/>'/>
    
    <style type="text/css">
      body {
        overflow: hidden;
      }
    
      .frame {
        overflow: hidden;
        padding-top: 60px;
      }
      .sidebar-nav {
        padding: 9px 0;
      }
      
      .form-elem {
        float: right;
      }
      
      .container {
    	display: inline-block;
   	 	position: relative;
   		width: 100%;
   		height: 100%;
	  }
	   
      #dummy {
	    padding-top: 140%; /* old value: 60% */
	  }
	   
      #map_canvas {
	    position: absolute;
	    top: 0;
	    bottom: 55%; /* old value = 0 */
	    left: 0;
	    right: 0;
	    background-color: silver; /* show me! */
        border:2px solid gray;
	    max-width: none;
	  }
    
      #map_canvas2 {
        position: absolute;
        top: 55%; /* old value = 0 */
        bottom: 0; 
        left: 0;
        right: 0;
        background-color: silver; /* show me! */
        border:2px solid gray;
        max-width: none;
      }
    
      img {
        max-width: none;
      }
    </style>

    <!-- HTML5 shim, for IE6-8 support of HTML5 elements -->
    <!--[if lt IE 9]>
      <script src="http://html5shim.googlecode.com/svn/trunk/html5.js"></script>
    <![endif]-->
    <script type="text/javascript">
    var urlHolder = new Object();
    
    var map, map2;
    var trafficLayer;
    var geocoder;
    var fromautocomplete, toautocomplete;
    var fromlatlng, tolatlng;
    
    var directionsService;
    var directionsDisplay;
    
    var markerArray = new Array();
    var incidentArray = new Array();
    var latlngArray;
    
    function initializeMap() {
        var mapOptions = {
            center : new google.maps.LatLng(1.352083, 103.819836),
            zoom : 12,
            mapTypeId : google.maps.MapTypeId.ROADMAP
        };
        
        map = new google.maps.Map(document.getElementById("map_canvas"),
                mapOptions); 
        
        // custom heatmap
        var MY_MAPTYPE_ID = "custom_heatmap";
        
        var featureOpts = [
            {
                 "stylers": [
                     { "saturation": -100 },
                     { "gamma": 1.2 },
                     { "lightness": 15 }
                 ]
            }
        ];
        
        var mapOptions2 = {
                center : new google.maps.LatLng(1.352083, 103.819836),
                zoom : 12,
                mapTypeId : MY_MAPTYPE_ID,
                mapTypeControlOptions: {
                    mapTypeIds: [google.maps.MapTypeId.ROADMAP, MY_MAPTYPE_ID]
                },
            };
        
        map2 = new google.maps.Map(document.getElementById("map_canvas2"),
                mapOptions2); 
        
        var styledMapOptions = {
                name: 'Heatmap'
        };

        var customMapType = new google.maps.StyledMapType(featureOpts, styledMapOptions);
        
        map2.mapTypes.set(MY_MAPTYPE_ID, customMapType);
        
        // other google apis initialization
        geocoder = new google.maps.Geocoder();
        
        trafficLayer = new google.maps.TrafficLayer();
        trafficLayer.setMap(map);
        
        directionsService = new google.maps.DirectionsService();
        directionsDisplay = new google.maps.DirectionsRenderer();
        
        directionsDisplay.setMap(map);
        directionsDisplay.setPanel(document.getElementById("directionsDiv"));
    }
    
    function calcRoute() {
        var travelMode = document.getElementById("travelmodeDDL").value; 
        var avoidHighways = document.getElementById("avoidhighwaysCheckbox");
        var avoidTolls = document.getElementById("avoidtollsCheckbox");
        var threshold = 2;
        
        var request = {
          origin: fromlatlng,
          destination: tolatlng,
          travelMode: google.maps.TravelMode[travelMode],
          provideRouteAlternatives: false,
          avoidHighways: avoidHighways.checked,
          avoidTolls: avoidTolls.checked
        };
        
        // call to google direction service api
        directionsService.route(request, function(directionsResult, status) {
            console.log(status);
            
            if (status == google.maps.DirectionsStatus.OK) {
                directionsDisplay.setDirections(directionsResult);
                
                // reset all incidents' near attribute to false everytime a new direction result is received
                $.each(incidentArray, function(key, incident) {
                    incident.near = false;
                });
                
                // retrieve the route object and extract all the latlngs that makes up the path
                var directionsRoutes = directionsResult.routes;
                console.log(directionsRoutes);
                
                latlngArray = directionsRoutes[0].overview_path;
                
                // latlngArray will be used to check distance between incidents and path //
                // to determine which are the 'relevant' incidents close to the path
                $.each(latlngArray, function(key, latlng) {
                    // check with each incident in incidentArray
                    $.each(incidentArray, function(key, incident) {
                        // sameple incident only if it has not been marked as near the path
                        if(!incident.near) {
                            // use haversine formula and see if returned result > custom threshold
                            var distance = getDistanceFromLatLonInKm(latlng.lat(), latlng.lng(), incident.marker.getPosition().lat(), incident.marker.getPosition().lng())
  
                            // console.log("distance: " +distance);
                            
                            if(distance <= threshold) {
                                // if distance within threshold of planned path
                                // incident.marker.setVisible(true); // show the marker
                                
                                // do not sample the marker again
                                incident.near = true;
                            }
                            else {
                                // hide the marker
                                // incident.marker.setVisible(false);
                            }
                        }
                    });
                });
                
                // console.log(latlngArray);
                
                // expand the accordion to show directionResults
                $('#collapseIncident').collapse('hide');
                $('#collapseDirection').collapse('show');
                
                $('#relevantCheckBox').prop('disabled', false); // allow the checkbox to be checked
            }  else if(status == google.maps.DirectionsStatus.ZERO_RESULTS) {
                alert("There are no routes");
            }
        });
    }
    
    // Haversine formula: calculates great-circle distances between the two points
    function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
        var R = 6371; // Radius of the earth in km
        var dLat = deg2rad(lat2-lat1);  // deg2rad below
        var dLon = deg2rad(lon2-lon1); 
        
        var a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2); 
      
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        var d = R * c; // Distance in km
      
        return d;
    }
    
    function deg2rad(deg) {
        return deg * (Math.PI/180)
    }
    
    // end of haversine formula
    
    function showNearIncidents() {
        $.each(incidentArray, function(key, incident){
           if(incident.near) {
               incident.marker.setVisible(true);
           } 
           else {
               incident.marker.setVisible(false);
           }
        });
    }
    
    function showAllIncidents() {
        $.each(incidentArray, function(key, incident){
            incident.marker.setVisible(true);
        });
    }
    
    function initializeUI() {
    	// jquery ui elements	    
	    var startDateTextBox = $('#startdatetimepicker');
	    var endDateTextBox = $('#enddatetimepicker');

	    startDateTextBox.datetimepicker({
	    	minDate: new Date(2009, 9, 1, 0, 0),
	    	maxDate: new Date(2010, 4, 31, 0, 0),
	    	dateFormat: "D MM d yy",
	    	separator: ' @ ',
	    	defaultDate: new Date(startDateTextBox.datepicker( "option", "minDate" )),
	    	onClose: function(dateText, inst) {
	    		if (endDateTextBox.val() != '') {
	    			var testStartDate = startDateTextBox.datetimepicker('getDate');
	    			var testEndDate = endDateTextBox.datetimepicker('getDate');
	    			
	    			if (testStartDate > testEndDate)
	    				endDateTextBox.datetimepicker('setDate', testStartDate);
	    		}
	    		else {
	    			//endDateTextBox.val(dateText);
	    			endDateTextBox.datetimepicker('setDate', dateText);
	    		}
	    	},
	    	onSelect: function (selectedDateTime){
	    		endDateTextBox.datetimepicker('option', 'minDate', startDateTextBox.datetimepicker('getDate') );
	    	}
	    });
	    endDateTextBox.datetimepicker({ 
	    	minDate: new Date(2009, 9, 1, 0, 0),
	    	maxDate: new Date(2010, 4, 31, 0, 0),
	    	dateFormat: "D MM d yy",
	    	separator: ' @ ',
	    	onClose: function(dateText, inst) {
	    		if (startDateTextBox.val() != '') {
	    			var testStartDate = startDateTextBox.datetimepicker('getDate');
	    			var testEndDate = endDateTextBox.datetimepicker('getDate');
	    			if (testStartDate > testEndDate)
	    				startDateTextBox.datetimepicker('setDate', testEndDate);
	    		}
	    		else {
	    			//startDateTextBox.val(dateText);
	    			startDateTextBox.datetimepicker('setDate', dateText);
	    		}
	    	},
	    	onSelect: function (selectedDateTime){
	    		startDateTextBox.datetimepicker('option', 'maxDate', endDateTextBox.datetimepicker('getDate') );
	    	}
	    });
    }
	
	function initializePlaces() {
	    // Google places API
        var fromdirection = document.getElementById("fromdirection");
        var todirection = document.getElementById("todirection");
        
        // bind autocomplete to desired textfield
        fromautocomplete = new google.maps.places.Autocomplete(fromdirection);
        toautocomplete = new google.maps.places.Autocomplete(todirection);
        
        // listener functions
        google.maps.event.addListener(fromautocomplete, 'place_changed', function() {
            fromdirection.className = '';
            
            var place = fromautocomplete.getPlace();
            
            if (!place.geometry) {
                // Inform the user that the place was not found and return.
                fromdirection.className = 'notfound';
                return;
                
            }
            
            if (place.geometry.viewport) {
                map.fitBounds(place.geometry.viewport);
              
            } else {
                map.setCenter(place.geometry.location);
                map.setZoom(15);  // Why 17? Because it looks good.
              
            }
            
            // store starting location latlng into fromlatlng
            fromlatlng = place.geometry.location;
            
            console.log(place.geometry.location);
            console.log("source: %s \nlat: %s \nlong: %s", place.formatted_address, place.geometry.location.jb, place.geometry.location.kb);
        });
        
        google.maps.event.addListener(toautocomplete, 'place_changed', function() {
            toautocomplete.className = '';
            
            var place = toautocomplete.getPlace();
            
            if (!place.geometry) {
                // Inform the user that the place was not found and return.
                toautocomplete.className = 'notfound';
                return;
                
            }
            
            if (place.geometry.viewport) {
                map.fitBounds(place.geometry.viewport);
                
            } else {
                map.setCenter(place.geometry.location);
                map.setZoom(15);  // Why 17? Because it looks good.
                        
            }
            
            // store destination latlng into tolatlng
            tolatlng = place.geometry.location;
            
            console.log(place.geometry.location);
            console.log("destination: %s \nlat: %s \nlong: %s", place.formatted_address, place.geometry.location.jb, place.geometry.location.kb);
        });
	}
	
	function setLoadingBar(progress, msg) {
		if(progress != null && progress != "") {
			$("#loadprogress").width(progress); 
		}
		
		$("#loadmsg").html(msg);
	}
	
	function filterIncidents() {
	    // called when checkbox onchange events occur
        $("input[name=incidentType]").each(function() {
            for(var i=0; i < incidentArray.length; i++){
                if($("#relevantCheckBox").is(":checked"))
                {
                    if(incidentArray[i].near) {
                        if(this.value != "Others") {
                            if(incidentArray[i].data.type == this.value) {
                                incidentArray[i].marker.setVisible(this.checked);
                            }
                        }
                        else {
                            if(incidentArray[i].data.type != "Accident" &&
                               incidentArray[i].data.type != "Road Work" &&
                               incidentArray[i].data.type != "Vehicle Breakdown" &&
                               incidentArray[i].data.type != "Heavy Traffic") {
                                incidentArray[i].marker.setVisible(this.checked);
                            }
                        }
                    }
                } else {
                    if(this.value != "Others") {
                        if(incidentArray[i].data.type == this.value) {
                            incidentArray[i].marker.setVisible(this.checked);
                        }
                    }
                    else {
                        if(incidentArray[i].data.type != "Accident" &&
                           incidentArray[i].data.type != "Road Work" &&
                           incidentArray[i].data.type != "Vehicle Breakdown" &&
                           incidentArray[i].data.type != "Heavy Traffic") {
                            incidentArray[i].marker.setVisible(this.checked);
                        }
                    }
                }         
            }
        });
	}
	
  	function retrieveOngoingIncidents() {
  	    // post request to server to retrieve all ongoing incidents
  	    $.post(urlHolder.ongoingIncidents, function(response) {
  	        if(response != null) {
  	            // do stuff here
  	            parseIncidents(response);
  	        } else {
  	            alert("An error has occurred retrieving ongoing incidents");
  	        }
  	    });
  	}
	
	function retrieveGpsPeriod() {
		$("#loadModal").modal('show');
		
		setLoadingBar("10%", "Querying DB...");
		
		$.post(urlHolder.gpsperiod, {
				startTimestamp: $('#startdatetimepicker').datetimepicker('getDate').getTime()/1000,
				endTimestamp: $('#enddatetimepicker').datetimepicker('getDate').getTime()/1000,
				userid: "002"
			}, 
			function(response) {
				if (response != null) {
					setLoadingBar("30%", "Parsing Data...");
					//alert("Success!\n" +response);
					
					setTimeout(function() {
						parseGps(response);
					}, 2000);
					
				} else {
					alert('Failure! An error has occurred retrieving Gps period!');
					
					setLoadingBar(null, "Error in AJAX Request");
					$("#loadModal").modal('hide');
				}
			}
		);
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
				alert("Error " + "\njqXHR: " + jqXHR + "\ntextStatus: "
						+ textStatus + "\nerrorThrown: " + errorThrown);
			},

			complete : function(jqXHR, textStatus) {

			}
		});
	}
	
	function parseIncidents(data) {
	    // clear markers first
        map.clearMarkers();
	    map.clearIncidents();
	    
	    var icons = {
	            "Accident" : {
	                icon: "./resources/icons/accident.png"
	            },
	            "Road Work" : {
	                icon: "./resources/icons/road_work.png"
	            },
	            "Vehicle Breakdown" : {
	                icon: "./resources/icons/vehicle_breakdown.png"
	            },
	            "Heavy Traffic" : {
	                icon: "./resources/icons/heavy_traffic.png"
	            },
	            "Unattended Vehicle" : {
	                icon: "./resources/icons/others.png"
	            },
	            "Obstacle" : {
                    icon: "./resources/icons/others.png"
                }
	    };
        
        $.each(data, function(key, val) {
            // console.log("id: " +val.id+ "\nlongitude: " +val.longitude+ "\nlatitude: " +val.latitude);
            var incident = new Object();
            incident.data = val;
            
            // google maps marker stuff //
            var marker = new google.maps.Marker({
                position: new google.maps.LatLng(val.latitude, val.longitude),
                icon: icons[val.type].icon,
                map: map,
                title: val.type
            });
            
            var infowindow = new google.maps.InfoWindow({
                content: val.message,
                maxWidth: 200
            });
            
            // marker click listener
            google.maps.event.addListener(marker, 'click', function() {
                // map.setZoom(15);
                // map.setCenter(marker.getPosition());
                
                // open corresponding info window
                infowindow.open(map, marker);
            });
            
            // marker visible changed listener
            google.maps.event.addListener(marker, 'visible_changed', function() {                
                // open corresponding info window
                if(!marker.getVisible()) {
                    infowindow.close();
                }
            });
            // end of google maps marker stuff //
            
            // set markers to invisible at first
            // marker.setVisible(false);
            
            incident.marker = marker;
            incident.infowindow = infowindow;
            incident.near = false; // near attribute signifies that it is near the planned path
            
            incidentArray.push(incident);
            markerArray.push(marker);
        });
        
        // console.log("Coordinates Parsed.");
        console.log("no. of markers: " +incidentArray.length);
	}
	
	function parseGps(data) {
		// clear markers first
		map.clearMarkers();
		
		setLoadingBar("80%", "Plotting...");
		
		$.each(data, function(key, val) {
			// console.log("id: " +val.id+ "\nlongtitude: " +val.longtitude+ "\nlatitude: " +val.latitude);
			var marker = new google.maps.Marker({
	            position: new google.maps.LatLng(val.latitude, val.longtitude),
	            map: map
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
	
	google.maps.Map.prototype.clearMarkers = function() {
	    for(var i=0; i < markerArray.length; i++){
	        markerArray[i].setMap(null);
	    }
	    
	    markerArray = new Array();
	};
	
	google.maps.Map.prototype.clearIncidents = function() {
	    for(var i=0; i < incidentArray.length; i++){
	        incidentArray[i].marker.setMap(null);
        }
	    
	    incidentArray = new Array();
	}
	
	function toggleAll(source) {
	    checkboxes = document.getElementsByName("incidentType");
	    
	    for(var i=0, n=checkboxes.length;i<n;i++) {
	      checkboxes[i].checked = source.checked;
	    }
	    
	    filterIncidents();
	}
	
	$(document).ready(function() {
		urlHolder.gps = '${getGpsUrl}';
		urlHolder.gpsperiod = '${getGpsPeriodUrl}';
		urlHolder.ongoingIncidents = '${ongoingIncidentsUrl}';

		initializeMap();
		initializePlaces();
		initializeUI();
		setupFormValidation();
		
		// retrieve the latest incidents
		retrieveOngoingIncidents();
		
		$('#loadModal').modal({
			keyboard: false,
			backdrop: "static",
			show: false
		});
		
		$('#collapseDirection').collapse({
		    toggle: false
		});
		  
	    $('#collapseIncident').collapse({
	        toggle: false
        });
		
		$('#loadModal').on('hidden', function () {
		});
	
		// event listener for checkbox
		$("#relevantCheckBox").click(function() {
            if($(this).is(":checked"))
            {
                showNearIncidents();
            } else {
                showAllIncidents();
            }
        });
		
		// event listeners for accordion
		$('#collapseIncident').on('show', function () {
		    $('#collapseDirection').collapse('hide');
		    
		    // no. of accidents shown depends on relevantCheckBox value
		    if($("#relevantCheckBox").is(":checked"))
            {
                showNearIncidents();
            } else {
                showAllIncidents();
            }
		});
		
		$('#collapseDirection').on('show', function () {
            $('#collapseIncident').collapse('hide');
        });
		
		// event listeners for tabs
		$('a[data-toggle="tab"]').on('shown', function (e) {
          var active = $($(e.target).attr('href')).attr('id');
          
          if(active == "analyticsTab") {
              scrollToPos('.analyticsmap', -60, 200);
          } else {
              scrollToPos('.top', "0", 200);
          }
        });
        
		// prevent accidentally submission of form via enter keypress
		$(window).keydown(function(event){
		    if(event.keyCode == 13) {
		      event.preventDefault();
		      return false;
		    }
		});
		
		// dom elements lose their width when they are affixed
		// this function helps to ensure they do not mess up the UI
		affixWidth();
		
		if (typeof latlngArray === "undefined") {
		    console.log("latlngArray is undefined");
		}
		
		// set directions accordion collapsed height
		$('#directionsDiv').height(($(window).height())/3);
	});
	
	function affixWidth() {
	    // ensure the affix element maintains it width
	    var affix = $('#panel');
	    var width = affix.width();
	    affix.width(width);
	}
	
	function scrollToPos(pos, offset, delay) {  
	    $('html, body').animate({
	        scrollTop: $(pos).offset().top + offset
	     }, delay);
	}
	
	</script>
    
    <script id="modalTemplate" type="text/x-jquery-tmpl">
		<div id="myModal" class="modal hide fade">
			<div class="modal-body">
				<center>
					<div class="progress progress-striped active">
  						<div id="loadprogress" class="bar" style="width:0%;"></div>
					</div>
					
					<h5>\${status}</h5>
				</center>
			</div>
		</div>
	</script>
  </head>

  <body>
    <div class="frame top">
      <div class="navbar navbar-inverse navbar-fixed-top">
        <div class="navbar-inner">
          <div class="container-fluid">
            <a class="btn btn-navbar" data-toggle="collapse" data-target=".nav-collapse">
              <span class="icon-bar"></span>
              <span class="icon-bar"></span>
              <span class="icon-bar"></span>
            </a>
            <a class="brand" href="#">Bird's Eye</a>
            <div class="nav-collapse collapse">
              <p class="navbar-text pull-right">
                &copy <a href="mailto:whyan1@e.ntu.edu.sg" class="navbar-link">whyan1</a> 2013
              </p>
              <ul class="nav">
                <!-- <li class="active"><a href="#">Home</a></li> -->
              </ul>
            </div><!--/.nav-collapse -->
          </div>
        </div>
      </div>
  
      <div class="container-fluid">
        <div class="row-fluid">
          <div class="span3">
          	<div data-spy="affix" id="panel">
                  <!-- nav tabs -->
                  <ul class=" nav nav-tabs" id="myTab">
                    <li class="active"><a href="#navigatorTab" data-toggle="tab">Navigator</a></li>
                    <li><a href="#analyticsTab" data-toggle="tab">Analytics</a></li>
                  </ul>
                   
                  <div class="tab-content">
                    <div class="tab-pane active" id="navigatorTab">
                      <form id="directionsform" class="form-horizontal">
                        <fieldset> 
                            <div class="control-group">
                              <label class="control-label" for="fromdirection">Starting Location:</label>
                              <div class="controls">
                                <input type="text" name="fromdirection" id="fromdirection" />
                              </div>
                            </div>
                            
                            <div class="control-group">
                              <label class="control-label" for="todirection">Destination:</label>
                              <div class="controls">
                                  <input type="text" name="todirection" id="todirection" />
                              </div>
                            </div>
                            
                            <div class="control-group">
                              <label class="control-label" for="travelmodeDDL">Mode of Transport:</label>
                              <div class="controls">
                              <select id="travelmodeDDL">
                                <option value="DRIVING">Driving</option>
                                <option value="TRANSIT">Public Transport</option>
                                <option value="WALKING">Walk</option>
                              </select>
                              </div>
                            </div>
                            
                            <div class="control-group">
                              <div class="controls">
                                <label class="checkbox">
                                  <input type="checkbox" id="avoidtollsCheckbox" value=""> Avoid Tolls
                                </label>
                                <label class="checkbox">
                                  <input type="checkbox" id="avoidhighwaysCheckbox" value=""> Avoid Highways
                                </label>
                                <label class="checkbox">
                                  <input type="checkbox" id="" value="" disabled> Avoid Incidents
                                </label>
                              </div>
                            </div>
                            
                            <div class="form-actions"> 
                                <button class="btn btn-primary" type="button" onclick="calcRoute();">Search</button>
                            </div>
                            
                        </fieldset>
                      </form>
                      
                      <div class="accordion" id="incidentdirectionaccordion">
                        <div class="accordion-group">
                          <div class="accordion-heading">
                            <a class="accordion-toggle" data-toggle="collapse" data-parent="#incidentdirectionaccordion" href="#collapseIncident">
                              Incidents 
                            </a>
                          </div>
                          <div id="collapseIncident" class="accordion-body collapse">
                            <div class="accordion-inner">
                                
                              <button class="btn btn-mini" style="float:right;" onclick="retrieveOngoingIncidents();"><i class="icon-refresh"></i>&nbsp;Refresh Incidents</button>
                              
                              <label class="checkbox">
                                <input type="checkbox" checked id="selectAllIncidentType" onClick="toggleAll(this)"/> All
                              </label>
                              <label class="checkbox">
                                <input type="checkbox" checked name="incidentType" id="accidentCheckbox" value="Accident" onchange="filterIncidents()"> Accidents
                              </label>
                              <label class="checkbox">
                                <input type="checkbox" checked name="incidentType" id="roadworksCheckbox" value="Road Work" onchange="filterIncidents()"> Road Works
                              </label>
                              <label class="checkbox">
                                <input type="checkbox" checked name="incidentType" id="vehiclebreakdownCheckbox" value="Vehicle Breakdown" onchange="filterIncidents()"> Vehicle Breakdowns
                              </label>
                              <label class="checkbox">
                                <input type="checkbox" checked name="incidentType" id="heavytrafficCheckbox" value="Heavy Traffic" onchange="filterIncidents()"> Heavy Traffic
                              </label>
                              <label class="checkbox">
                                <input type="checkbox" checked name="incidentType" id="othersCheckbox" value="Others" onchange="filterIncidents()"> Others
                              </label>
                              
                            </div>
                          </div>
                        </div>
                        <div class="accordion-group">
                          <div class="accordion-heading">
                            <a class="accordion-toggle" data-toggle="collapse" data-parent="#incidentdirectionaccordion" href="#collapseDirection">
                              Directions
                            </a>
                          </div>
                          <div id="collapseDirection" class="accordion-body collapse in">
                            <div class="accordion-inner">
                              <div id="directionsDiv" style="overflow: scroll;">
                                <label class="checkbox">
                                  <input type="checkbox" disabled id="relevantCheckBox"/> Show incidents relevant to planned route only
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>               
                    </div>
                    
                    <div class="tab-pane" id="analyticsTab">
                    
                      <form id="analyticsform" class="form-horizontal">
                        <fieldset> 
                            <div class="control-group">
                              <label class="control-label" for="startdatetimepicker">Start Date:</label>
                              <div class="controls">
                                <input type="text" name="startdatetimepicker" id="startdatetimepicker" />
                              </div>
                            </div>
                                                        
                            <div class="control-group">
                              <label class="control-label" for="enddatetimepicker">End Date:</label>
                              <div class="controls">
                                <input type="text" name="enddatetimepicker" id="enddatetimepicker" />
                              </div>
                            </div>
                            
                            <div class="form-actions">  
                                <input class="btn btn-primary" type="submit" value="Retrieve"></input>
                                <button class="btn btn-success" type="button" onclick="retrieveGps()">Retrieve All</button>
                            </div>
                        </fieldset>
                      </form>
                      
                      <div style="position:static;color:red;" class="errormsg"></div>
                     
                     </div>
                  </div>
            	</div>
          </div><!--/span-->
          
          <!--  Google maps container -->
          <div class="span9">
  	        <div class="container">  
  			    <div id="dummy"></div>        
  			    <div id="map_canvas"><h1>Map not loaded</h1></div>
                  
                <div class="analyticsmap" id="map_canvas2"><h1>Map2 not loaded</h1></div>
                  
              </div>
          </div><!--/span-->
        </div><!--/row-->
  
          <!-- Modals -->
          <div id="loadModal" class="modal hide fade">
              <div class="modal-body">
                  <div class="progress progress-striped active">
                      <div id="loadprogress" class="bar" style="width:0%;"></div>
                  </div>
                      
                  <p align="center">
                      <span id="loadmsg"></span>
                  </p>
              </div>
          </div>
  
        <footer>
        <br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br>
        </footer>
  
      </div><!--/.fluid-container-->
    </div>
  </body>
</html>
