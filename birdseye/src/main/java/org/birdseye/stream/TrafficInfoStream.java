package org.birdseye.stream;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLConnection;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Timer;
import java.util.TimerTask;
import javax.annotation.PreDestroy;
import org.birdseye.domain.Incident;
import org.birdseye.service.TrafficInfoService;
import org.dom4j.Document;
import org.dom4j.DocumentException;
import org.dom4j.Node;
import org.dom4j.io.SAXReader;
import org.jaxen.JaxenException;
import org.jaxen.SimpleNamespaceContext;
import org.jaxen.XPath;
import org.jaxen.dom4j.Dom4jXPath;
import org.joda.time.DateTime;
import org.joda.time.Duration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public final class TrafficInfoStream {

    @Autowired
    private TrafficInfoService trafficInfoService;

    private final String accountKey = "1q/jd++tN8SbIqLRVUkXww==";
    private final String uniqueId = "a9e07632-464d-4a76-96c5-18d1f4e214a5";

    // keyword library, keyword and position, -1 implies doesn't exist
    private final String keywords[][] = { { "at", "-1" }, { "on", "-1" }, { "in", "-1" }, { "towards", "-1" }, { "after", "-1" }, { "before", "-1" },
            { "near", "-1" }, { "between", "-1" }, { "congestion", "-1" }, { "avoid", "-1" } };

    private final Timer timer = new Timer();

    // constructor
    public TrafficInfoStream() {
        System.out.println("TrafficInfoStream constructor executed");

        // data collection task starts after 5 seconds and occurs every 3 minutes
        timer.scheduleAtFixedRate(new TrafficInfoRetrievalTask(), 5 * 1000, 3 * 60 * 1000); // timertask, when to start, delay between calls in //
                                                                                            // milliseconds
    }

    @PreDestroy
    public void clearTrafficInfoStream() {
        System.out.println("Spring lifecycle destroyer executed");

        timer.cancel();
        timer.purge();
    }

    private Incident parseIncidentEntry(final Node node, final HashMap<String, String> map) throws JaxenException {
        final XPath xPath = new Dom4jXPath(".//d:*");
        xPath.setNamespaceContext(new SimpleNamespaceContext(map));

        // System.out.println("node: " + node.asXML());

        final List<Node> nodes = xPath.selectNodes(node);
        // System.out.println("No. of d-namespace nodes: " + nodes.size());

        final String incidentId = nodes.get(0).getText();
        final String message = nodes.get(1).getText();
        final String latitude = nodes.get(2).getText();
        final String longitude = nodes.get(3).getText();
        final String type = nodes.get(4).getText();
        final String summary = nodes.get(5).getText();
        final String createDate = nodes.get(6).getText();
        final String distance = nodes.get(7).getText();

        System.out.println("Message: " + message);

        // extract date occurred and time occurred from message
        final String messageValues[] = message.split(" ");
        final String dateTime = messageValues[0];

        // System.out.println("dateTime: " + dateTime);

        // time and date that incident occurred
        final String dateTimeValues[] = dateTime.split("\\)");
        final String createDateValues[] = createDate.split("T");

        final String dateOccurred = createDateValues[0];
        final String timeOccurred = dateTimeValues[1];

        final String dateOccurredValues[] = dateOccurred.split("-");
        final String timeOccurredValues[] = timeOccurred.split(":");

        // Joda Time: year, month, day, hour, min
        System.out.println(String.format("Year: %s, month: %s, day: %s, hour: %s, min: %s", Integer.parseInt(dateOccurredValues[0]),
                Integer.parseInt(dateOccurredValues[1]), Integer.parseInt(dateOccurredValues[2]), Integer.parseInt(timeOccurredValues[0]),
                Integer.parseInt(timeOccurredValues[1])));

        final DateTime dateTimeOccurred = new DateTime(Integer.parseInt(dateOccurredValues[0]), Integer.parseInt(dateOccurredValues[1]),
                Integer.parseInt(dateOccurredValues[2]), Integer.parseInt(timeOccurredValues[0]), Integer.parseInt(timeOccurredValues[1]));

        // time and date that incident was updated
        final String dateUpdated = createDateValues[0];
        final String timeUpdated = createDateValues[1];

        final String dateUpdatedValues[] = dateUpdated.split("-");
        final String timeUpdatedValues[] = timeUpdated.split(":");

        Integer hourOfDay = Integer.parseInt(timeUpdatedValues[0]) + 8;

        if (hourOfDay >= 24) {
            hourOfDay = 0;
        }

        // Joda Time: year, month, day, hour, min, secs
        // hour + 8 because Singapore is GMT +8
        final DateTime dateTimeUpdated = new DateTime(Integer.parseInt(dateUpdatedValues[0]), Integer.parseInt(dateUpdatedValues[1]),
                Integer.parseInt(dateUpdatedValues[2]), hourOfDay, Integer.parseInt(timeUpdatedValues[1]), Integer.parseInt(timeUpdatedValues[2]
                        .substring(0, 2)));

        // calculate duration between datetime occurred and updated
        final Duration timeElapsed = new Duration(dateTimeOccurred, dateTimeUpdated);

        // put into Incident
        final Incident incident = new Incident(incidentId); // something wrong with incidentId initialisation of ObjectId
        // final Incident incident = new Incident(); // use default constructor for now

        incident.setId(String.format("%s_%s_%s_%s", dateOccurred, timeOccurred, latitude, longitude)); // custom id
        incident.setMessage(message);
        incident.setStartTimestamp(String.valueOf(dateTimeOccurred.getMillis()));
        incident.setEndTimestamp(String.valueOf(dateTimeUpdated.getMillis()));
        incident.setLatitude(latitude);
        incident.setLongitude(longitude);
        incident.setType(type);
        incident.setSummary(summary);
        incident.setCreateDate(createDate);
        incident.setDistance(distance);
        incident.setDateOccurred(dateOccurred);
        incident.setTimeOccured(timeOccurred);
        incident.setTimeElapsed(timeElapsed.toString());

        return incident;
    }

    private void filterIncidents(final ArrayList<Incident> incidentList) {
        // check if an incident already exists in DB
        // if exists, what needs to be updated
        // and which incidents have been resolved?
        // else, write incident to DB

        final List<String> ongoingIncidentIds = new ArrayList<String>();

        System.out.println("Size of incidentList: " + incidentList.size());

        for (final Incident incident : incidentList) {
            System.out.println("current incident: " + incident.getMessage());
            final Incident existingIncident = trafficInfoService.read(incident);

            if (existingIncident != null) {
                // already has incident in DB

                if (!existingIncident.getMessage().equals(incident.getMessage())) {
                    // if message is different, update incidentMap information
                    // service update will check again to update message if different
                    extractIncidentInfo(incident);
                }

                System.out.println("Existing entry, updating DB: " + incident.getMessage());

                // retrieve ongoingIncident
                final Incident ongoingIncident = trafficInfoService.read(incident, "ongoing", Incident.class);

                // check if ongoing collections has incident, if yes, put the updated incident inside
                if (ongoingIncident != null) {
                    // if contains incident, add it to list, at the end, compare with ongoingIncidents list
                    // the non-overlapping ones are the resolved ones.
                    ongoingIncidentIds.add(ongoingIncident.getId());

                    System.out.println("Ongoing incident added to List: " + ongoingIncident.getMessage());

                    // update ongoing and incident collections, new incident must replace the old ongoingIncident
                    trafficInfoService.update(incident, "ongoing", Incident.class);
                    trafficInfoService.update(incident);
                } else {
                    // not found in ongoing collection, add it to ongoing collection
                    trafficInfoService.insert(incident, "ongoing");
                    ongoingIncidentIds.add(incident.getId());

                    // update incident collections only
                    System.out.println("incident collection updated: " + incident.getMessage());
                    trafficInfoService.update(incident);
                }

            } else {
                // incident does not exist in DB
                // extract incident info, then write it to DB
                System.out.println("New entry, adding to DB: " + incident.getMessage());

                final Incident tempIncident = extractIncidentInfo(incident);

                // insert to incident collection
                trafficInfoService.insert(tempIncident);

                // insert to ongoing collection
                trafficInfoService.insert(tempIncident, "ongoing");
                ongoingIncidentIds.add(tempIncident.getId());
            }
        }

        // the incident objects left inside ongoingIncidents are the ones resolved (non-overlapped)
        // remove these incident objects from ongoing collections

        // retrieve the ongoing traffic event of Incident type only
        final List<Incident> ongoingIncidents = trafficInfoService.read("ongoing", Incident.class);
        boolean ongoing;

        for (final Incident ongoingIncident : ongoingIncidents) {
            ongoing = false;

            for (final String ongoingIncidentId : ongoingIncidentIds) {
                if (ongoingIncident.getId().equals(ongoingIncidentId)) {
                    // still ongoing, not resolved, break
                    ongoing = true;

                    break;
                }
            }

            // ongoingIncident not found to be ongoing anymore
            if (!ongoing) {
                trafficInfoService.delete(ongoingIncident, "ongoing", Incident.class);
            }
        }
    }

    private Incident extractIncidentInfo(final Incident incident) {
        // using the library of keywords to identify the important information
        final String message = incident.getMessage().replaceAll("\\(", "").replaceAll("\\)", "").replaceAll("\\.", "");
        final String messageValues[] = message.split(" "); // white space delimiter

        // check if messageValues contains a keyword
        for (final String[] keyword : keywords) {
            for (int i = 0; i < messageValues.length; i++) {
                if (messageValues[i].equalsIgnoreCase(keyword[0])) {
                    // System.out.println("Matched: " + messageValues[i]);

                    // set the position of keyword
                    keyword[1] = String.valueOf(i);

                    break; // move on to the next keyword
                }
            }
        }

        // some keywords have valid positions, some don't (-1)
        // arrange the ones with valid positions in ascending order, using custom comparator
        Arrays.sort(keywords, new Comparator<String[]>() {

            @Override
            public int compare(final String[] keywordArray1, final String[] keywordArray2) {
                // get second element of array and transform it to integer
                final Integer pos1 = Integer.parseInt(keywordArray1[1]);
                final Integer pos2 = Integer.parseInt(keywordArray2[1]);

                // ascending order
                return pos1.compareTo(pos2);
            }
        });

        // print check
        int firstOccurrence = -1;

        for (int i = 0; i < keywords.length; i++) {
            final String keyword[] = keywords[i];

            // System.out.println(String.format("Value: %s,  position: %s", keyword[0], keyword[1]));

            if (Integer.parseInt(keyword[1]) > -1) {
                firstOccurrence = i;

                // System.out.println("First Occurrence:" + firstOccurrence);
                break;
            }
        }

        // retrieve important information between the lines.
        while (firstOccurrence < keywords.length) {
            // two by two
            final Integer firstPos = Integer.parseInt(keywords[firstOccurrence][1]); // get the first position
            Integer secondPos;

            if (firstOccurrence == (keywords.length - 1)) {
                // when keyword array reaches the last element
                // secondPos is the length of messageValues, to prevent array OOB
                secondPos = messageValues.length;
            } else {
                secondPos = Integer.parseInt(keywords[firstOccurrence + 1][1]); // get the second position
            }

            final Integer diff = (secondPos - firstPos) - 1;
            final String infoArray[] = new String[diff];

            // System.out.println(String.format("secondPos: %s,firstPos: %s, diff: %s", secondPos, firstPos, diff));

            // System.out.println(String.format("> keyword: %s", keywords[firstOccurrence][0]));

            for (int i = 1; i <= diff; i++) {
                final String info = messageValues[firstPos + i];

                // System.out.println(String.format("messageValues[%s], info: %s", firstPos + i, info));

                infoArray[i - 1] = info;
            }

            // incidentHashmap assignment
            incident.getIncidentMap().put(keywords[firstOccurrence][0], infoArray);

            firstOccurrence++;
        }

        // clear keyword array back to "-1" positions
        for (final String keyword[] : keywords) {
            keyword[1] = "-1";
        }

        // System.out.println(incident.getIncidentMap());
        return incident;
    }

    class TrafficInfoRetrievalTask extends TimerTask {

        @Override
        public void run() {

            // url connection to LTA datamall for incident
            try {
                System.out.println("Retrieving incident dataset...");

                final HashMap<String, String> map = new HashMap<String, String>();
                map.put("lta", "http://www.w3.org/2005/Atom");
                map.put("m", "http://schemas.microsoft.com/ado/2007/08/dataservices/metadata");
                map.put("d", "http://schemas.microsoft.com/ado/2007/08/dataservices");

                final XPath xPath = new Dom4jXPath("//m:properties");
                xPath.setNamespaceContext(new SimpleNamespaceContext(map));

                final URL url = new URL("http://datamall.mytransport.sg/ltaodataservice.svc/IncidentSet");
                final URLConnection urlConn = url.openConnection();

                urlConn.setRequestProperty("accept", "*/*");
                urlConn.addRequestProperty("AccountKey", accountKey);
                urlConn.addRequestProperty("UniqueUserID", uniqueId);

                final SAXReader reader = new SAXReader();
                final Document document = reader.read(urlConn.getInputStream());

                // System.out.println("inputstream: " + urlConn.getInputStream());
                // System.out.println("document: " + document.asXML());

                final List<Node> nodes = xPath.selectNodes(document);

                System.out.println("m:properties list size: " + nodes.size());

                final ArrayList<Incident> incidentList = new ArrayList<Incident>();

                for (final Node node : nodes) {
                    // extract valuable information
                    incidentList.add(parseIncidentEntry(node, map));
                }

                filterIncidents(incidentList);

            } catch (final MalformedURLException e) {
                e.printStackTrace();
            } catch (final IOException e) {
                e.printStackTrace();
            } catch (final DocumentException e) {
                e.printStackTrace();
            } catch (final JaxenException e) {
                e.printStackTrace();
            }
        }
    }
}
