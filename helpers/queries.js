exports.getTagNames = function(userId) 
{
  return [
    {
      $match: {
        "author.id": userId,
        "tags.0": {
          $exists: true,
        },
      },
    },
    {
      $unwind: {
        path: "$tags",
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $group: {
        _id: "$tags",
      },
    },
    {
      $project: {
        _id: false,
        name: "$_id",
        entryCount: true,
      },
    },
  ];
}

/**
 * Return tags with counts, but only for entries containing a particular set of tags. Excludes the original queried tags.
 * @param {tags to filter by} tagArr
 */
exports.getTagsWithCounts = function (userId, tagArr, keyword) {

  let query;

  if (tagArr.length == 0) {
    query = [
      {
        $match: {
          "author.id": userId,
          "tags.0": {
            $exists: true,
          },
        },
      },
      {
        $unwind: {
          path: "$tags",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $group: {
          _id: "$tags",
          entryCount: {
            $sum: 1,
          },
        },
      },
      {
        $project: {
          _id: false,
          name: "$_id",
          entryCount: true,
        },
      },
    ];
  } else {
    // if there are tags to filter by, return filtered tags
    query = [
      {
        $match: {
          tags: {
            $all: tagArr,
          },
        },
      },
      {
        $unwind: {
          path: "$tags",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $group: {
          _id: "$tags",
          entryCount: {
            $sum: 1,
          },
        },
      },
      {
        $project: {
          _id: false,
          name: "$_id",
          entryCount: true,
        },
      },
      {
        $match: {
          name: {
            $nin: tagArr,
          },
        },
      },
    ];
  }

  // if we are searching by keyword, add that onto the query
  if (keyword != null) {
    query[0]["$match"]["$text"] = { $search: keyword };
  }

  return query;
};
