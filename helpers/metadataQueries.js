exports.getEntities = function (
	authorId,
  confidenceThreshold,
  namesToMatch,
  dateStart,
  dateEnd
) {
  const query = [
    {
      $match: {
				"author.id": authorId,
        "metadata.nluData.entities.confidence": {
          $gte: confidenceThreshold,
        },
      },
    },
    {
      $unwind: {
        path: "$metadata.nluData.entities",
        includeArrayIndex: "string",
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $project: {
        _id: 0,
        data: "$metadata.nluData.entities",
      },
    },
    {
      $group: {
        _id: "$data.name",
        categories: {
          $addToSet: "$data.category",
        },
        entriesMentioning: {
          $sum: 1,
        },
        totalMentions: {
          $sum: "$data.count",
        },
        sentimentScore: {
          $avg: {
            $multiply: ["$data.sentiment.score", "$data.confidence"],
          },
        },
        sadness: {
          $avg: {
            $multiply: ["$data.emotion.sadness", "$data.confidence"],
          },
        },
        joy: {
          $avg: {
            $multiply: ["$data.emotion.joy", "$data.confidence"],
          },
        },
        fear: {
          $avg: {
            $multiply: ["$data.emotion.fear", "$data.confidence"],
          },
        },
        disgust: {
          $avg: {
            $multiply: ["$data.emotion.disgust", "$data.confidence"],
          },
        },
        anger: {
          $avg: {
            $multiply: ["$data.emotion.anger", "$data.confidence"],
          },
        },
      },
    },
  ];

  // if filtering by tag names, add the corresponding query into the match stage
  if (namesToMatch != null) {
    query[0]["$match"]["metadata.nluData.entities.name"] = {
      $in: namesToMatch,
    };
	}
	
	// if filtering by date, add the corresponding query into the match stage
  if (dateStart != null && dateEnd != null) {
		query[0]["$match"]["dateCreated"] = 
    {
			$gte: dateStart, 
			$lte: dateEnd
    }
  }

  return query;
};
