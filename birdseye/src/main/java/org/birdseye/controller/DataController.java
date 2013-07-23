package org.birdseye.controller;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.birdseye.domain.CongestionResult;
import org.birdseye.domain.DirectionsResult;
import org.birdseye.domain.Expressway;
import org.birdseye.domain.Incident;
import org.birdseye.domain.Ramp;
import org.birdseye.domain.Similarity;
import org.birdseye.domain.Summary;
import org.birdseye.service.TrafficInfoService;
import org.birdseye.stream.TrafficInfoStream;
import org.codehaus.jackson.JsonFactory;
import org.codehaus.jackson.JsonParseException;
import org.codehaus.jackson.JsonParser;
import org.codehaus.jackson.JsonToken;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
@RequestMapping("/data")
public class DataController {

    @Autowired
    TrafficInfoService trafficInfoService;

    private static final String[] filters = new String[] { "till", "exit", "entrance", "with" };
    private static final String[] expressways = new String[] { "BKE", "PIE", "CTE", "KPE", "KJE", "TPE", "ECP", "AYE", "SLE" };
    private static final Map<String, String> expressMap;
    static {
        expressMap = new HashMap<String, String>();
        expressMap.put("BKE", "Bukit Timah Expressway");
        expressMap.put("PIE", "Pan Island Expressway");
        expressMap.put("CTE", "Central Expressway");
        expressMap.put("KPE", "Kallang-Paya Lebar Expressway");
        expressMap.put("KJE", "Kranji Expressway");
        expressMap.put("TPE", "Tampines Expressway");
        expressMap.put("ECP", "East Coast Parkway");
        expressMap.put("AYE", "Ayer Rajah Expressway");
        expressMap.put("SLE", "Seletar Expressway");
    }

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

    @RequestMapping(value = "/incidents/between", method = RequestMethod.POST)
    public @ResponseBody
    List<Incident> readByTimestampBetween(@RequestParam final String startTimestamp, @RequestParam final String endTimestamp) {
        // System.out.println("startTimestamp: " + startTimestamp);
        // System.out.println("endTimestamp: " + endTimestamp);

        final List<Incident> betweenIncidents = trafficInfoService.readByTimestampBetween(startTimestamp, endTimestamp);

        // incidentMap is a hashMap with values
        // jackson is unable to process it and causes a internal server error 500
        for (final Incident i : betweenIncidents) {
            // clear the hashmap to temporary solve the problem
            i.getIncidentMap().clear();
        }

        return betweenIncidents;
    }

    @RequestMapping(value = "/incidents/directions", method = RequestMethod.POST)
    public @ResponseBody
    Boolean updateDirections(@RequestParam final String directions) {
        System.out.println("directionResult(s): " + directions);

        final JsonFactory jfactory = new JsonFactory();

        try {
            final JsonParser jParser = jfactory.createJsonParser(directions);

            DirectionsResult directionsResult = null;

            while (jParser.nextToken() != JsonToken.END_ARRAY) {

                final String fieldname = jParser.getCurrentName();

                // System.out.println("cur fieldname: " + fieldname);

                if ("id".equals(fieldname)) {
                    jParser.nextToken(); // move to next to get value
                    System.out.println("incidentId: " + jParser.getText()); // display value

                    directionsResult = new DirectionsResult();
                    directionsResult.setId(jParser.getText());

                }

                if ("name".equals(fieldname)) {
                    jParser.nextToken(); // move to next to get value
                    System.out.println("name: " + jParser.getText()); // display value

                    directionsResult.setName(jParser.getText());

                }

                if ("startTimestamp".equals(fieldname)) {
                    jParser.nextToken(); // move to next to get value
                    System.out.println("startTimestamp: " + jParser.getText()); // display value

                    directionsResult.setStartTimestamp(jParser.getText());

                }

                if ("directionsResult".equals(fieldname)) {
                    jParser.nextToken(); // move to next to get value
                    System.out.println("directionsResult: " + jParser.getText()); // value

                    directionsResult.setDirectionsResult(jParser.getText());

                    // write directionsResult to the direction collection in the db
                    trafficInfoService.insert(directionsResult);
                }
            }

            jParser.close();

        } catch (final JsonParseException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        } catch (final IOException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        }

        return true;
    }

    @RequestMapping(value = "/incidents/congestion", method = RequestMethod.POST)
    public @ResponseBody
    CongestionResult getCongestion(@RequestParam final String startTimestamp, @RequestParam final String endTimestamp) {
        // System.out.println("startTimestamp: " + startTimestamp);
        // System.out.println("endTimestamp: " + endTimestamp);

        final List<Incident> betweenIncidents = trafficInfoService.readByTimestampBetween(startTimestamp, endTimestamp);
        final List<Incident> congestionIncidents = new ArrayList<Incident>();
        final List<Incident> newCongestionIncidents = new ArrayList<Incident>();

        // extract all incidents with congestion or between as keyword
        for (final Incident i : betweenIncidents) {
            if (i.getIncidentMap().containsKey("congestion") || i.getIncidentMap().containsKey("between")) {
                congestionIncidents.add(i);
            }
        }

        // among these congestionIncidents, which are the ones with existing DirectionResult?
        // remove those that already have existing DirectionResult
        // and work on those that do not
        final List<DirectionsResult> existingDirections = new ArrayList<DirectionsResult>();

        for (final Incident c : congestionIncidents) {
            // retrieve all Direction objects from Directions collection
            final List<DirectionsResult> directions = trafficInfoService.read("direction", DirectionsResult.class);
            Boolean exist = false;

            // compare congestionIncidents' ID with Direction ID
            for (final DirectionsResult dr : directions) {
                if ((c.getId().equals(dr.getId()))) {
                    exist = true;

                    // add to special array for later use
                    existingDirections.add(dr);

                    break;
                }
            }

            if (!exist) {
                // those incidents that are not in the directions collection will be processed
                newCongestionIncidents.add(c);
            }
        }

        // processing of incidents not in directions collection starts here
        int count = 0;
        final List<Expressway> expresswayList = new ArrayList<Expressway>();

        // check congestionIncident with expressways' ramps to retrieve point to point info
        for (final Incident c : newCongestionIncidents) {
            String location1 = "";
            String location2 = "";
            String timestamp = "";

            // narrow down to which expressway
            final Object on = c.getIncidentMap().get("on");
            final Object at = c.getIncidentMap().get("at");

            if (c.getIncidentMap().containsKey("congestion")) {
                final Object congestion = c.getIncidentMap().get("congestion");
                final Object before = c.getIncidentMap().get("before");
                final Object after = c.getIncidentMap().get("after");

                // System.out.println("message: " + c.getMessage());
                // System.out.println("before:" + before);
                // System.out.println("after:" + after);
                // System.out.println("at:" + at);
                // System.out.println("congestion:" + congestion);

                // filter and form process
                // for "before" and after
                if (before != null || after != null) {
                    if (before != null) {
                        for (final String s : (ArrayList<String>)before) {
                            if (Arrays.asList(filters).contains(s.toLowerCase())) {
                                // if contains do nth
                            } else {
                                if (s.equalsIgnoreCase("avenue")) {
                                    location1 += " " + "Ave";
                                } else if (s.equalsIgnoreCase("road")) {
                                    location1 += " " + "Rd";
                                } else if (Arrays.asList(expressways).contains(s)) {
                                    // check for expressway short form and expand to long form
                                    // BKE = Bukit Timah Expressway
                                    location1 += " " + expressMap.get(s);
                                } else {
                                    // form the word
                                    location1 += " " + s;
                                }
                            }
                        }
                    } else if (after != null) {
                        for (final String s : (ArrayList<String>)after) {
                            if (Arrays.asList(filters).contains(s.toLowerCase())) {
                                // if contains do nth
                            } else {
                                if (s.equalsIgnoreCase("avenue")) {
                                    location1 += " " + "Ave";
                                } else if (s.equalsIgnoreCase("road")) {
                                    location1 += " " + "Rd";
                                } else if (Arrays.asList(expressways).contains(s)) {
                                    // check for expressway short form and expand to long form
                                    // BKE = Bukit Timah Expressway
                                    location1 += " " + expressMap.get(s);
                                } else {
                                    // form the word
                                    location1 += " " + s;
                                }
                            }
                        }
                    }

                    // for "congestion"
                    for (final String s : (ArrayList<String>)congestion) {
                        if (Arrays.asList(filters).contains(s.toLowerCase())) {
                            // if contains do nth
                        } else {
                            if (s.equalsIgnoreCase("avenue")) {
                                location2 += " " + "Ave";
                            } else if (s.equalsIgnoreCase("road")) {
                                location2 += " " + "Rd";
                            } else if (Arrays.asList(expressways).contains(s)) {
                                // check for expressway short form and expand to long form
                                // BKE = Bukit Timah Expressway
                                location2 += " " + expressMap.get(s);
                            } else {
                                // form the word
                                location2 += " " + s;
                            }
                        }
                    }

                    location1 = location1.substring(1);
                    location2 = location2.substring(1);
                    timestamp = c.getStartTimestamp();

                    // System.out.println("location1: " + location1 + ", length: " + location1.length());
                    // System.out.println("location2: " + location2 + ", length: " + location2.length());

                }
            } else if (c.getIncidentMap().containsKey("between")) {
                // keyword "between"
                final Object between = c.getIncidentMap().get("between");

                for (final String s : ((ArrayList<String>)between)) {
                    if (Arrays.asList(filters).contains(s.toLowerCase())) {
                        // if contains do nth
                    } else {
                        if (s.equalsIgnoreCase("avenue")) {
                            location1 += " " + "Ave";
                        } else if (s.equalsIgnoreCase("road")) {
                            location1 += " " + "Rd";
                        } else if (Arrays.asList(expressways).contains(s)) {
                            // check for expressway short form and expand to long form
                            // BKE = Bukit Timah Expressway
                            location1 += " " + expressMap.get(s);
                        } else {
                            location1 += " " + s;
                        }
                    }
                }

                // keyword "and" is the delimiter
                final String[] locations = location1.split(" and ");

                location1 = locations[0].substring(1);
                location2 = locations[1];
                timestamp = c.getStartTimestamp();

                System.out.println("location1: " + location1);
                System.out.println("location2: " + location2);
            }

            // compare with TrafficInfoStream.expresswayList
            // for highest number of matched words with ramp
            // there must be two ramp matches before expressway is accepted
            for (final Expressway e : TrafficInfoStream.expresswayList) {
                Boolean validLocation1 = false;
                Boolean validLocation2 = false;

                final Ramp[] ramps = new Ramp[2];
                Ramp ramp1 = null;
                Ramp ramp2 = null;

                // System.out.println(e.getName());

                if (on != null) {
                    // on is not null, directly select the expressway who's name startswith "on" val
                    if (e.getName().startsWith((String)((ArrayList)on).get(0))) {
                        // System.out.println("on size: " + ((ArrayList)on).size());
                        for (final Ramp r : e.getRamps()) {
                            if (org.apache.commons.lang.StringUtils.containsIgnoreCase(r.getName(), location1)) {
                                if (!validLocation2 && !validLocation1) {
                                    // System.out.println(String.format("on Matched 1: %s - %s", r.getName(), location1));
                                    // order matters, 1 then 2
                                    // no overwriting
                                    validLocation1 = true;

                                    ramp1 = r;
                                }
                            }

                            if (org.apache.commons.lang.StringUtils.containsIgnoreCase(r.getName(), location2)) {
                                if (validLocation1 && !validLocation2) {
                                    // System.out.println(String.format("on Matched 2: %s - %s", r.getName(), location2));
                                    validLocation2 = true;

                                    ramp2 = r;
                                }
                            }
                        }
                    }
                } else {
                    // on is null, go through all expressways
                    for (final Ramp r : e.getRamps()) {
                        if (org.apache.commons.lang.StringUtils.containsIgnoreCase(r.getName(), location1)) {
                            if (!validLocation2 && !validLocation1) {
                                // System.out.println(String.format("Matched 1: %s - %s", r.getName(), location1));
                                // order matters, 1 then 2
                                // no overwriting
                                validLocation1 = true;

                                ramp1 = r;
                            }
                        }

                        if (org.apache.commons.lang.StringUtils.containsIgnoreCase(r.getName(), location2)) {
                            if (validLocation1 && !validLocation2) {
                                // System.out.println(String.format("Matched 2: %s - %s", r.getName(), location2));
                                validLocation2 = true;

                                ramp2 = r;
                            }
                        }
                    }
                }

                // increase matchcount only when there are two ramps matched in one expressway
                if (validLocation1 == true && validLocation2 == true) {
                    if (ramp1.getName() != ramp2.getName()) {
                        // System.out.println("Expressway valid! " + e.getName());
                        // System.out.println("Expressway valid! " + c.getMessage());
                        count++;

                        // add ramps into ramp array
                        ramps[0] = ramp1;
                        ramps[1] = ramp2;

                        final Expressway expressway = new Expressway();
                        expressway.setIncidentId(c.getId());
                        expressway.setName(e.getName());
                        expressway.setRamps(ramps);
                        expressway.setStartTimestamp(timestamp);

                        expresswayList.add(expressway);
                    }
                }
            }
        }

        System.out.println("Final count " + count);
        System.out.println("expresswayList size: " + expresswayList.size());

        // add directionResultList and expresswayList into CongestionResult object
        final CongestionResult congestionResult = new CongestionResult();
        congestionResult.setDirectionsResults(existingDirections);
        congestionResult.setExpressways(expresswayList);

        return congestionResult;
    }

    // Correlation method using Cosine Similarity
    // similar to readByTimestampBetween, but requires two incident types to compare
    @RequestMapping(value = "/incidents/similarity", method = RequestMethod.POST)
    public @ResponseBody
    Summary getCorrelationBetween(@RequestParam final String startTimestamp, @RequestParam final String endTimestamp,
            @RequestParam final String type1, @RequestParam final String type2, @RequestParam final String radius, @RequestParam final String time) {

        /*
         * System.out.println("startTimestamp: " + startTimestamp); System.out.println("endTimestamp: " + endTimestamp); System.out.println("type1: "
         * + type1); System.out.println("type2: " + type2); System.out.println("radius: " + radius); System.out.println("time: " + time);
         */

        final List<Incident> betweenIncidents = trafficInfoService.readByTimestampBetween(startTimestamp, endTimestamp);

        final ArrayList<Incident> type1Array = new ArrayList<Incident>();
        final ArrayList<Incident> type2Array = new ArrayList<Incident>();

        // retrieve only incidents of type1 and type2
        for (final Incident i : betweenIncidents) {
            final String incidentType = i.getType();

            if (incidentType.equalsIgnoreCase(type1)) {
                // store into array
                type1Array.add(i);
            }
            if (incidentType.equalsIgnoreCase(type2)) {
                // store into array
                type2Array.add(i);
            }
        }

        // normalize
        // final ArrayList<Incident> normalizedType1 = zScoreNormalize(type1Array);
        // final ArrayList<Incident> normalizedType2 = zScoreNormalize(type2Array);

        int numMatches = 0;
        final Double cosSimSum = 0.0d;
        final List<Similarity> cosSimilarities = new ArrayList<Similarity>(); // to store all the pairs

        // perform cosine similarity comparison between the two arrays
        for (final Incident i : type1Array) {
            Double cosSim = 0.0d;
            Incident bestMatch = new Incident();
            Double timeApart = 0.0d;

            for (final Incident j : type2Array) {
                // check if timestamps of both events lie within 30mins of each other
                final Double diff = Math.abs(Double.parseDouble(i.getStartTimestamp()) - Double.parseDouble(j.getStartTimestamp()));

                if (diff <= (Double.parseDouble(time) * 60 * 1000)) {
                    // Important note: incidents have no minimum range between each other
                    // we need a minimum range for more accurate results
                    // reuse haversine formula from javascript
                    if (getDistanceFromLatLonInKm(Double.parseDouble(i.getLatitude()), Double.parseDouble(i.getLongitude()),
                            Double.parseDouble(j.getLatitude()), Double.parseDouble(j.getLongitude())) <= Double.parseDouble(radius)) {
                        // find best matching pair using cosine similarity
                        final Double tempCosSim = cosineSimilarity(i, j);

                        // the nearer to 1 the more similar
                        if (tempCosSim > cosSim) {
                            // System.out.println("> tempCosSim:" + tempCosSim);

                            cosSim = tempCosSim;
                            bestMatch = j;
                            timeApart = diff;
                            numMatches++;
                        }
                    }
                }
            }

            // create similarity object with the pair of best matched incidents
            // incidentMap is a hashMap with values
            // jackson is unable to process it and causes a internal server error 500
            i.getIncidentMap().clear();
            bestMatch.getIncidentMap().clear();

            final Similarity similarity = new Similarity(i, bestMatch);
            similarity.setSimilarity(cosSim.toString());

            // converting the time apart from milliseconds to hrs mins and secs
            final int seconds = (int)(timeApart / 1000) % 60;
            final int minutes = (int)((timeApart / (1000 * 60)) % 60);
            final int hours = (int)((timeApart / (1000 * 60 * 60)) % 24);
            similarity.setTimeApart(String.format("%s", minutes));

            cosSimilarities.add(similarity); // add to list

            // debug
            /*
             * System.out.println(String.format("Type: %s, Lat: %s, Long: %s, Time: %s", i.getType(), i.getLatitude(), i.getLongitude(),
             * i.getStartTimestamp())); System.out.println(String.format("Type: %s, Lat: %s, Long: %s, Time: %s", bestMatch.getType(),
             * bestMatch.getLatitude(), bestMatch.getLongitude(), bestMatch.getStartTimestamp())); System.out.println("cosSim:" + cosSim + "\n");
             */

            // cosSimSum += cosSim; // increment the sum of all cosSims
        }

        // System.out.println("cosSimSum: " + cosSimSum);

        // final Double cosSimMean = cosSimSum / type1Array.size(); // value depicting how similar type1 and type 2 are

        // System.out.println(String.format("Cosine Similarity between %s and %s is %s", type1, type2, cosSimMean));

        // pack into a summary entity
        final Summary summary = new Summary(type1Array.size(), type2Array.size(), cosSimilarities, numMatches);

        return summary;
    }

    // haversine formula
    private static Double getDistanceFromLatLonInKm(final Double lat1, final Double lon1, final Double lat2, final Double lon2) {
        final Double earthRadius = 6371.0d; // radius of the earth in km
        final Double dLat = deg2rad(lat2 - lat1);
        final Double dLon = deg2rad(lon2 - lon1);

        final Double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2)
                * Math.sin(dLon / 2);

        final Double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        final Double d = earthRadius * c; // Distance in km

        return d;
    }

    private static Double deg2rad(final Double deg) {
        return deg * (Math.PI / 180);
    }

    // normalization and cosine similarity methods
    private static Incident compress(final ArrayList<Incident> incidents) {
        // this function takes the mean of each attribute, resulting in a single 3d vector
        // i.e. a single incident

        Double latSum = 0.0d;
        Double longSum = 0.0d;
        Double timeSum = 0.0d;

        for (final Incident i : incidents) {
            latSum += Double.parseDouble(i.getLatitude());
            longSum += Double.parseDouble(i.getLongitude());
            timeSum += Double.parseDouble(i.getStartTimestamp());
        }

        // average
        final Double latMean = latSum / incidents.size();
        final Double longMean = longSum / incidents.size();
        final Double timeMean = timeSum / incidents.size();

        final Incident temp = new Incident();
        temp.setLatitude(latMean.toString());
        temp.setLongitude(longSum.toString());
        temp.setStartTimestamp(timeSum.toString());

        return temp;
    }

    private static Double cosineSimilarity(final Incident incident1, final Incident incident2) {
        // cosine similarity: (d1.d2)/(||d1||*||d2||)

        // dot product
        final Double latMultiple = Double.parseDouble(incident1.getLatitude()) * Double.parseDouble(incident2.getLatitude());
        final Double longMultiple = Double.parseDouble(incident1.getLongitude()) * Double.parseDouble(incident2.getLongitude());
        final Double timeMultiple = Double.parseDouble(incident1.getStartTimestamp()) * Double.parseDouble(incident2.getStartTimestamp());

        final Double dotProd = latMultiple + longMultiple + timeMultiple;

        // vector length
        final Double magnitude1 = Math.sqrt((Double.parseDouble(incident1.getLatitude()) * Double.parseDouble(incident1.getLatitude()))
                + (Double.parseDouble(incident1.getLongitude()) * Double.parseDouble(incident1.getLongitude()))
                + (Double.parseDouble(incident1.getStartTimestamp()) * Double.parseDouble(incident1.getStartTimestamp())));
        final Double magnitude2 = Math.sqrt((Double.parseDouble(incident2.getLatitude()) * Double.parseDouble(incident2.getLatitude()))
                + (Double.parseDouble(incident2.getLongitude()) * Double.parseDouble(incident2.getLongitude()))
                + (Double.parseDouble(incident2.getStartTimestamp()) * Double.parseDouble(incident2.getStartTimestamp())));

        return (dotProd / (magnitude1 * magnitude2));
    }

    private static Double[] mean(final ArrayList<Incident> incidentList) {
        final int numIncidents = incidentList.size();

        final Double mean[] = new Double[3];
        Double latSum = 0.0d;
        Double longSum = 0.0d;
        Double timeSum = 0.0d;

        for (int j = 0; j < numIncidents; j++) {
            final Incident i = incidentList.get(j);

            latSum += Double.parseDouble(i.getLatitude());
            longSum += Double.parseDouble(i.getLongitude());
            timeSum += Double.parseDouble(i.getStartTimestamp());
        }

        mean[0] = latSum / numIncidents;
        mean[1] = longSum / numIncidents;
        mean[2] = timeSum / numIncidents;

        System.out.println(mean);

        return mean;
    }

    private static Double[] standardDeviation(final ArrayList<Incident> incidentList, final Double[] mean) {
        final int numIncidents = incidentList.size();

        final Double standardDeviation[] = new Double[3];

        Double latSquaredDifference = 0.0d;
        Double longSquaredDifference = 0.0d;
        Double timeSquaredDifference = 0.0d;
        Double m = 0.0d;

        for (int k = 0; k < numIncidents; k++) {
            final Incident i = incidentList.get(k);

            // stdev for lat, lng and time
            m = mean[0];
            latSquaredDifference += ((Double.parseDouble(i.getLatitude()) - m) * (Double.parseDouble(i.getLatitude()) - m));

            m = mean[1];
            longSquaredDifference += ((Double.parseDouble(i.getLongitude()) - m) * (Double.parseDouble(i.getLongitude()) - m));

            m = mean[2];
            timeSquaredDifference += ((Double.parseDouble(i.getStartTimestamp()) - m) * (Double.parseDouble(i.getStartTimestamp()) - m));
        }

        standardDeviation[0] = Math.sqrt((latSquaredDifference / numIncidents));
        standardDeviation[1] = Math.sqrt((longSquaredDifference / numIncidents));
        standardDeviation[2] = Math.sqrt((timeSquaredDifference / numIncidents));

        System.out.println(standardDeviation);

        return standardDeviation;
    }

    private static ArrayList<Incident> zScoreNormalize(final ArrayList<Incident> toBeNormalized) {
        final ArrayList<Incident> normalizedIncidents = new ArrayList<Incident>();

        Double normalizedLat = 0.0d;
        Double normalizedLong = 0.0d;
        Double normalizedTime = 0.0d;

        final Double mean[] = mean(toBeNormalized);
        final Double stdev[] = standardDeviation(toBeNormalized, mean);

        for (int j = 0; j < toBeNormalized.size(); j++) {
            final Incident i = toBeNormalized.get(j);

            normalizedLat = (Double.parseDouble(i.getLatitude()) - mean[0]) / stdev[0];
            normalizedLong = (Double.parseDouble(i.getLongitude()) - mean[1]) / stdev[1];
            normalizedTime = (Double.parseDouble(i.getStartTimestamp()) - mean[2]) / stdev[2];

            final Incident temp = new Incident();
            temp.setType(i.getType());
            temp.setLatitude(normalizedLat.toString());
            temp.setLongitude(normalizedLong.toString());
            temp.setStartTimestamp(normalizedTime.toString());

            normalizedIncidents.add(temp);
        }

        return normalizedIncidents;
    }
}