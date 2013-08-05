package org.birdseye.repository;

import java.util.List;
import org.birdseye.domain.ProcessedImage;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProcessedImageRepository extends MongoRepository<ProcessedImage, String> {

    ProcessedImage findById(String id);

    List<ProcessedImage> findByStartTimestampBetween(String from, String to);
}
