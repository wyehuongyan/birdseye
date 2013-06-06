package org.birdseye.controller;

import java.util.List;
import org.birdseye.domain.Incident;
import org.birdseye.service.TrafficInfoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
@RequestMapping("/data")
public class DataController {

    @Autowired
    TrafficInfoService trafficInfoService;

    @RequestMapping
    public String getDataPage() {
        return "data";
    }

    @RequestMapping(value = "/incidents/all", method = RequestMethod.POST)
    public @ResponseBody
    List<Incident> readAllIncidents() {
        final List<Incident> incidents = trafficInfoService.read("incident", Incident.class);

        // incidentMap is a hashMap with values
        // jackson is unable to process it and causes a internal server error 500
        for (final Incident i : incidents) {
            // clear the hashmap to temporary solve the problem
            i.getIncidentMap().clear();
        }

        return incidents;
    }
}