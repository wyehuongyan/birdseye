package org.birdseye.domain;

import org.springframework.data.annotation.Id;

public abstract class TrafficImage {

    @Id
    private String id;
    private String cameraId;
    private String latitude;
    private String longitude;
    private String createDate;
    private String startTimestamp;

    private byte[] image;

    public TrafficImage() {
        // default constructor
    }

    public TrafficImage(final String id) {
        this.id = id;
    }

    public String getId() {
        return id;
    }

    public void setId(final String id) {
        this.id = id;
    }

    public String getCameraId() {
        return cameraId;
    }

    public void setCameraId(final String cameraId) {
        this.cameraId = cameraId;
    }

    public String getLatitude() {
        return latitude;
    }

    public void setLatitude(final String latitude) {
        this.latitude = latitude;
    }

    public String getLongitude() {
        return longitude;
    }

    public void setLongitude(final String longitude) {
        this.longitude = longitude;
    }

    public String getCreateDate() {
        return createDate;
    }

    public void setCreateDate(final String createDate) {
        this.createDate = createDate;
    }

    public String getStartTimestamp() {
        return startTimestamp;
    }

    public void setStartTimestamp(final String startTimestamp) {
        this.startTimestamp = startTimestamp;
    }

    public byte[] getImage() {
        return image;
    }

    public void setImage(final byte[] image) {
        this.image = image;
    }

}
