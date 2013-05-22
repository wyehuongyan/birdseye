package org.birdseye.stream;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLConnection;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import org.birdseye.domain.Incident;
import org.dom4j.Document;
import org.dom4j.DocumentException;
import org.dom4j.Node;
import org.dom4j.io.SAXReader;
import org.jaxen.JaxenException;
import org.jaxen.SimpleNamespaceContext;
import org.jaxen.XPath;
import org.jaxen.dom4j.Dom4jXPath;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;

public final class TrafficInfoStream {

    @Autowired
    private MongoTemplate mongoTemplate;

    // singleton class
    private static final TrafficInfoStream instance = new TrafficInfoStream();
    private final String accountKey = "1q/jd++tN8SbIqLRVUkXww==";
    private final String uniqueId = "a9e07632-464d-4a76-96c5-18d1f4e214a5";

    // keyword library, keyword and position, -1 implies doesn't exist
    private final String keywords[][] = { { "at", "-1" }, { "on", "-1" }, { "in", "-1" }, { "towards", "-1" }, { "after", "-1" }, { "before", "-1" },
            { "near", "-1" }, { "between", "-1" }, { "with congestion till", "-1" }, { "avoid", "-1" } };

    // private constructor
    private TrafficInfoStream() {
        if (instance != null) {
            throw new IllegalStateException("TrafficInfoStream already instantiated");
        }
    }

    public static TrafficInfoStream getInstance() {
        return instance;
    }

    private Incident parseIncidentEntry(final Node node, final HashMap<String, String> map) throws JaxenException {
        final XPath xPath = new Dom4jXPath(".//d:*");
        xPath.setNamespaceContext(new SimpleNamespaceContext(map));

        System.out.println("node: " + node.asXML());

        final List<Node> nodes = xPath.selectNodes(node);
        System.out.println("No. of d-namespace nodes: " + nodes.size());

        final String incidentId = nodes.get(0).getText();
        final String message = nodes.get(1).getText();
        final String latitude = nodes.get(2).getText();
        final String longtitude = nodes.get(3).getText();
        final String type = nodes.get(4).getText();
        final String summary = nodes.get(5).getText();
        final String createDate = nodes.get(6).getText();
        final String distance = nodes.get(7).getText();

        // extract date occurred and time occurred from message
        final String messageValues[] = message.split(" ");
        final String dateTime = messageValues[0];

        System.out.println("dateTime: " + dateTime);

        final String dateTimeValues[] = dateTime.split("\\)");

        final String dateOccurred = dateTimeValues[0].substring(1);
        final String timeOccurred = dateTimeValues[1];

        System.out.println("dateOccurred: " + dateOccurred);
        System.out.println("timeOccurred: " + timeOccurred);

        // put into Incident
        final Incident incident = new Incident(incidentId);

        incident.setId(String.format("%s_%s_%s_%s", dateOccurred, timeOccurred, latitude, longtitude)); // custom id
        incident.setMessage(message);
        incident.setLatitude(latitude);
        incident.setLongtitude(longtitude);
        incident.setType(type);
        incident.setSummary(summary);
        incident.setCreateDate(createDate);
        incident.setDistance(distance);

        incident.setDateOccurred(dateOccurred);
        incident.setTimeOccured(timeOccurred);

        // TODO: time elapsed not set

        return incident;
    }

    private void filterIncidents(final ArrayList<Incident> incidentList) {
        // check if an incident already exists in DB
        // if exists, what needs to be updated
        // and which incidents have been resolved?
    }

    private void extractIncidentInfo(final Incident incident) {
        // using the library of keywords to identify the important information

    }

    public void retrieveIncidentData() {

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

            System.out.println("inputstream: " + urlConn.getInputStream());
            System.out.println("document: " + document.asXML());

            final List<Node> nodes = xPath.selectNodes(document);

            System.out.println("m:properties list size: " + nodes.size());

            final ArrayList<Incident> incidentList = new ArrayList<Incident>();

            for (final Node node : nodes) {
                // extract valuable information
                incidentList.add(parseIncidentEntry(node, map));
            }

            // TODO: run filterIncidents(incidentList);

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
