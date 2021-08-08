const 
  User = require("../models/user")

class ApiController {

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
  static async setEntrySummaries(req, res) {
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
        message: "Internal server error while reading or writing to database"
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

}

module.exports = ApiController;
