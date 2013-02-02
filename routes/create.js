
/*
 * GET create page.
 */

exports.create = function(req, res){
  res.render('create', { title: 'Create New Deal' });
};