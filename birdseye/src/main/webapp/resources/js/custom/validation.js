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
}