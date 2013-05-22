package org.birdseye.domain;

import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;

public abstract class TrafficEvent {

    protected ObjectId eventId; // this is not the id

    @Id
    private String id;

    private String type;
    private String message;
    private String createDate;
    private String summary;
    private String dateOccurred;
    private String timeOccurred;
    private String timeElapsed;
    private boolean resolved = false;

    public TrafficEvent() {
        // default constructor
    }

    public TrafficEvent(final String eventId) {
        this.eventId = new ObjectId(eventId);
    }

    public String getId() {
        return id;
    }

    public void setId(final String id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(final String type) {
        this.type = type;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(final String message) {
        this.message = message;
    }

    public String getCreateDate() {
        return createDate;
    }

    public void setCreateDate(final String createDate) {
        this.createDate = createDate;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(final String summary) {
        this.summary = summary;
    }

    public String getDateOccurred() {
        return dateOccurred;
    }

    public void setDateOccurred(final String dateOccurred) {
        this.dateOccurred = dateOccurred;
    }

    public String getTimeOccurred() {
        return timeOccurred;
    }

    public void setTimeOccured(final String timeOccurred) {
        this.timeOccurred = timeOccurred;
    }

    public String getTimeElapsed() {
        return timeElapsed;
    }

    public void setTimeElapsed(final String timeElapsed) {
        this.timeElapsed = timeElapsed;
    }

    public boolean isResolved() {
        return resolved;
    }

    public void setResolved(final boolean resolved) {
        this.resolved = resolved;
    }

}
