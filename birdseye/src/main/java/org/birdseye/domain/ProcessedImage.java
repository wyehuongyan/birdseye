package org.birdseye.domain;

import org.springframework.data.mongodb.core.mapping.Document;

@Document
public class ProcessedImage extends TrafficImage {

    private String type;
    private String direction;

    public ProcessedImage() {
        super();
    }

    public ProcessedImage(final String id) {
        super(id);
    }

    public String getType() {
        return type;
    }

    public void setType(final String type) {
        this.type = type;
    }

    public String getDirection() {
        return direction;
    }

    public void setDirection(final String direction) {
        this.direction = direction;
    }
}
