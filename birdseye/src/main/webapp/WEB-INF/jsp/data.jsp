<%@ taglib uri='http://java.sun.com/jsp/jstl/core' prefix='c' %>

<c:url value="/data/incidents/all" var="allIncidentsUrl"/>

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
    
    <script type='text/javascript' src='<c:url value="/resources/js/custom/data.js"/>'></script>
    
    <!-- Le styles -->
    <link rel='stylesheet' type='text/css' media='screen' href='<c:url value="/resources/css/bootstrap.css"/>'/>
    <link rel='stylesheet' type='text/css' media='screen' href='<c:url value="/resources/css/jquery-ui-1.10.0.custom.css"/>'/>
    <link rel='stylesheet' type='text/css' media='screen' href='<c:url value="/resources/css/jquery-ui-timepicker-addon.css"/>'/>
    
    <link rel='stylesheet' type='text/css' media='screen' href='<c:url value="/resources/css/data.css"/>'/>
    
    <script type="text/javascript">
    var urlHolder = new Object();
    
    $(document).ready(function() {
        urlHolder.allIncidents = '${allIncidentsUrl}';
        
        initPieChart();
        
        // event listeners for tabs
        $('a[data-toggle="tab"]').on('shown', function (e) {
          var active = $($(e.target).attr('href')).attr('id');
          
          if(active == "focusTab") {
              $("#d3Scatterplot").hide();
              $("#d3Focus").show();
          } else {
              $("#d3Focus").hide();
              $("#d3Scatterplot").show();
          }
        });
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
          <p>Scatterplot form elements</p>
          </div>
        </div>
      </div>
      
      </div>
      <div class="span9">
        <br><br>
        <div id="d3Focus" class="content"></div>
        <div id="d3Scatterplot" class="content"><p>Scatterplot</p></div>
      </div>
    </div>
  </div>

</body>
</html>