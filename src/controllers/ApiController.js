const { EntryOptionPlugin } = require("webpack");
const 
  User = require("../models/user"),
  Entry = require("../models/entry");

/**
 * Contains methods for handling API requests.
 */
class ApiController {

  constructor() {
    this.generalDbErrorMessage = "Internal server error while performing database operation";
  }

  /**
   * Sets the user's showSummaries based on value in the request.
   * 
   * Example: Send a request to turn this setting off. Assume showEntrySummaries has a initial value of true.
   * 
   * Request data example:
   * {
   *    showEntrySummaries: false;
   * }
   * 
   * Response example, if the database was successfuly updated:
   * {
   *    wasSuccessful: true,
   *    showEntrySummaries: false,
   *    error: {}
   * }
   * 
   * Or, if the database was not successfully updated:
   * {
   *    wasSuccessful: false,
   *    showEntrySummaries: true,
   *    error: {
   *      message: "Some text describing what happened";
   *    }
   * }
   * 
   * @param {Request} req 
   * @param {Response} res 
   */
  async setEntrySummaries(req, res) {
    let wasSuccessful = true;
    let error = {};

    if (req.body.showEntrySummaries == null) {
      wasSuccessful = false;
      error = {
        message: "Request body was missing or improperly formatted"
      }
    }

    let result = await User.findOneAndUpdate(
      {_id: req.user.id},
      {
        $set: {
          "settings.showEntrySummaries": req.body.showEntrySummaries
        }
      },
      { 
        new: true,
        rawResult: true 
      }
    );

    // let the client know if the request was completed successfuly or not
    if (!result.ok) {
      wasSuccessful = false;
      error = {
        message: this.generalDbErrorMessage
      }
    }

    if (result.lastErrorObject.n != 1) {
      wasSuccessful = false;
      error = {
        message: "No database object was updated"
      }
    }

    res.json({
      wasSuccessful: wasSuccessful,
      showEntrySummaries: result.value.settings.showEntrySummaries,
      error: error
    })
  }

  /**
   * 
   * Returns entries for the currently authenticated user, paginated based on the request parameter 'page'.
   * 
   * @param {Request} req 
   * @param {Response} res 
   * @param {number} page the page of entries that you want to get. Starts at zero and returns 20 entries per page.
   */
  async getEntries(req, res, page) {
    let wasSuccessful = true;
    let error = {};
    const pageSize = 20;

    if (req.body.page == null) {
      wasSuccessful = false;
      error = {
        message: "Request body was missing or improperly formatted"
      }
    }

    let result = await Entry.find(
      {"author.id": req.user.id},
      null,
      { 
        new: true,
        rawResult: true,
        skip: page * pageSize,
        limit: pageSize
      },
      function(err, docs) {
        if (err) {
          wasSuccessful = false;
          error = {
            message: this.generalDbErrorMessage
          }
        }
      }
    );

    res.json({
      wasSuccessful: wasSuccessful,
      entries: result,
      error: error
    });
  }

}

module.exports = ApiController;
