package org.birdseye.service;

import java.io.File;
import java.io.FileReader;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.birdseye.domain.Gps;
import org.birdseye.domain.Role;
import org.birdseye.domain.User;
import org.joda.time.DateTime;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.supercsv.cellprocessor.constraint.NotNull;
import org.supercsv.cellprocessor.ift.CellProcessor;
import org.supercsv.io.CsvListReader;
import org.supercsv.io.ICsvListReader;
import org.supercsv.prefs.CsvPreference;

/**
 * Service for initializing MongoDB with sample data using {@link MongoTemplate}
 */
public class InitMongoService {

    @Autowired
    private MongoTemplate mongoTemplate;

    public void init() {
        // Drop existing collections
        mongoTemplate.dropCollection("role");
        mongoTemplate.dropCollection("user");
        // mongoTemplate.dropCollection("gps");

        // Create new records
        final Role adminRole = new Role();
        adminRole.setId(UUID.randomUUID().toString());
        adminRole.setRole(1);

        final Role userRole = new Role();
        userRole.setId(UUID.randomUUID().toString());
        userRole.setRole(2);

        final User john = new User();
        john.setId(UUID.randomUUID().toString());
        john.setFirstName("John");
        john.setLastName("Smith");
        john.setPassword("21232f297a57a5a743894a0e4a801fc3");
        john.setRole(adminRole);
        john.setUsername("john");

        final User jane = new User();
        jane.setId(UUID.randomUUID().toString());
        jane.setFirstName("Jane");
        jane.setLastName("Adams");
        jane.setPassword("ee11cbb19052e40b07aac0ca060c23ee");
        jane.setRole(userRole);
        jane.setUsername("jane");

        // Insert to db
        mongoTemplate.insert(john, "user");
        mongoTemplate.insert(jane, "user");
        mongoTemplate.insert(adminRole, "role");
        mongoTemplate.insert(userRole, "role");

        if (!mongoTemplate.collectionExists("gps")) {
            // Read CSV
            try {
                readWithCsvListReader();
            } catch (final Exception e) {
                // TODO Auto-generated catch block
                e.printStackTrace();
            }
        } else {
            System.out.println("GPS data already loaded.");
        }
    }

    private ArrayList<String> searchForFile(final String filename) {
        final ArrayList<String> paths = new ArrayList<String>();

        final URL resource = getClass().getClassLoader().getResource("/");
        final File directory = new File(resource.getPath());

        searchForFile2(paths, filename, directory);

        return paths;
    }

    private void searchForFile2(final ArrayList<String> paths, final String filename, final File directory) {
        // System.out.println("\nCurrent Directory: " +directory);

        final File[] files = directory.listFiles();

        for (final File file : files) {
            // check if each file is a directory
            if (file.isDirectory()) {
                // go deeper recursively
                // System.out.println("Go Deeper");

                searchForFile2(paths, filename, file);
            } else {
                // file is not a directory
                // check if file contains filename
                if (file.getName().indexOf(filename) != -1) {
                    // matches, add to paths
                    // System.out.println("\tFound file: " +file.getPath());

                    paths.add(file.getPath());
                }
            }
        }

        // exit
        return;
    }

    private void readWithCsvListReader() throws Exception {
        final String CSV_FILENAME = "gps.csv";
        ICsvListReader listReader = null;

        final ArrayList<String> paths = searchForFile(CSV_FILENAME);

        for (int i = 0; i < paths.size(); i++) {
            final String path = paths.get(i);

            System.out.println("Path: " + path);

            try {
                listReader = new CsvListReader(new FileReader(path), CsvPreference.STANDARD_PREFERENCE);

                listReader.getHeader(true); // skip the header (can't be used with CsvListReader)
                final CellProcessor[] processors = new CellProcessor[] { new NotNull() };

                List<Object> dataList;
                while ((dataList = listReader.read(processors)) != null) {
                    final String data = (String)dataList.get(0);
                    final String values[] = data.split("\\s+");

                    /*
                     * System.out.println(String.format("lineNo=%s, rowNo=%s, arraySize=%s, dataList=%s", listReader.getLineNumber(),
                     * listReader.getRowNumber(), values.length, dataList));
                     * 
                     * System.out.println(String.format("%s, %s\n", values[5], values[6]));
                     */

                    final Gps gps = new Gps();

                    gps.setId(UUID.randomUUID().toString());
                    gps.setTimestamp(values[1]);
                    gps.setLongtitude(values[5]);
                    gps.setLatitude(values[6]);
                    gps.setUserid(values[0]);

                    final long time = new Long(values[1]);
                    final DateTime dateTime = new DateTime(time * 1000l);

                    final String dateTimeValues[] = (dateTime.toString("yyyy/MM/dd HH:mm:ss")).split(" ");

                    gps.setDate(dateTimeValues[0]);
                    gps.setTime(dateTimeValues[1]);

                    mongoTemplate.insert(gps, "gps");
                }
            } finally {
                if (listReader != null) {
                    listReader.close();
                }
            }

            System.out.println("Path: " + path + " CSV done\n");
        }
    }
}
