package org.birdseye.domain;

import org.springframework.data.mongodb.core.mapping.Document;

@Document
public class Similarity {

    private Incident targetIncident;
    private Incident bestMatch;

    private String timeApart;
    private String similarity;

    public Similarity() {
    }

    public Similarity(final Incident targetIncident, final Incident bestMatch) {
        this.targetIncident = targetIncident;
        this.bestMatch = bestMatch;
    }

    public Incident getTargetIncident() {
        return targetIncident;
    }

    public void setTargetIncident(final Incident targetIncident) {
        this.targetIncident = targetIncident;
    }

    public Incident getBestMatch() {
        return bestMatch;
    }

    public void setBestMatch(final Incident bestMatch) {
        this.bestMatch = bestMatch;
    }

    public String getTimeApart() {
        return timeApart;
    }

    public void setTimeApart(final String timeApart) {
        this.timeApart = timeApart;
    }

    public String getSimilarity() {
        return similarity;
    }

    public void setSimilarity(final String similarity) {
        this.similarity = similarity;
    }
}
