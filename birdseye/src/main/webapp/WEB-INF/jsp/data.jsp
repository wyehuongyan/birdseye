<%@ taglib uri='http://java.sun.com/jsp/jstl/core' prefix='c' %>

<c:url value="/data/incidents/all" var="allIncidentsUrl"/>
<c:url value="/data/incidents/between" var="betweenIncidentsUrl"/>
<c:url value="/data/incidents/similarity" var="similarIncidentsUrl"/>
<c:url value="/data/incidents/congestion" var="congestionUrl"/>
<c:url value="/data/incidents/directions" var="updatedirectionsUrl"/>

<%@ page language="java" contentType="text/html; charset=US-ASCII"
    pageEncoding="US-ASCII"%>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">

<html lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=US-ASCII">
    <title>PETRINA: PErsonalized TRaffic INformation Analytics</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="">
    <meta name="author" content="">

    <!-- Le javascript -->
    <script type='text/javascript' src='<c:url value="/resources/js/jquery/jquery-1.9.1.js"/>'></script>
    <script type='text/javascript' src='<c:url value="/resources/js/jquery/jquery-ui-1.10.0.custom.js"/>'></script>
    <script type='text/javascript' src='<c:url value="/resources/js/jquery/jquery-ui-timepicker-addon.js"/>'></script>
    <script type='text/javascript' src='<c:url value="/resources/js/bootstrap/bootstrap.js"/>'></script>
    <script type='text/javascript' src='<c:url value="/resources/js/d3/d3.v3.min.js"/>'></script>
    <script type="text/javascript" src='<c:url value="https://maps.googleapis.com/maps/api/js?key=AIzaSyDn1xjmKkgF7KL8Y6txLXmsrJIc7nzTDSo&sensor=false"/>'></script>
    <script type="text/javascript" src="<c:url value="/resources/js/jquery/jquery.validate.js"/>"></script>
    <script type="text/javascript" src="<c:url value="/resources/js/jquery/jquery.jtruncate.pack.js"/>"></script>
    <script type="text/javascript" src="<c:url value="/resources/js/jquery/jquery.easy-pie-chart.js"/>"></script>
    <script type="text/javascript" src="<c:url value="/resources/js/custom/validation.js"/>"></script>
    
    <script type='text/javascript' src='<c:url value="/resources/js/custom/piefocus.js"/>'></script>
    <script type='text/javascript' src='<c:url value="/resources/js/custom/similarity.js"/>'></script>
    <script type='text/javascript' src='<c:url value="/resources/js/custom/congestion.js"/>'></script>
    
    <!-- Le styles -->
    <link rel='stylesheet' type='text/css' media='screen' href='<c:url value="/resources/css/bootstrap.css"/>'/>
    <link rel='stylesheet' type='text/css' media='screen' href='<c:url value="/resources/css/jquery-ui-1.10.0.custom.css"/>'/>
    <link rel='stylesheet' type='text/css' media='screen' href='<c:url value="/resources/css/jquery-ui-timepicker-addon.css"/>'/>
    <link rel='stylesheet' type='text/css' media='screen' href='<c:url value="/resources/css/jquery.easy-pie-chart.css"/>'/>
    
    <link rel='stylesheet' type='text/css' media='screen' href='<c:url value="/resources/css/data.css"/>'/>
    
    <!-- Favicon -->
    <link rel="icon" type="image/png" href="./resources/icons/camera-lens-icon.png">
    
    <script type="text/javascript">
    var urlHolder = new Object();
    
    $(document).ready(function() {
        urlHolder.allIncidents = '${allIncidentsUrl}';
        urlHolder.betweenIncidents = '${betweenIncidentsUrl}';
        urlHolder.similarIncidents = '${similarIncidentsUrl}';
        urlHolder.congestion = '${congestionUrl}';
        urlHolder.updateDirections = '${updatedirectionsUrl}';
        
        initializePieUI();
        initializeSimUI();
        initializeCongUI();
        setupFormValidation();
        
        // event listeners for tabs
        $('a[data-toggle="tab"]').on('shown', function (e) {
          var active = $($(e.target).attr('href')).attr('id');
          
          if(active == "focusTab") {
              $(".scatterContent").hide();
              $(".congestContent").hide();
              $(".focusContent").show();
          } else if(active == "scatterTab") {
              $(".congestContent").hide();
              $(".focusContent").hide();
              $(".scatterContent").show();
          } else {
              // congestion tab
              $(".congestContent").show();
              $(".focusContent").hide();
              $(".scatterContent").hide();
          }
        });
        
        $(".congestContent").hide();
        $(".scatterContent").hide();
        $(".focusContent").show();
        
        // modal parameters
        $('#loadingModal').modal({
          keyboard: false,
          show: false,
          backdrop: "static"
        });
        
        // modal parameters
        $('#carouselModal').modal({
          keyboard: true,
          show: false
        });
        
        // progress bar parameters
        $( "#progressbar" ).progressbar({
          value: false
        });  
        
        // set the scrollable div height
        $('#similarDiv').height(($(window).height())/2.5);
        
        // init pie chart
        $('.chart').easyPieChart({
            //your configuration goes here
            barColor: "steelblue",
            trackColor: "#F2F2F2",
            scaleColor: false,
            lineCap: "butt",
            lineWidth: 80,
            size: 380,
            animate: 500,
            onStep: function(value) {
                $('#percentageSpan').text(value[0].toFixed(1));
            }
        });
        
        // init sliders
        $("#radiusSlider").slider({
          value: 1.0,
          min: 0,
          max: 2.0,
          step: 0.1,
          create: function( event, ui ) {
              $('.ui-slider-handle:first').html('<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' + 1.0 + '</div></div>');
          }, 
          slide: function( event, ui ) {
              $('.ui-slider-handle:first').html('<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' + ui.value + '</div></div>');
              
              // get current value of slider: $( "#slider" ).slider( "value" )
          }
        });
        
        $("#timeSlider").slider({
          value: 30,
          min: 0,
          max: 60,
          step: 5,
          create: function( event, ui ) {
              $('.ui-slider-handle:eq(1)').html('<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' + 30 + '</div></div>');
          }, 
          slide: function( event, ui ) {
              $('.ui-slider-handle:eq(1)').html('<div class="tooltip top slider-tip"><div class="tooltip-arrow"></div><div class="tooltip-inner">' + ui.value + '</div></div>');
          }
        });
        
        // logo follow mouse
        $(document).mousemove(function(e) {
            $('#incidentImage').offset({
                left: e.pageX + 20,
                top: e.pageY - 220
            });
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
            <a class="brand" href="" onclick="location.reload(true)">PETRINA</a>
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
          <li><a href="#scatterTab" data-toggle="tab">Similarity</a></li>
          <li><a href="#congestTab" data-toggle="tab">Congestion</a></li>
        </ul>
         
        <div class="tab-content">
          <!-- Pie Focus Tab -->
          <div class="tab-pane active" id="focusTab" value="d3Focus">
       
          <form id="focusform" class="form-horizontal">
            <fieldset>
                <div class="control-group">
                  <label class="control-label" for="piestartdatetimepicker">Start Date:</label>
                  <div class="controls">
                    <input type="text" name="piestartdatetimepicker" id="piestartdatetimepicker" />
                  </div>
                </div>
                                            
                <div class="control-group">
                  <label class="control-label" for="pieenddatetimepicker">End Date:</label>
                  <div class="controls">
                    <input type="text" name="pieenddatetimepicker" id="pieenddatetimepicker" />
                  </div>
                </div>
            
                <div class="form-actions">  
                    <input id="retrieveButton" class="btn btn-primary" data-loading-text="Retrieving..." type="submit" value="Retrieve"></input>
                </div>
            
                <div class="control-group focusFilter" style="display: none;">
                <label class="control-label">Check to filter Incident Types: </label>
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
                
                <div id="d3PieChart"></div>
            </fieldset>
          </form>            
          
          <div style="position:static;color:red;" class="errormsg"></div>
           
          </div>
          
          <!-- Similarity Tab -->
          <div class="tab-pane" id="scatterTab" value="d3Scatterplot">
          <form name="scatterPlotForm" id="scatterPlotForm" class="form-horizontal">
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
                  
                  <div class="control-group">
                  <label class="control-label">Select only two Incident Types: </label>
                    <div class="controls">
                      <div>
                        <label class="checkbox">
                          <input type="checkbox" name="similarityIncidentType" id="scatterPlotAccidentCheckbox" value="Accident" onchange=""> Accidents
                        </label>
                        <label class="checkbox">
                          <input type="checkbox" name="similarityIncidentType" id="scatterPlotRoadworksCheckbox" value="Road Work" onchange=""> Road Works
                        </label>
                        <label class="checkbox">
                          <input type="checkbox" name="similarityIncidentType" id="scatterPlotVehiclebreakdownCheckbox" value="Vehicle Breakdown" onchange=""> Vehicle Breakdowns
                        </label>
                        <label class="checkbox">
                          <input type="checkbox" name="similarityIncidentType" id="scatterPlotHeavytrafficCheckbox" value="Heavy Traffic" onchange=""> Heavy Traffic
                        </label>
                        <label class="checkbox">
                          <input type="checkbox" name="similarityIncidentType" id="scatterPlotOthersCheckbox" value="Others" onchange=""> Others
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div class="control-group">
                    <label class="control-label" id="panLabel" for="radiusSlider">Minimum Distance Apart (Kilometers): </label>
                    <div class="controls">
                      <div style="margin-top: 9px; margin-right:20px" id="radiusSlider"></div>
                    </div>
                  </div>
                  
                  <div class="control-group">
                    <label class="control-label" id="panLabel" for="timeSlider">Maximum Time Apart (Minutes): </label>
                    <div class="controls">
                      <div style="margin-top: 9px; margin-right:20px" id="timeSlider"></div>
                    </div>
                  </div>
                  
                  <div class="form-actions">  
                    <input id="pieRetrieveButton" class="btn btn-primary" data-loading-text="Retrieving..." type="submit" value="Retrieve"></input>
                  </div>
                  
              </fieldset>
            </form>
            
            <div style="position:static;color:red;" class="errormsg"></div>
            
          </div>
          
          <!-- Congestion Tab -->
          <div class="tab-pane" id="congestTab" value="d3Congestion">
            <form id="congestform" class="form-horizontal">
              <fieldset>
                <div class="control-group">
                  <label class="control-label" for="congeststartdatetimepicker">Start Date:</label>
                  <div class="controls">
                    <input type="text" name="congeststartdatetimepicker" id="congeststartdatetimepicker" />
                  </div>
                </div>
                                            
                <div class="control-group">
                  <label class="control-label" for="congestenddatetimepicker">End Date:</label>
                  <div class="controls">
                    <input type="text" name="congestenddatetimepicker" id="congestenddatetimepicker" />
                  </div>
                </div>
                
                <div class="form-actions">  
                  <input id="congestRetrieveButton" class="btn btn-primary" data-loading-text="Retrieving..." type="submit" value="Retrieve"></input>
                </div>
                
                <div class="control-group congestFilter" style="display: none;">
                <label class="control-label">Check to filter by day: </label>
                  <div class="controls">
                    <div>
                      <label class="checkbox">
                        <input type="checkbox" checked id="dataAllDayCheckbox" value="All" onClick="toggleDaysAll(this)"> All
                      </label>
                      <label class="checkbox">
                        <input type="checkbox" checked name="dataCongestDay" id="dataMondayCheckbox" value="0" onchange=""> Monday
                      </label>
                      <label class="checkbox">
                        <input type="checkbox" checked name="dataCongestDay" id="dataTuesdayCheckbox" value="1" onchange=""> Tuesday
                      </label>
                      <label class="checkbox">
                        <input type="checkbox" checked name="dataCongestDay" id="dataWednesdayCheckbox" value="2" onchange=""> Wednesday
                      </label>
                      <label class="checkbox">
                        <input type="checkbox" checked name="dataCongestDay" id="dataThursdayCheckbox" value="3" onchange=""> Thursday
                      </label>
                      <label class="checkbox">
                        <input type="checkbox" checked name="dataCongestDay" id="dataFridayCheckbox" value="4" onchange=""> Friday
                      </label>
                      <label class="checkbox">
                        <input type="checkbox" checked name="dataCongestDay" id="dataSaturdayCheckbox" value="5" onchange=""> Saturday
                      </label>
                      <label class="checkbox">
                        <input type="checkbox" checked name="dataCongestDay" id="dataSundayCheckbox" value="6" onchange=""> Sunday
                      </label>
                    </div>
                  </div>
                </div>
                
                <div class="control-group congestFilter" style="display: none;">
                <label class="control-label">Check to filter by Expressway: </label>
                  <div class="controls">
                    <div>
                      <label class="checkbox">
                        <input type="checkbox" checked id="dataAllExpresswayCheckbox" value="All" onclick="toggleExpresswaysAll(this)"> All
                      </label>
                      <label class="checkbox">
                        <input type="checkbox" checked name="dataCongestExpressway" id="dataPIECheckbox" value="PIE" onchange=""> Pan Island Expressway (PIE)
                      </label>
                      <label class="checkbox">
                        <input type="checkbox" checked name="dataCongestExpressway" id="dataBKECheckbox" value="BKE" onchange=""> Bukit Timah Expressway (BKE)
                      </label>
                      <label class="checkbox">
                        <input type="checkbox" checked name="dataCongestExpressway" id="dataAYECheckbox" value="AYE" onchange=""> Ayer Rajah Expressway (AYE)
                      </label>
                      <label class="checkbox">
                        <input type="checkbox" checked name="dataCongestExpressway" id="dataSLECheckbox" value="SLE" onchange=""> Seletar Expressway (SLE)
                      </label>
                      <label class="checkbox">
                        <input type="checkbox" checked name="dataCongestExpressway" id="dataTPECheckbox" value="TPE" onchange=""> Tampines Expressway (TPE)
                      </label>
                      <label class="checkbox">
                        <input type="checkbox" checked name="dataCongestExpressway" id="dataECPCheckbox" value="ECP" onchange=""> East Coast Parkway (ECP)
                      </label>
                      <label class="checkbox">
                        <input type="checkbox" checked name="dataCongestExpressway" id="dataKJECheckbox" value="KJE" onchange=""> Kranji Expressway (KJE)
                      </label>
                      <label class="checkbox">
                        <input type="checkbox" checked name="dataCongestExpressway" id="dataCTECheckbox" value="CTE" onchange=""> Central Expressway (CTE)
                      </label>
                      <label class="checkbox">
                        <input type="checkbox" checked name="dataCongestExpressway" id="dataKPECheckbox" value="KPE" onchange=""> Kallang Paya Lebar Expressway (KPE)
                      </label>
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
            <div class="focusContent"><div id="d3Focus"><H3 id="focusLabel">Focus Context</H3></div><img style="position: absolute; display: none;" class="img-polaroid" id="incidentImage" src=""></div>
            
            <div id="d3Scatterplot" class="scatterContent"><H3 class="scatterContent" id="scatterLabel">Similarity</H3>
            
              <div id="similarDiv" class="similarContent" style="overflow: scroll; display: none;">
                <table id="similarTable" class="table table-hover table-bordered table-condensed">
                  <thead>
                    <tr>
                      <th colspan="3" style="text-align:center;">Incident</th>
                      <th colspan="2" style="text-align:center;">Best Match</th>
                      <th colspan="2" style="text-align:center;"></th>
                    </tr>
                    <tr>
                      <th>#</th>
                      <th>Occurred on</th>
                      <th>Message</th>
                      <th>Occurred on</th>
                      <th>Message</th>
                      <th>Time Apart</th>
                      <th>Similarity</th>
                    </tr>    
                  </thead>      
                  
                  <!-- 
                  <tbody data-provides="rowlink">
                  <tr>
                  <td colspan="7"><a href="">test</a></td>
                  </tr>
                  </tbody>
                  -->
                  
               </table>
             </div>
                  
           </div>
           
           <div class="congestContent">
            <div class="span6">
              <H3 id="congestLabel">Congestion Analysis</H3>
              <div id="congestMapContainer" style="height: 400px;"></div>
            </div>
            <div class="span6">
              <div id="d3Barchart"></div>
            </div>
           </div>
           
          </div>
        </div>
        
        <div class="row-fluid">
          <div class="focusContent">
            <div class="focusFilter" style="display: none;">
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
          
          <div class="scatterContent">
            <div class="similarContent" style="display: none;">
              <div class="span4">
                  <br>
                  <H3>Summary</H3>
                  <div id="summaryDiv">
                      <table class="sumTable table table-hover">
                        <tr>
                          <td>Incident 1 Count</td>
                          <td></td>
                        </tr>
                        
                        <tr>
                          <td>Incident 2 Count</td>
                          <td></td>
                        </tr>
                        
                        <tr>
                          <td>Number of Matches</td>
                          <td></td>
                        </tr>
                      </table>
                  </div>
              </div>
                 
              <div class="span4">
                <br><br><br>
                <div style="margin-left:auto; margin-right:auto;" class="chart" data-percent="0">Similarity: <span id="percentageSpan">0</span>%</div>
              </div> 
               
              <div class="span4">
                <br><br><br>
                <div id="simMapContainer" style="height: 380px; max-width: none; border-style:solid; border-width:2px; border-color: gray">
                </div>
              </div>
            </div>
          </div>
          
          <div class="congestContent">
            <div class="span10">
                <div id="d3Linechart"></div>
            </div>
            <div id="congTableDiv" style="height: 400px; overflow: scroll; display:none;" class="span2">
            <p>Mouseover row to highlight route on map</p>
                <table id="congTable" class="table table-hover table-condensed">
                <tr>
                    <th>#</th>
                    <th>Congestion</th>
                </tr>
                
                </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  
    <!-- Modal -->
    <div id="loadingModal" class="modal hide fade">
      <div class="modal-header">
        <h3>Loading Data...</h3>
      </div>
      <div class="modal-body">
        <div id="progressbar"></div>
      </div>
    </div>
    
    <!-- Carousel Modal -->
    <div id="carouselModal" class="modal hide fade">
      <div class="modal-header">
        <h3>Traffic Images</h3>
      </div>
      <div class="modal-body">
        <div id="carousel-body"></div>
      </div>
      <div class="modal-footer">
        <div id="carousel-footer"></div>
      </div>
    </div>
  </div>

</body>
</html>