package org.birdseye.domain;

import java.util.List;

public class Summary {

    private int numTargetIncident;
    private int numBestMatch;
    private List<Similarity> cosSimilarities;
    private int numMatches;

    public Summary(final int numTargetIncident, final int numBestMatch, final List<Similarity> cosSimilarities, final int numMatches) {
        this.numTargetIncident = numTargetIncident;
        this.numBestMatch = numBestMatch;
        this.cosSimilarities = cosSimilarities;
        this.setNumMatches(numMatches);
    }

    public int getNumTargetIncident() {
        return numTargetIncident;
    }

    public void setNumTargetIncident(final int numTargetIncident) {
        this.numTargetIncident = numTargetIncident;
    }

    public int getNumBestMatch() {
        return numBestMatch;
    }

    public void setNumBestMatch(final int numBestMatch) {
        this.numBestMatch = numBestMatch;
    }

    public List<Similarity> getCosSimilarities() {
        return cosSimilarities;
    }

    public void setCosSimilarities(final List<Similarity> cosSimilarities) {
        this.cosSimilarities = cosSimilarities;
    }

    public int getNumMatches() {
        return numMatches;
    }

    public void setNumMatches(final int numMatches) {
        this.numMatches = numMatches;
    }
}
