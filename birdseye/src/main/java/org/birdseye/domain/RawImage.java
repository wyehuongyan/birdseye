package org.birdseye.domain;

import org.springframework.data.mongodb.core.mapping.Document;

@Document
public class RawImage extends TrafficImage {

    private String GUID;
    private String cameraImageId;
    private String imageURL;

    public RawImage() {
        super();
    }

    public RawImage(final String id) {
        super(id);
    }

    public String getGUID() {
        return GUID;
    }

    public void setGUID(final String gUID) {
        GUID = gUID;
    }

    public String getCameraImageId() {
        return cameraImageId;
    }

    public void setCameraImageId(final String cameraImageId) {
        this.cameraImageId = cameraImageId;
    }

    public String getImageURL() {
        return imageURL;
    }

    public void setImageURL(final String imageURL) {
        this.imageURL = imageURL;
    }
}
