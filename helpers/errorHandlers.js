exports.dbError = function (res, err) {
  console.log("Now displaying DB error page with err: ", err);
  res.render("dbError", { err: err });
};
