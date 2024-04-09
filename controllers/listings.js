const Listing = require("../models/listing.js");
const opencage = require('opencage-api-client');
var GeoJSON = require('geojson');

module.exports.index = async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
};

module.exports.newlistingForm = (req, res) => {
  res.render("listings/new.ejs");
}

module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id).populate({ path: "reviews", populate: { path: "author" } }).populate("owner");
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    res.redirect("/listings");
  }
  res.render("listings/show.ejs", { listing });
}

module.exports.createListing = async (req, res, next) => {

  let url = req.file.path;
  let filename = req.file.filename;
  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image = { url, filename };

  let coordinates = await opencage
  .geocode({ q: req.body.listing.location})
  .then((data) => {
    if (data.status.code === 200 && data.results.length > 0) {
      const place = data.results[0];
      const geo = GeoJSON.parse(place.geometry, {Point: ['lat', 'lng']});
      // console.log(geo.geometry);
      newListing.geometry = geo.geometry;
    } else {
      console.log('Status', data.status.message);
      console.log('total_results', data.total_results);
    }
  })
  .catch((error) => {
    console.log('Error', error.message);
  });

   await newListing.save();
  // console.log(savedListing);
  req.flash("success", "Successfully added a new listing!");
  res.redirect("/listings");
}

module.exports.editListingForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    res.redirect("/listings");
  }
  let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload","/upload/w_250");
  res.render("listings/edit.ejs", { listing , originalImageUrl });
}

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });
  if (typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
    await listing.save();
  }
  req.flash("success", "Successfully edited the listing!");
  res.redirect(`/listings/${id}`);
}

module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  req.flash("success", "Successfully deleted the listing!");
  res.redirect("/listings");
}