function setupFormValidation() {
    // form validation rules
    $("#parameterform").validate({
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
            retrieveGpsPeriod();
        }
    });
}