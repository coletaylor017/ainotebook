const 
  User = require("../models/user")

class ApiController {

  /**
   * Sets the user's showSummaries based on value in the request.
   * 
   * Example: Send a request to turn this setting off.
   * 
   * Request data example:
   * {
   *    showEntrySummaries: false;
   * }
   * 
   * Response example, if the database was successfuly updated:
   * {
   *    wasSuccessful: true,
   *    showEntrySummaries: false
   * }
   * 
   * Or, if the database was not successfully updated:
   * {
   *    wasSuccessful: false,
   *    showEntrySummaries: true
   * }
   * 
   * @param {Request} req 
   * @param {Response} res 
   */
  static async setEntrySummaries(req, res) {
    let wasSuccessful = true;
    let errorMessage = "";

    if (req.body.showEntrySummaries == null) {
      wasSuccessful = false;
      errorMessage = "Request body was missing or improperly formatted";
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
      errorMessage = "Internal server error while reading or writing to database";
    }

    if (result.lastErrorObject.n != 1) {
      wasSuccessful = false;
      errorMessage = "No database obiject was updated";
    }

    res.json({
      wasSuccessful: wasSuccessful,
      showEntrySummaries: result.value.settings.showEntrySummaries
    })
  }

}

module.exports = ApiController;
