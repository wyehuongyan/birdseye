package org.birdseye.repository;

import java.util.List;
import org.birdseye.domain.Incident;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IncidentRepository extends MongoRepository<Incident, String> {

    Incident findById(String id);

    List<Incident> findByStartTimestampBetween(String from, String to);
}
