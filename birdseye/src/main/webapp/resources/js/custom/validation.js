function setupFormValidation() {
    // form validation rules
    $("#analyticsform").validate({
        ignore : "",
        showErrors : function(errorMap, errorList) {
            $(".errormsg").html($.map(errorList, function(el) {
                return el.message;
            }).join("<br>"));
        },

        rules : {
            startdatetimepicker : "required",
            enddatetimepicker : "required",
        },
        messages : {
            startdatetimepicker : "Please enter start value",
            enddatetimepicker : "Please enter end value",
        },
        submitHandler : function(form) {
            // form.submit();
            retrieveBetweenIncidents();
        }
    });

    // form validation rules
    $("#focusform").validate({
        ignore : "",
        showErrors : function(errorMap, errorList) {
            $(".errormsg").html($.map(errorList, function(el) {
                return el.message;
            }).join("<br>"));
        },

        rules : {
            piestartdatetimepicker : "required",
            pieenddatetimepicker : "required",
        },
        messages : {
            piestartdatetimepicker : "Please enter start value",
            pieenddatetimepicker : "Please enter end value",
        },
        submitHandler : function(form) {
            // form.submit();
            initPieChart();
        }
    });

    // form validation rules
    $("#scatterPlotForm").validate({
        ignore : "",
        showErrors : function(errorMap, errorList) {
            $(".errormsg").html($.map(errorList, function(el) {
                return el.message;
            }).join("<br>"));
        },

        rules : {
            startdatetimepicker : "required",
            enddatetimepicker : "required",
            similarityIncidentType : {
                required : true,
                minlength : 2
            }
        },
        messages : {
            startdatetimepicker : "Please enter start value",
            enddatetimepicker : "Please enter end value",
            similarityIncidentType : "Please check at least two incident types",
        },
        submitHandler : function(form) {
            // form.submit();
            retrieveSimilarIncidents();
        }
    });

    keepCount();
}

function keepCount() {
    var MAX_CREDITS = 2;

    $("input[name='scatterPlotIncidentType']").change(function() {
        var totalCredits = 0;
        $("input[name='scatterPlotIncidentType']").each(function() {
            // augment totalCredits accordingly to each checkbox.
            if (this.checked) {
                totalCredits += 1;
            }
        });

        if (totalCredits > MAX_CREDITS) {
            $(this).removeAttr("checked");
        }

        /*
         * console.log($("input:checkbox[name='scatterPlotIncidentType']:checked")[0].value);
         * 
         * $("input:checkbox[name='scatterPlotIncidentType']:checked").each(function() { //
         * add $(this).val() to your array // console.log($(this).val()); });
         */
    });
}