<%@ taglib uri='http://java.sun.com/jsp/jstl/core' prefix='c' %>

<c:url value="/traffic/incidents/ongoing" var="ongoingIncidentsUrl"/>
<c:url value="/traffic/incidents/between" var="betweenIncidentsUrl"/>

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Bird's Eye</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="">
    <meta name="author" content="">

	<!-- Le javascript -->
	<script type='text/javascript' src='<c:url value="/resources/js/jquery/jquery-1.9.1.js"/>'></script>
    <script type='text/javascript' src='<c:url value="/resources/js/jquery/jquery-ui-1.10.0.custom.js"/>'></script>
    <script type='text/javascript' src='<c:url value="/resources/js/jquery/jquery-ui-timepicker-addon.js"/>'></script>
	<script type='text/javascript' src='<c:url value="/resources/js/bootstrap/bootstrap.js"/>'></script>
	<script type="text/javascript" src='<c:url value="https://maps.googleapis.com/maps/api/js?key=AIzaSyDn1xjmKkgF7KL8Y6txLXmsrJIc7nzTDSo&libraries=places,visualization&sensor=false"/>'></script>
    <script type="text/javascript" src="<c:url value="/resources/js/jquery/jquery.tmpl.js"/>"></script>
    <script type="text/javascript" src="<c:url value="/resources/js/jquery/jquery.validate.js"/>"></script>
    <script type="text/javascript" src="<c:url value="/resources/js/custom/validation.js"/>"></script>
    
    <script type="text/javascript" src="<c:url value="/resources/js/custom/googlemaps.js"/>"></script>
    <script type="text/javascript" src="<c:url value="/resources/js/custom/navigator.js"/>"></script>
    <script type="text/javascript" src="<c:url value="/resources/js/custom/analytics.js"/>"></script>

    <!-- Le styles -->
    <link rel='stylesheet' type='text/css' media='screen' href='<c:url value="/resources/css/bootstrap.css"/>'/>
    <link rel='stylesheet' type='text/css' media='screen' href='<c:url value="/resources/css/jquery-ui-1.10.0.custom.css"/>'/>
    <link rel='stylesheet' type='text/css' media='screen' href='<c:url value="/resources/css/jquery-ui-timepicker-addon.css"/>'/>
    
    <link rel='stylesheet' type='text/css' media='screen' href='<c:url value="/resources/css/googlemaps.css"/>'/>
    <link rel='stylesheet' type='text/css' media='screen' href='<c:url value="/resources/css/map.css"/>'/>

    <!-- HTML5 shim, for IE6-8 support of HTML5 elements -->
    <!--[if lt IE 9]>
      <script src="http://html5shim.googlecode.com/svn/trunk/html5.js"></script>
    <![endif]-->
    <script type="text/javascript">
    var urlHolder = new Object();
    	
	$(document).ready(function() {
		urlHolder.ongoingIncidents = '${ongoingIncidentsUrl}';
		urlHolder.betweenIncidents = '${betweenIncidentsUrl}';

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
		
		// set directions accordion collapsed height
		$('#directionsDiv').height(($(window).height())/2.5);

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
            <a class="brand" href="" onclick="location.reload(true)">Bird's Eye</a>
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
                                  <input type="checkbox" id="avoidtollsCheckbox" value=""> Avoid ERP
                                </label>
                                <label class="checkbox">
                                  <input type="checkbox" id="avoidhighwaysCheckbox" value=""> Avoid Expressways
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
                              <!-- <button class="btn btn-success" type="button" onclick="">Retrieve All</button> -->
                            </div>
                            
                            <div id="analyticsInfoDiv" style="display: none">
                              <div class="control-group">
                                <div class="controls">
                                  <div>
                                    <label class="checkbox">
                                    <input type="checkbox" checked id="selectAllAnalyticsIncidentType" onClick="toggleAnalyticsAll(this)"/> All
                                    </label>
                                    <label class="checkbox">
                                      <input type="checkbox" checked name="analyticsIncidentType" id="analyticsAccidentCheckbox" value="Accident" onchange="filterAnalyticsIncidents()"> Accidents
                                    </label>
                                    <label class="checkbox">
                                      <input type="checkbox" checked name="analyticsIncidentType" id="analyticsRoadworksCheckbox" value="Road Work" onchange="filterAnalyticsIncidents()"> Road Works
                                    </label>
                                    <label class="checkbox">
                                      <input type="checkbox" checked name="analyticsIncidentType" id="analyticsVehiclebreakdownCheckbox" value="Vehicle Breakdown" onchange="filterAnalyticsIncidents()"> Vehicle Breakdowns
                                    </label>
                                    <label class="checkbox">
                                      <input type="checkbox" checked name="analyticsIncidentType" id="analyticsHeavytrafficCheckbox" value="Heavy Traffic" onchange="filterAnalyticsIncidents()"> Heavy Traffic
                                    </label>
                                    <label class="checkbox">
                                      <input type="checkbox" checked name="analyticsIncidentType" id="analyticsOthersCheckbox" value="Others" onchange="filterAnalyticsIncidents()"> Others
                                    </label>
                                  </div>
                                </div>
                              </div>
                            
                              <div class="control-group">
                              <label class="control-label" for="analyticsDate">Date:</label>
                                <div class="controls">
                                  <input type="text" name="analyticsDate" id="analyticsDate" />
                                </div>
                              </div>
                              
                              <div class="control-group">
                                <label class="control-label" for="analyticsTime">Time:</label>
                                <div class="controls">
                                  <input type="text" name="analyticsTime" id="analyticsTime" />
                                </div>
                              </div>
                            
                              <div class="control-group">
                              <label class="control-label" id="panLabel" for="incidentSlider">Pan: </label>
                                <div class="controls">
                                  <div style="margin-top: 9px; margin-right:20px" id="incidentSlider"></div>
                                </div>
                              </div>
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
