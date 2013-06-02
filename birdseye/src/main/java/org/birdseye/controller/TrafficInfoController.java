package org.birdseye.controller;

import java.util.List;
import org.birdseye.domain.Incident;
import org.birdseye.service.TrafficInfoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
@RequestMapping("/traffic")
public class TrafficInfoController {

    @Autowired
    TrafficInfoService trafficInfoService;

    @RequestMapping
    public String getTrafficPage() {
        return "map";
    }

    @RequestMapping(value = "/incidents/ongoing", method = RequestMethod.POST)
    public @ResponseBody
    List<Incident> readOngoingIncidents() {
        System.out.println("view to controller request: ongoing incidents");

        final List<Incident> ongoingIncidents = trafficInfoService.read("ongoing", Incident.class);

        // incidentMap is a hashMap with values
        // jackson is unable to process it and causes a internal server error 500
        for (final Incident i : ongoingIncidents) {
            // clear the hashmap to temporary solve the problem
            i.getIncidentMap().clear();
        }

        System.out.println("ongoingIncidents size: " + ongoingIncidents.size());

        return ongoingIncidents;
    }

    @RequestMapping(value = "/incidents/between", method = RequestMethod.POST)
    public @ResponseBody
    List<Incident> readByTimestampBetween(@RequestParam final String startTimestamp, @RequestParam final String endTimestamp) {
        System.out.println("startTimestamp: " + startTimestamp);
        System.out.println("endTimestamp: " + endTimestamp);

        final List<Incident> betweenIncidents = trafficInfoService.readByTimestampBetween(startTimestamp, endTimestamp);

        // incidentMap is a hashMap with values
        // jackson is unable to process it and causes a internal server error 500
        for (final Incident i : betweenIncidents) {
            // clear the hashmap to temporary solve the problem
            i.getIncidentMap().clear();
        }

        return betweenIncidents;
    }
}
