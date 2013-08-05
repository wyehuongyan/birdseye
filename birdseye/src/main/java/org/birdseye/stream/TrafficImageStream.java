package org.birdseye.stream;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLConnection;
import java.util.HashMap;
import java.util.List;
import java.util.Timer;
import java.util.TimerTask;
import javax.annotation.PreDestroy;
import javax.imageio.ImageIO;
import org.birdseye.domain.ProcessedImage;
import org.birdseye.domain.RawImage;
import org.birdseye.service.TrafficImageService;
import org.dom4j.Document;
import org.dom4j.DocumentException;
import org.dom4j.Node;
import org.dom4j.io.SAXReader;
import org.jaxen.JaxenException;
import org.jaxen.SimpleNamespaceContext;
import org.jaxen.XPath;
import org.jaxen.dom4j.Dom4jXPath;
import org.joda.time.DateTime;
import org.opencv.core.Core;
import org.opencv.core.CvType;
import org.opencv.core.Mat;
import org.opencv.core.MatOfByte;
import org.opencv.core.Point;
import org.opencv.core.Scalar;
import org.opencv.core.Size;
import org.opencv.highgui.Highgui;
import org.opencv.imgproc.Imgproc;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class TrafficImageStream {

    @Autowired
    private TrafficImageService trafficImageService;

    private final String accountKey = "1q/jd++tN8SbIqLRVUkXww==";
    private final String uniqueId = "a9e07632-464d-4a76-96c5-18d1f4e214a5";

    private final Timer timer = new Timer();

    // constructor
    public TrafficImageStream() {
        System.out.println("TrafficImageStream constructor executed");

        final URL resource = getClass().getClassLoader().getResource("/lib/libopencv_java246.dylib");
        System.load(resource.getPath());

        System.out.println("OpenCV library loaded");

        // data collection task starts after 5 seconds and occurs every 2.5 minutes
        timer.scheduleAtFixedRate(new TrafficImageRetrievalTask(), 5 * 1000, 3 * 60 * 1000); // timertask, when to start, delay between
                                                                                             // calls in // //
        // milliseconds
    }

    @PreDestroy
    public void clearTrafficImageStream() {
        System.out.println("Spring lifecycle destroyer executed: TrafficImageStream");

        timer.cancel();
        timer.purge();
    }

    private RawImage parseImageSetEntry(final Node node, final HashMap<String, String> map) throws JaxenException, IOException {
        final RawImage rawImage = new RawImage();
        final XPath xPath = new Dom4jXPath(".//d:*");
        xPath.setNamespaceContext(new SimpleNamespaceContext(map));

        // System.out.println("node: " + node.asXML());

        final List<Node> nodes = xPath.selectNodes(node);
        // System.out.println("No. of d-namespace nodes: " + nodes.size());
        final String cameraImageID = nodes.get(0).getText();
        final String cameraID = nodes.get(1).getText();
        final String latitude = nodes.get(2).getText();
        final String longtitude = nodes.get(3).getText();
        final String imageURL = nodes.get(4).getText();
        final String createDate = nodes.get(6).getText();
        final String GUID = nodes.get(8).getText();
        final byte[] imagebyte;

        final URL url = new URL(imageURL);
        final BufferedImage img = ImageIO.read(url);

        if (img != null) {
            final ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(img, "jpg", baos);
            imagebyte = baos.toByteArray();
        } else {
            imagebyte = null;
        }

        // primary key
        final String id = createDate + "_" + latitude + "_" + longtitude;

        final String createDateValues[] = createDate.split("T");
        final String dateCreated = createDateValues[0];
        final String timeCreated = createDateValues[1];

        final String dateCreatedValues[] = dateCreated.split("-");
        final String timeCreatedValues[] = timeCreated.split(":");

        Integer hourOfDay = Integer.parseInt(timeCreatedValues[0]) + 8;

        if (hourOfDay >= 24) {
            hourOfDay = 0;
        }

        // System.out.println("\nHour of Day: " + hourOfDay);

        // Joda Time: year, month, day, hour, min, secs
        // hour + 8 because Singapore is GMT +8
        final String millisecOfDay = timeCreatedValues[2].substring(0, 2);

        final DateTime dateTimeCreated = new DateTime(Integer.parseInt(dateCreatedValues[0]), Integer.parseInt(dateCreatedValues[1]),
                Integer.parseInt(dateCreatedValues[2]), hourOfDay, Integer.parseInt(timeCreatedValues[1]), Integer.parseInt(millisecOfDay));

        rawImage.setId(id);
        rawImage.setCameraImageId(cameraImageID);
        rawImage.setCameraId(cameraID);
        rawImage.setLatitude(latitude);
        rawImage.setLongitude(longtitude);
        rawImage.setImageURL(imageURL);
        rawImage.setCreateDate(createDate);
        rawImage.setStartTimestamp(String.valueOf(dateTimeCreated.getMillis()));
        rawImage.setGUID(GUID);
        rawImage.setImage(imagebyte);

        return rawImage;
    }

    private void processRawImages() {
        final int erosion_size = 1;
        final int dilation_size = 1;

        // retrieve raw images
        final List<RawImage> rawImages = trafficImageService.read("rawimage", RawImage.class);

        // repeat for each individual rawImage
        // findMaskImage -> calculateImage
        for (final RawImage rawImage : rawImages) {
            final Mat img = new MatOfByte(rawImage.getImage());

            // convert to grayscale
            final Mat original = Highgui.imdecode(img, Highgui.CV_LOAD_IMAGE_GRAYSCALE);
            final Mat colour = Highgui.imdecode(img, Highgui.CV_LOAD_IMAGE_COLOR);

            final Size ds = new Size((2 * dilation_size + 1), (2 * dilation_size + 1));
            final Point dp = new Point(dilation_size, dilation_size);

            // dilate image
            final Mat dilateElement = Imgproc.getStructuringElement(Imgproc.MORPH_RECT, ds, dp);

            final Mat dilatedImage = new Mat();
            Imgproc.dilate(original, dilatedImage, dilateElement);

            // erode dilated image
            final Size es = new Size((2 * erosion_size + 1), (2 * erosion_size + 1));
            final Point ep = new Point(erosion_size, erosion_size);

            final Mat erodeElement = Imgproc.getStructuringElement(Imgproc.MORPH_RECT, es, ep);

            final Mat erodedImage = new Mat();
            Imgproc.erode(dilatedImage, erodedImage, erodeElement);

            // take abs diff of dilated image and eroded images to get edges
            final Mat diffImage = new Mat();

            Core.absdiff(dilatedImage, erodedImage, diffImage);

            findMaskImage(original, diffImage, rawImage, colour);
        }

        // drop rawimage collection after processing all (possible) rawimages
        trafficImageService.dropCollection("rawimage");
        System.out.println("MongoDB rawimage collection processed and dropped");

    }

    private void findMaskImage(final Mat original, final Mat diffImage, final RawImage rawImage, final Mat colour) {
        // retrieve the mask images from the masks resource folder
        // System.out.println("\nfindMaskImage cameraId: " + rawImage.getCameraId());
        final URL resource = getClass().getClassLoader().getResource("/masks/" + rawImage.getCameraId() + "_mask");

        if (resource != null) {
            final File directory = new File(resource.getPath());
            final File[] masks = directory.listFiles();

            for (final File m : masks) {
                // each mask inside XXXX_mask folder
                // System.out.println(String.format("Directory: %s, File: %s", directory.getName(), m.getName()));

                final String direction = m.getName().substring(0, m.getName().lastIndexOf("."));
                final Mat mask = Highgui.imread(m.getPath(), 0);

                // calculateImage for each mask
                calculateImage(original, diffImage, mask, direction, rawImage, colour);
            }
        }
    }

    private void calculateImage(final Mat original, final Mat diffImage, final Mat mask, final String direction, final RawImage rawImage,
            final Mat colour) {

        try {
            final Mat maskImage = new Mat();
            Core.subtract(diffImage, mask, maskImage);

            // find the threshold
            final Mat thresholdImage = new Mat();

            // perform thresholding
            Imgproc.threshold(maskImage, thresholdImage, 25, 255, 0);

            // intensity histograms
            // allcoate memory for no of pixels for each intensity value
            final int thresholdHistogram[] = new int[256];
            final int originalHistogram[] = new int[256];
            final int originalHistogram2[] = new int[256];

            // initialize all intensity values to 0
            for (int i = 0; i < 256; i++) {
                thresholdHistogram[i] = 0;
                originalHistogram[i] = 0;
            }

            // calculate the no of pixels for each intensity values
            for (int y = 0; y < thresholdImage.rows(); y++) {
                for (int x = 0; x < thresholdImage.cols(); x++) {
                    final double[] tMatValue = thresholdImage.get(y, x);

                    // System.out.println("tMatValue length: " + tMatValue.length);
                    // System.out.println("tMatValue: " + tMatValue[0]);

                    thresholdHistogram[(int)tMatValue[0]]++;
                }
            }

            // / check whether traffic image is taken during rain (bin 235,236 > 900)
            for (int y = 0; y < original.rows(); y++) {
                for (int x = 0; x < original.cols(); x++) {
                    final double[] oMatValue = original.get(y, x);

                    // System.out.println("oMatValue length: " + oMatValue.length);
                    // System.out.println("oMatValue: " + oMatValue[0]);

                    originalHistogram[(int)oMatValue[0]]++;
                }
            }

            final int hist_w = 512;
            final int hist_h = 400;
            final int bin_w = (int)Math.round((double)hist_w / 256);

            final Scalar s = new Scalar(255, 255, 255);

            final Mat histImage = new Mat(hist_h, hist_w, CvType.CV_8UC1, s);

            int max = originalHistogram[0];
            int location = 0;

            for (int i = 1; i < 255; i++) {
                if (max < originalHistogram[i]) {
                    max = originalHistogram[i];
                    location = i;
                }
            }

            for (int i = 0; i < 255; i++) {
                originalHistogram2[i] = originalHistogram[i];
                originalHistogram[i] = (int)(((double)originalHistogram[i] / max) * histImage.rows());
            }

            for (int i = 0; i < 255; i++) {
                final Point p1 = new Point(bin_w * (i), hist_h);
                final Point p2 = new Point(bin_w * (i), hist_h - originalHistogram[i]);
                final Scalar s1 = new Scalar(0, 0, 0);

                Core.line(histImage, p1, p2, s1, 1, 8, 0);
            }

            // process traffic type
            // System.out.println(String.format("[calculateImage] cameraId: %s, direction: %s, thresholdHistogram[255]: %s", rawImage.getCameraId(),
            // direction, thresholdHistogram[255]));

            // determine the traffic 'type'
            // 1 = heavy, 2 = medium, 3 = light
            String type = "0";
            final int cameraId = Integer.parseInt(rawImage.getCameraId());

            switch (cameraId) {
                case 1001: {
                    if (direction.equals("changi")) {
                        if (thresholdHistogram[255] >= 3000 || originalHistogram2[235] > 600 || originalHistogram2[236] > 600) {
                            type = "1";
                        } else if (thresholdHistogram[255] < 3000 && thresholdHistogram[255] > 2000) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }
                }
                    break;
                case 1002:
                    if (direction.equals("ecp")) {
                        if (thresholdHistogram[255] >= 2000) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 2000 && thresholdHistogram[255] > 1500) {
                            type = "2";
                        } else {
                            type = "3";
                        }

                    } else if (direction.equals("tuas")) {
                        if (thresholdHistogram[255] >= 1200) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 1200 && thresholdHistogram[255] > 800) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    break;

                case 1003:
                    if (direction.equals("changi")) {
                        if (thresholdHistogram[255] >= 1600) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 1600 && thresholdHistogram[255] > 1000) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    break;
                case 1005:
                    if (direction.equals("ecp")) {
                        if (thresholdHistogram[255] >= 1200) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 1200 && thresholdHistogram[255] > 1000) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    else if (direction.equals("tpe")) {
                        if (thresholdHistogram[255] >= 700) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 700 && thresholdHistogram[255] > 500) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    break;

                case 1006:
                    if (direction.equals("tpe")) {
                        if (thresholdHistogram[255] >= 1200) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 1200 && thresholdHistogram[255] > 800) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    else if (direction.equals("ecp")) {
                        if (thresholdHistogram[255] >= 600) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 600 && thresholdHistogram[255] > 350) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    break;

                case 1701:
                    if (direction.equals("aye")) {
                        if (thresholdHistogram[255] >= 1500) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 1500 && thresholdHistogram[255] > 800) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    else if (direction.equals("sle")) {
                        if (thresholdHistogram[255] >= 1500) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 1500 && thresholdHistogram[255] > 800) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    break;

                case 1702:
                    if (direction.equals("sle")) {
                        if (thresholdHistogram[255] >= 2800) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 2800 && thresholdHistogram[255] > 1500) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    else if (direction.equals("city")) {
                        if (thresholdHistogram[255] >= 3200) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 3200 && thresholdHistogram[255] > 2000) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    break;

                case 1703:
                    if (direction.equals("aye")) {
                        if (thresholdHistogram[255] >= 1500) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 1500 && thresholdHistogram[255] > 1000) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    else if (direction.equals("sle")) {
                        if (thresholdHistogram[255] >= 1500) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 1500 && thresholdHistogram[255] > 1000) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    break;

                case 1705:
                    if (direction.equals("city")) {
                        if (thresholdHistogram[255] >= 4000) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 4000 && thresholdHistogram[255] > 2000) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    if (direction.equals("sle")) {
                        if (thresholdHistogram[255] >= 1500) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 1500 && thresholdHistogram[255] > 1000) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    break;

                case 2703:
                    if (direction.equals("jurong")) {
                        if (thresholdHistogram[255] >= 4000) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 4000 && thresholdHistogram[255] > 3000) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    else if (direction.equals("changi")) {
                        if (thresholdHistogram[255] >= 3500) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 3500 && thresholdHistogram[255] > 2500) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    break;

                case 2704:
                    if (direction.equals("woodlands")) {
                        if (thresholdHistogram[255] >= 3000) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 3000 && thresholdHistogram[255] > 2500) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    break;

                case 2705:
                    if (direction.equals("pie")) {
                        if (thresholdHistogram[255] >= 3500) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 3500 && thresholdHistogram[255] > 2000) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    break;

                case 3793:
                    if (direction.equals("changi")) {
                        if (thresholdHistogram[255] >= 1100) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 1100 && thresholdHistogram[255] > 600) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    break;

                case 3795:
                    if (direction.equals("city")) {
                        if (thresholdHistogram[255] >= 4000) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 4000 && thresholdHistogram[255] > 2200) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    break;

                case 3796:
                    if (direction.equals("changi")) {
                        if (thresholdHistogram[255] >= 4000) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 4000 && thresholdHistogram[255] > 2600) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    break;

                case 3797:
                    if (direction.equals("city")) {
                        if (thresholdHistogram[255] >= 4000) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 4000 && thresholdHistogram[255] > 2600) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    else if (direction.equals("changi")) {
                        if (thresholdHistogram[255] >= 1800) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 1800 && thresholdHistogram[255] > 1400) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    break;

                case 3798:
                    if (direction.equals("changi")) {
                        if (thresholdHistogram[255] >= 3500) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 3500 && thresholdHistogram[255] > 2500) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    else if (direction.equals("city")) {
                        if (thresholdHistogram[255] >= 3500) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 3500 && thresholdHistogram[255] > 2500) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    break;

                case 3799:
                    if (direction.equals("aye")) {
                        if (thresholdHistogram[255] >= 3800) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 3800 && thresholdHistogram[255] > 2500) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    if (direction.equals("ecp")) {
                        if (thresholdHistogram[255] >= 2200) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 2200 && thresholdHistogram[255] > 1600) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    break;

                case 4701:
                    if (direction.equals("city")) {
                        if (thresholdHistogram[255] >= 4500) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 4500 && thresholdHistogram[255] > 2500) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    break;

                case 4702:
                    if (direction.equals("jurong")) {
                        if (thresholdHistogram[255] >= 1800) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 1800 && thresholdHistogram[255] > 1300) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    else if (direction.equals("changi")) {
                        if (thresholdHistogram[255] >= 1400) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 1400 && thresholdHistogram[255] > 700) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    break;

                case 4704:
                    if (direction.equals("ecp")) {
                        if (thresholdHistogram[255] >= 1400) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 1400 && thresholdHistogram[255] > 900) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    else if (direction.equals("cte")) {
                        if (thresholdHistogram[255] >= 1800) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 1800 && thresholdHistogram[255] > 1200) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    break;

                case 4706:
                    if (direction.equals("jurong")) {
                        if (thresholdHistogram[255] >= 2700) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 2700 && thresholdHistogram[255] > 2200) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    break;

                case 4708:
                    if (direction.equals("city")) {
                        if (thresholdHistogram[255] >= 4000) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 4000 && thresholdHistogram[255] > 3000) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    break;

                case 4798:
                    if (direction.equals("telok_blangah")) {
                        if (thresholdHistogram[255] >= 1200) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 1200 && thresholdHistogram[255] > 1000) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    break;

                case 4799:
                    if (direction.equals("sentosa")) {
                        if (thresholdHistogram[255] >= 3000) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 3000 && thresholdHistogram[255] > 2400) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    else if (direction.equals("telok_blangah")) {
                        if (thresholdHistogram[255] >= 5000) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 5000 && thresholdHistogram[255] > 4000) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    break;

                case 5794:
                    if (direction.equals("jurong")) {
                        if (thresholdHistogram[255] >= 4000) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 4000 && thresholdHistogram[255] > 3000) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    break;

                case 5795:
                    if (direction.equals("changi")) {
                        if (thresholdHistogram[255] >= 2800) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 2800 && thresholdHistogram[255] > 2000) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    else if (direction.equals("jurong")) {
                        if (thresholdHistogram[255] >= 4500) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 4500 && thresholdHistogram[255] > 3000) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    break;

                case 5797:
                    if (direction.equals("jurong")) {
                        if (thresholdHistogram[255] >= 3500) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 3500 && thresholdHistogram[255] > 2500) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    else if (direction.equals("changi")) {
                        if (thresholdHistogram[255] >= 2500) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 2500 && thresholdHistogram[255] > 1800) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    break;

                case 5798:
                    if (direction.equals("changi")) {
                        if (thresholdHistogram[255] >= 2500) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 2500 && thresholdHistogram[255] > 1800) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    break;

                case 5799:
                    if (direction.equals("changi")) {
                        if (thresholdHistogram[255] >= 5500) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 5500 && thresholdHistogram[255] > 4000) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    else if (direction.equals("jurong")) {
                        if (thresholdHistogram[255] >= 2000) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 2000 && thresholdHistogram[255] > 1400) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    break;

                case 6703:
                    if (direction.equals("changi")) {
                        if (thresholdHistogram[255] >= 2000) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 2000 && thresholdHistogram[255] > 1500) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    else if (direction.equals("jurong")) {
                        if (thresholdHistogram[255] >= 1300) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 1300 && thresholdHistogram[255] > 900) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    break;

                case 6704:
                    if (direction.equals("changi")) {
                        if (thresholdHistogram[255] >= 2300) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 2300 && thresholdHistogram[255] > 1800) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    else if (direction.equals("jurong")) {
                        if (thresholdHistogram[255] >= 4000) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 4000 && thresholdHistogram[255] > 3000) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    break;

                case 6705:
                    if (direction.equals("changi")) {
                        if (thresholdHistogram[255] >= 6000) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 6000 && thresholdHistogram[255] > 4500) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    break;

                case 6706:
                    if (direction.equals("changi")) {
                        if (thresholdHistogram[255] >= 6000) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 6000 && thresholdHistogram[255] > 4500) {
                            type = "2";
                        } else {
                            type = "3";

                        }
                    }

                    break;

                case 6708:
                    if (direction.equals("tuas")) {
                        if (thresholdHistogram[255] >= 1500) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 1500 && thresholdHistogram[255] > 1000) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    else if (direction.equals("changi")) {
                        if (thresholdHistogram[255] >= 1200) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 1200 && thresholdHistogram[255] > 800) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    break;

                case 7791:
                    if (direction.equals("ecp")) {
                        if (thresholdHistogram[255] >= 1700) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 1700 && thresholdHistogram[255] > 1200) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    else if (direction.equals("pie")) {
                        if (thresholdHistogram[255] >= 1700) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 1700 && thresholdHistogram[255] > 1200) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    break;

                case 7798:
                    if (direction.equals("bke")) {
                        if (thresholdHistogram[255] >= 2800) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 2800 && thresholdHistogram[255] > 2200) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    else if (direction.equals("sle")) {
                        if (thresholdHistogram[255] >= 3000) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 3000 && thresholdHistogram[255] > 2400) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    break;

                case 9701:
                    if (direction.equals("tpe")) {
                        if (thresholdHistogram[255] >= 2000) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 2000 && thresholdHistogram[255] > 1400) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    else if (direction.equals("bke")) {
                        if (thresholdHistogram[255] >= 1700) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 1700 && thresholdHistogram[255] > 1200) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    break;

                case 9703:
                    if (direction.equals("pie")) {
                        if (thresholdHistogram[255] >= 1400) // missing rain
                        {
                            type = "1";
                        } else if (thresholdHistogram[255] < 1400 && thresholdHistogram[255] > 1000) {
                            type = "2";
                        } else {
                            type = "3";
                        }
                    }

                    break;
            }

            // System.out.println(String.format("rawImage Id: %s, type: %s", rawImage.getId(), type));

            // accept heavy traffic only
            if (type.equals("1")) {
                // create a new ProcessedImage object and store into processedimage collection
                final ProcessedImage processedImage = new ProcessedImage();

                processedImage.setId(rawImage.getId());
                processedImage.setCameraId(rawImage.getCameraId());
                processedImage.setLatitude(rawImage.getLatitude());
                processedImage.setLongitude(rawImage.getLongitude());
                processedImage.setCreateDate(rawImage.getCreateDate());
                processedImage.setImage(rawImage.getImage());
                processedImage.setStartTimestamp(rawImage.getStartTimestamp());

                processedImage.setType(type);
                processedImage.setDirection(direction);

                trafficImageService.insert(processedImage);
            }

            // remove respective rawimage
            // trafficImageService.delete(rawImage, "rawimage", RawImage.class);
            // don't do it like this because there are some rawimages without masks that will always be non-processed
            // taking up space in the rawimage collection
            // just drop the entire rawimage collection
        } catch (final Exception e) {
            System.out.println(e.getMessage());
        }
    }

    class TrafficImageRetrievalTask extends TimerTask {

        @Override
        public void run() {

            // url connection to LTA datamall for images
            try {
                System.out.println("Retrieving Image dataset...");

                final HashMap<String, String> map = new HashMap<String, String>();
                map.put("lta", "http://www.w3.org/2005/Atom");
                map.put("m", "http://schemas.microsoft.com/ado/2007/08/dataservices/metadata");
                map.put("d", "http://schemas.microsoft.com/ado/2007/08/dataservices");

                final XPath xPath = new Dom4jXPath("//m:properties");
                xPath.setNamespaceContext(new SimpleNamespaceContext(map));

                final URL imageurl = new URL("http://datamall.mytransport.sg/ltaodataservice.svc/CameraImageSet");
                final URLConnection urlConn = imageurl.openConnection();

                urlConn.setRequestProperty("accept", "*/*");
                urlConn.addRequestProperty("AccountKey", accountKey);
                urlConn.addRequestProperty("UniqueUserID", uniqueId);

                final SAXReader reader = new SAXReader();
                final Document document = reader.read(urlConn.getInputStream());

                // System.out.println("inputstream: " + urlConn.getInputStream());
                // System.out.println("document: " + document.asXML());

                final List<Node> nodes = xPath.selectNodes(document);

                for (final Node node : nodes) {
                    // Normal insertion
                    final RawImage rawImage = parseImageSetEntry(node, map);

                    if (rawImage.getImage() != null) {
                        // insert into rawimage collection using TrafficImageService insert method
                        trafficImageService.insert(rawImage);
                    }
                }

                // after all nodes are inserted
                // image processor processes the 'rawimage' collection
                processRawImages();
            } catch (final MalformedURLException e) {
                e.printStackTrace();
            } catch (final IOException e) {
                e.printStackTrace();
            } catch (final DocumentException e) {
                e.printStackTrace();
            } catch (final JaxenException e) {
                e.printStackTrace();
            }
        }
    }
}
