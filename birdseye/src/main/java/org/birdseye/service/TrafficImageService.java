package org.birdseye.service;

import java.util.List;
import org.birdseye.domain.ProcessedImage;
import org.birdseye.domain.RawImage;
import org.birdseye.domain.TrafficImage;
import org.birdseye.repository.ProcessedImageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;

@Service
public class TrafficImageService {

    @Autowired
    private MongoTemplate mongoTemplate; // for switching to other collections

    @Autowired
    private ProcessedImageRepository processedImageRepository;

    public void insert(final ProcessedImage processedImage) {
        mongoTemplate.insert(processedImage, "processedimage");
    }

    public void insert(final RawImage rawImage) {
        mongoTemplate.insert(rawImage, "rawimage");
    }

    // dynamic read for different collections, converts the returned document to the specified entityClass
    public <T> T read(final TrafficImage trafficImage, final String collectionName, final Class<T> entityClass) {
        return mongoTemplate.findById(trafficImage.getId(), entityClass, collectionName);
    }

    // returns the list of elements of type T from specified collection
    public <T> List<T> read(final String collectionName, final Class<T> entityClass) {
        return mongoTemplate.findAll(entityClass, collectionName);
    }

    // repository read for ProcessedImage class
    public ProcessedImage read(final ProcessedImage processedImage) {
        return processedImageRepository.findById(processedImage.getId());
    }

    // repository read by timestamp between
    public List<ProcessedImage> readByTimestampBetween(final String from, final String to) {
        return processedImageRepository.findByStartTimestampBetween(from, to);
    }

    // delete
    public <T> boolean delete(final TrafficImage trafficImage, final String collectionName, final Class<T> entityClass) {
        final T existingT = this.read(trafficImage, collectionName, entityClass);

        if (existingT == null) {
            return false;
        }

        mongoTemplate.remove(existingT, collectionName);

        return true;
    }

    // drop
    public void dropCollection(final String collectionName) {
        mongoTemplate.dropCollection(collectionName);
    }
}
