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

    User.findByIdAndUpdate(
      req.user.id, {
        $set: {
          "settings.showEntrySummaries": req.body.showEntrySummaries
        }
      }, function (err, userResult) {
        // let the client know if the request was completed successfuly or not
        if (err) {
          wasSuccessful = false;
          errorMessage = "Internal server error while reading or writing to database";
        }

        res.json({
          wasSuccessful: wasSuccessful,
          showEntrySummaries: userResult.settings.showEntrySummaries
        })
      }
    );
  }

}

module.exports = ApiController;
