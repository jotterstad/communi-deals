
/*
 * GET success page.
 */

exports.success = function(req, res){
  res.render('success', { title: 'Successful', deals: data });
};