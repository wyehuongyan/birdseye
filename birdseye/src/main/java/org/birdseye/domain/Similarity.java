package org.birdseye.domain;

import java.util.List;
import org.springframework.data.mongodb.core.mapping.Document;

@Document
public class Similarity {

    private Incident targetIncident;
    private Incident bestMatch;
    private List<ProcessedImage> bestImages;

    private String timeApart;
    private String similarity;

    public Similarity() {
    }

    public Similarity(final Incident targetIncident, final Incident bestMatch, final List<ProcessedImage> bestImages) {
        this.targetIncident = targetIncident;
        this.bestMatch = bestMatch;
        this.setBestImages(bestImages);
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

    public List<ProcessedImage> getBestImages() {
        return bestImages;
    }

    public void setBestImages(final List<ProcessedImage> bestImages) {
        this.bestImages = bestImages;
    }
}
