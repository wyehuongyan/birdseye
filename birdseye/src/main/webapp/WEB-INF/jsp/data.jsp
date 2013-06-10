<%@ taglib uri='http://java.sun.com/jsp/jstl/core' prefix='c' %>

<c:url value="/data/incidents/all" var="allIncidentsUrl"/>
<c:url value="/traffic/incidents/between" var="betweenIncidentsUrl"/>

<%@ page language="java" contentType="text/html; charset=US-ASCII"
    pageEncoding="US-ASCII"%>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">

<html lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=US-ASCII">
    <title>Bird's Eye</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="">
    <meta name="author" content="">

    <!-- Le javascript -->
    <script type='text/javascript' src='<c:url value="/resources/js/jquery/jquery-1.9.1.js"/>'></script>
    <script type='text/javascript' src='<c:url value="/resources/js/jquery/jquery-ui-1.10.0.custom.js"/>'></script>
    <script type='text/javascript' src='<c:url value="/resources/js/jquery/jquery-ui-timepicker-addon.js"/>'></script>
    <script type='text/javascript' src='<c:url value="/resources/js/bootstrap/bootstrap.js"/>'></script>
    <script type='text/javascript' src='<c:url value="/resources/js/d3/d3.v3.min.js"/>'></script>
    <script type="text/javascript" src="<c:url value="/resources/js/jquery/jquery.validate.js"/>"></script>
    <script type="text/javascript" src="<c:url value="/resources/js/custom/validation.js"/>"></script>
    
    <script type='text/javascript' src='<c:url value="/resources/js/custom/piefocus.js"/>'></script>
    <script type='text/javascript' src='<c:url value="/resources/js/custom/scatterplot.js"/>'></script>
    
    <!-- Le styles -->
    <link rel='stylesheet' type='text/css' media='screen' href='<c:url value="/resources/css/bootstrap.css"/>'/>
    <link rel='stylesheet' type='text/css' media='screen' href='<c:url value="/resources/css/jquery-ui-1.10.0.custom.css"/>'/>
    <link rel='stylesheet' type='text/css' media='screen' href='<c:url value="/resources/css/jquery-ui-timepicker-addon.css"/>'/>
    
    <link rel='stylesheet' type='text/css' media='screen' href='<c:url value="/resources/css/data.css"/>'/>
    
    <!-- Favicon -->
    <link rel="icon" type="image/png" href="./resources/icons/camera-lens-icon.png">
    
    <script type="text/javascript">
    var urlHolder = new Object();
    
    $(document).ready(function() {
        urlHolder.allIncidents = '${allIncidentsUrl}';
        urlHolder.betweenIncidents = '${betweenIncidentsUrl}';
        
        initPieChart();
        initializeUI();
        setupFormValidation();
        
        // event listeners for tabs
        $('a[data-toggle="tab"]').on('shown', function (e) {
          var active = $($(e.target).attr('href')).attr('id');
          
          if(active == "focusTab") {
              $(".scatterContent").hide();
              $(".focusContent").show();
          } else {
              $(".focusContent").hide();
              $(".scatterContent").show();
          }
        });
        
        $(".scatterContent").hide();
        $(".focusContent").show();
    });
    
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
                <li class=""><a href="./traffic">Map</a></li>
                <li class=""><a href="./data">Data</a></li>
              </ul>
            </div><!--/.nav-collapse -->
          </div>
        </div>
      </div>
    </div>
  
  <div class="container-fluid">
    <div class="row-fluid">
      <div class="span3">
      
      <div id="panel">
        <!-- nav tabs -->
        <ul class=" nav nav-tabs" id="myTab">
          <li class="active"><a href="#focusTab" data-toggle="tab">Pie Focus</a></li>
          <li><a href="#scatterTab" data-toggle="tab">Scatterplot</a></li>
        </ul>
         
        <div class="tab-content">
          <div class="tab-pane active" id="focusTab" value="d3Focus">
          <div id="d3PieChart"></div>
          
          <br><br>
          
          <form id="directionsform" class="form-horizontal">
            <fieldset>
                <div class="control-group">
                    <div class="controls">
                      <div>
                        <label class="checkbox">
                          <input type="checkbox" checked name="dataIncidentType" id="dataAccidentCheckbox" value="Accident" onchange=""> Accidents
                        </label>
                        <label class="checkbox">
                          <input type="checkbox" checked name="dataIncidentType" id="dataRoadworksCheckbox" value="Road Work" onchange=""> Road Works
                        </label>
                        <label class="checkbox">
                          <input type="checkbox" checked name="dataIncidentType" id="dataVehiclebreakdownCheckbox" value="Vehicle Breakdown" onchange=""> Vehicle Breakdowns
                        </label>
                        <label class="checkbox">
                          <input type="checkbox" checked name="dataIncidentType" id="dataHeavytrafficCheckbox" value="Heavy Traffic" onchange=""> Heavy Traffic
                        </label>
                        <label class="checkbox">
                          <input type="checkbox" checked name="dataIncidentType" id="dataOthersCheckbox" value="Others" onchange=""> Others
                        </label>
                      </div>
                    </div>
                  </div>
            </fieldset>
          </form>             
          </div>
          
          <div class="tab-pane" id="scatterTab" value="d3Scatterplot">
          <form id="scatterPlotForm" class="form-horizontal">
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
                    <input id="retrieveButton" class="btn btn-primary" data-loading-text="Retrieving..." type="submit" value="Retrieve"></input>
                  </div>
                  
                  <div class="scatterPlotInfoDiv" style="display: none">
                    <div class="control-group">
                      <div class="controls">
                        <div>
                          <label class="checkbox">
                          <input type="checkbox" checked id="selectAllScatterPlotIncidentType" value="All" onClick="filterScatterPlotIncidents(this); toggleScatterPlotAll(this);"/> All
                          </label>
                          <label class="checkbox">
                            <input type="checkbox" checked name="scatterPlotIncidentType" id="scatterPlotAccidentCheckbox" value="Accident" onchange="filterScatterPlotIncidents(this)"> Accidents
                          </label>
                          <label class="checkbox">
                            <input type="checkbox" checked name="scatterPlotIncidentType" id="scatterPlotRoadworksCheckbox" value="Road Work" onchange="filterScatterPlotIncidents(this)"> Road Works
                          </label>
                          <label class="checkbox">
                            <input type="checkbox" checked name="scatterPlotIncidentType" id="scatterPlotVehiclebreakdownCheckbox" value="Vehicle Breakdown" onchange="filterScatterPlotIncidents(this)"> Vehicle Breakdowns
                          </label>
                          <label class="checkbox">
                            <input type="checkbox" checked name="scatterPlotIncidentType" id="scatterPlotHeavytrafficCheckbox" value="Heavy Traffic" onchange="filterScatterPlotIncidents(this)"> Heavy Traffic
                          </label>
                          <label class="checkbox">
                            <input type="checkbox" checked name="scatterPlotIncidentType" id="scatterPlotOthersCheckbox" value="Others" onchange="filterScatterPlotIncidents(this)"> Others
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  
              </fieldset>
            </form>
            
            <div style="position:static;color:red;" class="errormsg"></div>
            
          </div>
        </div>
      </div>
      
      </div>
      <div class="span9">
        <div class="row-fluid">
          <div class="container">  
            <div id="dummy"></div> 
            <div id="d3Focus" class="focusContent"><H3 class="focusContent" id="focusLabel">All Incidents</H3></div>
            
            <div class="row-fluid">
              <div class="span9">
                  <div id="d3Scatterplot" class="scatterContent">
                  <!-- <H3 class="scatterContent" id="scatterLabel"></H3> -->
                  </div>
              </div>
              <div id="d3Legend" class="span3 scatterPlotInfoDiv" style="display: none"><h3></h3></div>
            </div>
          </div>
        </div>
        
        <div class="row-fluid">
          <div class="focusContent">
              <br><br>
              <p>To show incident information, click on any dot.</p>
              
              <table id="infoTable" class="table table-hover table-condensed">
              <tr>
                <th>#</th>
                <th>Occurred on</th>
                <th>Message</th>
                <th>Time Elapsed</th>
              </tr>
              </table>
          </div>
        </div>
      </div>
    </div>
  </div>

</body>
</html>