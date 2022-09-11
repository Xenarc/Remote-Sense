// TODO: Make sure you import locations.xlsx as a GEE asset
var radius = 15;

function maskS2clouds(image) {
  var qa = image.select('QA60');

  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;

  var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
      .and(qa.bitwiseAnd(cirrusBitMask).eq(0));

  return image.updateMask(mask).divide(10000);
}

// locations.toList(309).evaluate(function(ls) {
locations.toList(locations.size()).evaluate(function(ls) {  // 309
  var features = ee.FeatureCollection(ls.map(function (l){
    var lat = l.properties[Object.keys(l.properties)[0]];
    var lng = l.properties[Object.keys(l.properties)[2]];
    var point = ee.Geometry.Point([lng, lat]).buffer(radius);
    return new ee.Feature(point);
  }));
  
  var L82014pre = ee.ImageCollection('COPERNICUS/S2')
                  .filterDate('2022-06-01', '2022-06-30')
                  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE',18))
                  .select(".*");
  
  // Empty Collection to fill
  var ft = ee.FeatureCollection(ee.List([]));
  
  var fill = function(img, f) {
    // gets the values for the points in the current img
    var bands = (img.reduceRegion(ee.Reducer.mean(), f.geometry(), 10));
    
    var feature = ee.FeatureCollection(f);
    
    bands = ee.Dictionary(bands);
    
    feature = bands.map(function(k, v) {
      return v;
    });
    
    return f.setMulti(feature);
  };
  
  // Iterates over the ImageCollection
  var newft = features.map(function (f){
    return fill(L82014pre.mean(), f);
  });
  
  print(newft);
  
  // Export
  Export.table.toDrive(newft,
    "exportfromgee",
    "remotesense",
    "sentinal"
  );
});
