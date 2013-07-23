package org.birdseye.domain;

import java.util.List;

public class CongestionResult {

    private List<DirectionsResult> directionResults;
    private List<Expressway> expressways;

    public CongestionResult() {

    }

    public CongestionResult(final List<DirectionsResult> directionsResults, final List<Expressway> expressways) {
        this.directionResults = directionsResults;
        this.expressways = expressways;
    }

    public List<DirectionsResult> getDirectionResults() {
        return directionResults;
    }

    public void setDirectionsResults(final List<DirectionsResult> directionsResults) {
        this.directionResults = directionsResults;
    }

    public List<Expressway> getExpressways() {
        return expressways;
    }

    public void setExpressways(final List<Expressway> expressways) {
        this.expressways = expressways;
    }
}
