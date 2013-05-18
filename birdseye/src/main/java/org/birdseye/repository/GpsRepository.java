package org.birdseye.repository;

import java.util.List;

import org.birdseye.domain.Gps;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface GpsRepository extends MongoRepository<Gps, String>{
	@Query("{ 'userid' : ?0 }")
	List<Gps> findByUserid(String userid);
	
	List<Gps> findByUseridAndTimestampBetween(String userid, String from, String to);
}
