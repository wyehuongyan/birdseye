package org.birdseye.service;

import org.birdseye.stream.TrafficImageStream;
import org.birdseye.stream.TrafficInfoStream;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.MongoDbFactory;
import org.springframework.data.mongodb.core.MongoTemplate;

/**
 * Service for initializing MongoDB with sample data using {@link MongoTemplate}
 */
public class InitMongoService {

    @Autowired
    private MongoDbFactory mongoDbFactory;

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private TrafficInfoStream trafficInfoStream;

    @Autowired
    private TrafficImageStream trafficImageStream;

    public void init() {
        if (mongoDbFactory != null) {
            mongoDbFactory.getDb().getMongo().getAddress();

            System.out.println("mongoDbFactory Initialized.");
        }
    }
}