package org.birdseye.domain;

import org.springframework.data.annotation.Id;

public abstract class TrafficEvent {

    protected String eventId; // this is not the id

    @Id
    private String id;

    private String type;
    private String message;
    private String startTimestamp;
    private String endTimestamp;
    private String createDate;
    private String summary;
    private String dateOccurred;
    private String timeOccurred;
    private String timeElapsed;

    public TrafficEvent() {
        // default constructor
    }

    public TrafficEvent(final String eventId) {
        this.eventId = eventId;
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

    public String getStartTimestamp() {
        return startTimestamp;
    }

    public void setStartTimestamp(final String startTimestamp) {
        this.startTimestamp = startTimestamp;
    }

    public String getEndTimestamp() {
        return endTimestamp;
    }

    public void setEndTimestamp(final String endTimestamp) {
        this.endTimestamp = endTimestamp;
    }

}
