exports.getTagNames = [
  {
    $match: {
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

exports.getTagsWithCounts = [
  {
    $match: {
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
