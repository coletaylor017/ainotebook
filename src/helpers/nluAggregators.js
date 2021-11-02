exports.getEntitiesWithHistories = function(
	userId,
  confidenceThreshold,
  namesToMatch,
  dateStart,
  dateEnd
) {
  const query = [
    {
      '$match': {
        'author.id': userId, 
        'metadata.nluData.entities.confidence': {
          '$gte': confidenceThreshold
        }
      }
    }, {
      '$unwind': {
        'path': '$metadata.nluData.entities', 
        'includeArrayIndex': 'string', 
        'preserveNullAndEmptyArrays': false
      }
    }, {
      '$match': {
        'metadata.nluData.entities.name': {
          '$in': [
            namesToMatch
          ]
        }
      }
    }, {
      '$project': {
        'entryId': '$_id', 
        'data': '$metadata.nluData.entities', 
        'dateCreated': 1,
        'name': '$metadata.nluData.entities.name'
      }
    }, {
      '$group': {
        '_id': '$name', 
        'mentions': {
          '$push': {
            'data': '$data', 
            'date': '$dateCreated', 
            'entryId': '$entryId'
          }
        }, 
        'entriesMentioning': {
          '$sum': 1
        }, 
        'totalMentions': {
          '$sum': '$data.count'
        }, 
        'confidence': {
          '$avg': '$data.confidence'
        }, 
        'relevance': {
          '$avg': '$data.relevance'
        }, 
        'sentimentScore': {
          '$avg': {
            '$multiply': [
              '$data.sentiment.score', '$data.confidence'
            ]
          }
        }, 
        'sadness': {
          '$avg': {
            '$multiply': [
              '$data.emotion.sadness', '$data.confidence'
            ]
          }
        }, 
        'joy': {
          '$avg': {
            '$multiply': [
              '$data.emotion.joy', '$data.confidence'
            ]
          }
        }, 
        'fear': {
          '$avg': {
            '$multiply': [
              '$data.emotion.fear', '$data.confidence'
            ]
          }
        }, 
        'disgust': {
          '$avg': {
            '$multiply': [
              '$data.emotion.disgust', '$data.confidence'
            ]
          }
        }, 
        'anger': {
          '$avg': {
            '$multiply': [
              '$data.emotion.anger', '$data.confidence'
            ]
          }
        }
      }
    }
  ];

  // if filtering by entity names, add the corresponding query into the match stage
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
}

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
        // "metadata.nluData.entities.confidence": {
        //   $gte: confidenceThreshold,
        // },
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
        'name': '$metadata.nluData.entities.name'
      },
    },
    {
      $group: {
        _id: "$name",
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

  // if filtering by entity names, add the corresponding query into the match stage
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

/**
 * Return all entities for the given user, threshold, and time period, sorted by mentions then relevance
 * @param {*} userId 
 * @param {*} confidenceThreshold 
 * @param {*} dateStart 
 * @param {*} dateEnd 
 */
exports.getAllEntitiesSorted = function(
  userId,
  confidenceThreshold,
  dateStart,
  dateEnd
) {
  return [
    {
      '$match': {
        "author.id": userId,
        // 'metadata.nluData.entities.confidence': {
        //   '$gte': confidenceThreshold
        // }
      }
    }, {
      '$unwind': {
        'path': '$metadata.nluData.entities', 
        'includeArrayIndex': 'string', 
        'preserveNullAndEmptyArrays': false
      }
    }, {
      '$project': {
        '_id': 0, 
        'data': '$metadata.nluData.entities',
        'name': '$metadata.nluData.entities.name'
      }
    }, {
      '$group': {
        '_id': '$name', 
        'categories': {
          '$addToSet': '$data.category'
        }, 
        'entriesMentioning': {
          '$sum': 1
        }, 
        'totalMentions': {
          '$sum': '$data.count'
        }, 
        'confidence': {
          '$avg': '$data.confidence'
        }, 
        'relevance': {
          '$avg': '$data.relevance'
        }, 
        'sentimentScore': {
          '$avg': {
            '$multiply': [
              '$data.sentiment.score', '$data.confidence'
            ]
          }
        }, 
        'sadness': {
          '$avg': {
            '$multiply': [
              '$data.emotion.sadness', '$data.confidence'
            ]
          }
        }, 
        'joy': {
          '$avg': {
            '$multiply': [
              '$data.emotion.joy', '$data.confidence'
            ]
          }
        }, 
        'fear': {
          '$avg': {
            '$multiply': [
              '$data.emotion.fear', '$data.confidence'
            ]
          }
        }, 
        'disgust': {
          '$avg': {
            '$multiply': [
              '$data.emotion.disgust', '$data.confidence'
            ]
          }
        }, 
        'anger': {
          '$avg': {
            '$multiply': [
              '$data.emotion.anger', '$data.confidence'
            ]
          }
        }
      }
    }, {
      '$sort': {
        'entriesMentioning': -1,
        'totalMentions': -1,
        'relevance': -1
      }
    }
  ];
}