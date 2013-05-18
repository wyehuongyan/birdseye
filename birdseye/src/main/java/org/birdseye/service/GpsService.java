package org.birdseye.service;

import java.util.List;

import org.birdseye.domain.Gps;
import org.birdseye.repository.GpsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class GpsService {

	@Autowired
	private GpsRepository gpsRepository;
	
	public List<Gps> readByUserid(String userid) {
		return gpsRepository.findByUserid(userid);
	}
	
	public List<Gps> readByUseridAndTimestampBetween(String userid, String from, String to) {
		return gpsRepository.findByUseridAndTimestampBetween(userid, from, to);
	}
	
	public Gps read(Gps gps) {
		return gpsRepository.findOne(gps.getId());
	}
	
	public List<Gps> readAll() {
		return gpsRepository.findAll();
	}
}
