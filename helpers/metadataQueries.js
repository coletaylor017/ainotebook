exports.getEntities = function (
	userId,
  confidenceThreshold,
  namesToMatch,
  dateStart,
  dateEnd
) {
  const query = [
    {
      $match: {
				"author.id": userId,
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
			'$match': {
				'metadata.nluData.entities.name': {
					'$in': namesToMatch
				}
			}
		},
    {
      $project: { // just for convenenience
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
            $multiply: ["$data.sentiment.score", /*"$data.confidence"*/ 1],
          },
        },
        sadness: {
          $avg: {
            $multiply: ["$data.emotion.sadness", /*"$data.confidence"*/ 1],
          },
        },
        joy: {
          $avg: {
            $multiply: ["$data.emotion.joy", /*"$data.confidence"*/ 1],
          },
        },
        fear: {
          $avg: {
            $multiply: ["$data.emotion.fear", /*"$data.confidence"*/ 1],
          },
        },
        disgust: {
          $avg: {
            $multiply: ["$data.emotion.disgust", /*"$data.confidence"*/ 1],
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
