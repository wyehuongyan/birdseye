package org.birdseye.service;

import java.util.List;
import org.birdseye.domain.DirectionsResult;
import org.birdseye.domain.Incident;
import org.birdseye.domain.TrafficEvent;
import org.birdseye.repository.IncidentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;

@Service
public class TrafficInfoService {

    @Autowired
    private MongoTemplate mongoTemplate; // for switching to other collections

    @Autowired
    private IncidentRepository incidentRepository;

    /*
     * @Autowired private AlarmRepository alarmRepository;
     */

    public void insert(final Incident incident) {
        mongoTemplate.insert(incident, "incident");
    }

    public void insert(final Incident incident, final String collectionName) {
        mongoTemplate.insert(incident, collectionName);
    }

    public void insert(final DirectionsResult directionsResult) {
        mongoTemplate.insert(directionsResult, "direction");
    }

    // dynamic read for different collections, converts the returned document to the specified entityClass
    public <T> T read(final TrafficEvent trafficEvent, final String collectionName, final Class<T> entityClass) {
        return mongoTemplate.findById(trafficEvent.getId(), entityClass, collectionName);
    }

    // returns the list of elements of type T from specified collection
    public <T> List<T> read(final String collectionName, final Class<T> entityClass) {
        return mongoTemplate.findAll(entityClass, collectionName);
    }

    // repository read for incident class
    public Incident read(final Incident incident) {
        return incidentRepository.findById(incident.getId());
    }

    // repository read by timestamp between
    public List<Incident> readByTimestampBetween(final String from, final String to) {
        return incidentRepository.findByStartTimestampBetween(from, to);
    }

    public <T> boolean update(final TrafficEvent trafficEvent, final String collectionName, final Class<T> entityClass) {
        final T existingT = this.read(trafficEvent, collectionName, entityClass);

        if (existingT == null) {
            return false;
        }

        ((TrafficEvent)existingT).setCreateDate(trafficEvent.getCreateDate());
        ((TrafficEvent)existingT).setEndTimestamp(trafficEvent.getEndTimestamp());
        ((TrafficEvent)existingT).setTimeElapsed(trafficEvent.getTimeElapsed());

        if (!((TrafficEvent)existingT).getMessage().equals(trafficEvent.getMessage())) {
            // update if different
            ((TrafficEvent)existingT).setMessage(trafficEvent.getMessage());

            // if instanceof Incident
            if ((((TrafficEvent)existingT) instanceof Incident) && (trafficEvent instanceof Incident)) {

                // update incidentMap
                ((Incident)existingT).getIncidentMap().clear();
                ((Incident)existingT).getIncidentMap().putAll(((Incident)trafficEvent).getIncidentMap());
            }
        }

        mongoTemplate.save(existingT, collectionName);

        return true;
    }

    public Incident update(final Incident incident) {
        final Incident existingIncident = incidentRepository.findById(incident.getId());

        if (existingIncident == null) {
            return null;
        }

        existingIncident.setCreateDate(incident.getCreateDate());
        // existingIncident.setStartTimestamp(incident.getStartTimestamp()); // uncomment if cleaning up
        existingIncident.setEndTimestamp(incident.getEndTimestamp());
        existingIncident.setTimeElapsed(incident.getTimeElapsed());

        if (!existingIncident.getMessage().equals(incident.getMessage())) {
            // update if different
            existingIncident.setMessage(incident.getMessage());

            // incidentMap
            existingIncident.getIncidentMap().clear();
            existingIncident.getIncidentMap().putAll(incident.getIncidentMap());
        }

        return incidentRepository.save(existingIncident);
    }

    public <T> boolean delete(final TrafficEvent trafficEvent, final String collectionName, final Class<T> entityClass) {
        final T existingT = this.read(trafficEvent, collectionName, entityClass);

        if (existingT == null) {
            return false;
        }

        mongoTemplate.remove(existingT, collectionName);

        return true;
    }

    public boolean delete(final Incident incident) {
        final Incident existingIncident = incidentRepository.findById(incident.getId());

        if (existingIncident == null) {
            return false;
        }

        incidentRepository.delete(existingIncident);

        return true;
    }
}
