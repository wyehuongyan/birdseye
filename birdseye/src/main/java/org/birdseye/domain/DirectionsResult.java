package org.birdseye.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document
public class DirectionsResult {

    @Id
    private String id;
    private String name;
    private String startTimestamp;
    private String directionsResult;

    public DirectionsResult() {

    }

    public DirectionsResult(final String id, final String path) {
        this.id = id;
        this.directionsResult = path;
    }

    public String getId() {
        return id;
    }

    public void setId(final String id) {
        this.id = id;
    }

    public String getDirectionsResult() {
        return directionsResult;
    }

    public void setDirectionsResult(final String directionsResult) {
        this.directionsResult = directionsResult;
    }

    public String getName() {
        return name;
    }

    public void setName(final String name) {
        this.name = name;
    }

    public String getStartTimestamp() {
        return startTimestamp;
    }

    public void setStartTimestamp(final String startTimestamp) {
        this.startTimestamp = startTimestamp;
    }
}
