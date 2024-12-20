var mongoose=require("mongoose");
var Venue=mongoose.model("venue");

const calculateLastRating = function(incomingVenue, isDeleted) {
    var i, numRatings, avgRating, sumRating = 0;
    var numComments = incomingVenue.comments.length;
    if(incomingVenue.comments) {
            if(incomingVenue.comments.length == 0 && isDeleted) {
                avgRating = 0;
            }
            else {
                for(i=0; i<numComments; i++) {
                    sumRating = sumRating + incomingVenue.comments[i].rating;
                }
                avgRating = Math.ceil(sumRating / numComments);
            }
            incomingVenue.rating = avgRating;
            incomingVenue.save();
    }
};

const updateRating = function(venueid, isDeleted) {
    Venue.findById(venueid).select("rating comments")
    .exec().then(function(venue) {
        calculateLastRating(venue.isDeleted);
    })
};

const createComment = function(req, res, incomingVenue) {
    incomingVenue.comments.push(req.body);
    incomingVenue.save().then(function(venue) {
        var comments = venue.comments;
        var comment = comments[comments.length-1];
        updateRating(venue._id, false);
        createResponse(res, "201", comment);
    });
};

const createResponse=function(res,status,content) {
    res.status(status).json(content);
};

const addComment=async function(req,res) {
    try {
        await Venue.findById(req.params.venueid)
        .select("comments")
        .exec()
        .then(function(venue) {
            createComment(req, res, venue);
        })
    }

    catch(error) {
        createResponse(res, "400", error);
    }
};

const deleteComment=async function(req,res) {
    try {
        await Venue.findById(req.params.venueid)
        .select("comments")
        .exec()
        .then(function(venue) {
            try {
                let comment = venue.comments.id(req.params.commentid);
                comment.deleteOne();
                venue.save().then(function() {
                    updateRating(venue._id, true);
                    createResponse(res, "200", {status: comment.author+ " isimli kişinin yorumu silindi."})
                });
            } catch (error) {
                createResponse(res, "400", error);
            }
        });
    } catch(error) {
        createResponse(res, "400", error)
    }
};

const updateComment=async function(req,res) {
    try {
        await Venue.findById(req.params.venueid)
        .select("comments")
        .exec()
        .then(function(venue) {
            try {
                let comment = venue.comments.id(req.params.commentid);
                comment.set(req.body);
                venue.save().then(function() {
                    updateRating(venue._id, false);
                    createResponse(res, "201", comment);
                });
            } catch(error) {
                createResponse(res, "400", error);
            }
        });
    } catch (error) {
        createResponse(res, "400", error);
    }
};

const getComment = async function (req, res) {
    try {
        await Venue.findById(req.params.venueid)
            .select("name comments").exec().then(function (venue) {
                var response, comment;

                if (!venue) {
                    createResponse(res, "404", "Mekanid yanlış");
                } else if (venue.comments.id(req.params.commentid)) {
                    comment = venue.comments.id(req.params.commentid);
                    response = {
                        venue: {
                            name: venue.name,
                            id: req.params.id,
                        },
                        comment: comment,
                    };
                    createResponse(res, "200", response);
                } else {
                    createResponse(res, "404", "Yorum id yanlış");
                }
            });
    } catch (error) {
        createResponse(res, "404", "Mekan bulunamadı");
    }
};


module.exports={
    getComment,
    addComment,
    updateComment,
    deleteComment
};