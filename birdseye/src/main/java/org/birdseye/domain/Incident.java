package org.birdseye.domain;

import java.util.HashMap;
import org.springframework.data.mongodb.core.mapping.Document;

@Document
public class Incident extends TrafficEvent {

    private String latitude;
    private String longitude;
    private String distance;

    private final HashMap<String, String[]> incidentMap = new HashMap<String, String[]>();

    public Incident() {
        super();
    }

    public Incident(final String eventId) {
        super(eventId);
    }

    public String getLatitude() {
        return latitude;
    }

    public void setLatitude(final String latitude) {
        this.latitude = latitude;
    }

    public String getLongitude() {
        return longitude;
    }

    public void setLongitude(final String longitude) {
        this.longitude = longitude;
    }

    public String getDistance() {
        return distance;
    }

    public void setDistance(final String distance) {
        this.distance = distance;
    }

    public void setId(final String latitude, final String longtitude) {
        // create custom id

        // finally, set id to superclass
        // super.setId(customId);
    }

    public HashMap<String, String[]> getIncidentMap() {
        return incidentMap;
    }

}
