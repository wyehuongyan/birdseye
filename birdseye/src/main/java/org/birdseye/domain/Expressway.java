package org.birdseye.domain;

public class Expressway {

    private String name;
    private String incidentId;
    private String startTimestamp;
    private Ramp[] ramps;

    public Expressway() {
    }

    public Expressway(final String name, final Ramp[] ramps) {
        this.name = name;
        this.ramps = ramps;
    }

    public String getName() {
        return name;
    }

    public void setName(final String name) {
        this.name = name;
    }

    public Ramp[] getRamps() {
        return ramps;
    }

    public void setRamps(final Ramp[] ramps) {
        this.ramps = ramps;
    }

    public String getStartTimestamp() {
        return startTimestamp;
    }

    public void setStartTimestamp(final String startTimestamp) {
        this.startTimestamp = startTimestamp;
    }

    public String getIncidentId() {
        return incidentId;
    }

    public void setIncidentId(final String incidentId) {
        this.incidentId = incidentId;
    }

}
