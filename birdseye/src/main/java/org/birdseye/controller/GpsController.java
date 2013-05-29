package org.birdseye.controller;

import java.util.List;
import org.birdseye.domain.Gps;
import org.birdseye.service.GpsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
@RequestMapping("/gps")
public class GpsController {

    @Autowired
    GpsService gpsService;

    @RequestMapping
    public String getGPSPage() {
        return "map";
    }

    @RequestMapping(value = "/get", method = RequestMethod.POST)
    public @ResponseBody
    List<Gps> readByUserid(@RequestBody final Gps gps) {
        // gps is a json post request from client
        // i.e. { "userid" : "002" }

        System.out.println("userid: " + gps.getUserid());

        return gpsService.readByUserid(gps.getUserid());
    }

    @RequestMapping(value = "/get/period", method = RequestMethod.POST)
    public @ResponseBody
    List<Gps> readByUseridAndTimestampBetween(@RequestParam final String startTimestamp, @RequestParam final String endTimestamp,
            @RequestParam final String userid) {

        System.out.println("startTimestamp: " + startTimestamp);
        System.out.println("endTimestamp: " + endTimestamp);
        System.out.println("userid: " + userid);

        return gpsService.readByUseridAndTimestampBetween(userid, startTimestamp, endTimestamp);
    }
}
